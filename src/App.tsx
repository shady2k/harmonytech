import { useCallback, useEffect, type ReactElement } from 'react'
import { DatabaseProvider, useDatabaseContext } from '@/contexts/DatabaseContext'
import { AIStatusProvider } from '@/contexts/AIStatusContext'
import { SyncProvider } from '@/contexts/SyncProvider'
import { AppLayout } from '@/components/layout/AppLayout'
import { useUIStore } from '@/stores/ui.store'
import { useCaptureStore } from '@/stores'
import { useSettingsStore } from '@/stores/settings.store'
import { CaptureModal, type ManualTaskData, type ManualThoughtData } from '@/components/capture'
import { ThoughtsList } from '@/components/thoughts/ThoughtsList'
import { TaskList } from '@/components/tasks/TaskList'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { WhatToDoNext } from '@/components/recommendations/WhatToDoNext'
import { InboxView } from '@/components/inbox/InboxView'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal'
import { useBackgroundAI } from '@/hooks/useBackgroundAI'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { getDeviceId } from '@/lib/sync'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = (): void => {
      const dataUrl = reader.result as string
      const parts = dataUrl.split(',')
      resolve(parts.length > 1 ? parts[1] : '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function AppContent(): ReactElement {
  const { db, isLoading: isDbLoading, error: dbError } = useDatabaseContext()
  const { activeView, setActiveView, isCaptureOpen, openCapture, closeCapture } = useUIStore()
  const { isHelpModalOpen, closeHelpModal } = useKeyboardShortcuts()
  const {
    inputText,
    audioBlob,
    processingState,
    extractedItems,
    setProcessingState,
    setExtractedItems,
    reset: resetCapture,
  } = useCaptureStore()
  const { subscribeToDatabase } = useSettingsStore()

  // Background AI processor for thought-first capture
  useBackgroundAI()

  // Load and subscribe to settings from database
  useEffect(() => {
    const unsubscribe = subscribeToDatabase(db)
    return unsubscribe
  }, [db, subscribeToDatabase])

  // Process text when processingState changes to 'extracting'
  // Thought-first: always create a thought, AI processes in background
  useEffect(() => {
    if (processingState !== 'extracting' || inputText.trim() === '') {
      return
    }

    // Always create a thought first - AI will process it in the background
    setExtractedItems({
      tasks: [],
      thoughts: [{ content: inputText, tags: [] }],
    })
    setProcessingState('done')
  }, [processingState, inputText, setExtractedItems, setProcessingState])

  // Process voice when processingState changes to 'transcribing'
  // Save recording immediately, transcription happens in background
  // NOTE: Thought is NOT created here - it's created by useBackgroundAI on successful transcription
  useEffect(() => {
    if (processingState !== 'transcribing' || audioBlob === null) {
      return
    }

    const saveRecording = async (): Promise<void> => {
      const now = new Date().toISOString()
      const recordingId = `recording-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`

      // Convert blob to base64 for storage
      const audioData = await blobToBase64(audioBlob)

      // Save voice recording with pending status (no thought yet - created on successful transcription)
      await db.voiceRecordings.add({
        id: recordingId,
        audioData,
        mimeType: audioBlob.type,
        status: 'pending',
        createdByDeviceId: getDeviceId(),
        createdAt: now,
      })

      // Close modal - transcription will happen in background
      resetCapture()
      closeCapture()
    }

    void saveRecording()
  }, [processingState, audioBlob, db, resetCapture, closeCapture])

  const handleSave = useCallback(async (): Promise<void> => {
    if (extractedItems === null) {
      return
    }

    const now = new Date().toISOString()

    // Save tasks
    for (const task of extractedItems.tasks) {
      await db.tasks.add({
        id: `task-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`,
        rawInput: task.rawInput,
        nextAction: task.nextAction,
        context: task.suggestions.suggestedContext ?? 'anywhere',
        energy: task.suggestions.suggestedEnergy ?? 'medium',
        timeEstimate: task.suggestions.suggestedTimeEstimate ?? 15,
        project: task.suggestions.suggestedProject,
        scheduledStart: task.scheduledStart,
        scheduledEnd: task.scheduledEnd,
        recurrence: task.recurrence,
        isSomedayMaybe: false,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
        sourceThoughtId: '',
      })
    }

    // Save thoughts with aiProcessed=false so background AI can process them
    for (const thought of extractedItems.thoughts) {
      await db.thoughts.add({
        id: `thought-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`,
        content: thought.content,
        tags: thought.tags,
        linkedTaskIds: [],
        aiProcessed: false,
        processingStatus: 'unprocessed',
        createdAt: now,
        updatedAt: now,
        createdByDeviceId: getDeviceId(), // Only this device should process this thought
      })
    }

    resetCapture()
    closeCapture()
  }, [db, extractedItems, resetCapture, closeCapture])

  const handleCloseCapture = useCallback((): void => {
    resetCapture()
    closeCapture()
  }, [resetCapture, closeCapture])

  const handleManualSave = useCallback(
    async (task: ManualTaskData | null, thought: ManualThoughtData | null): Promise<void> => {
      const now = new Date().toISOString()

      // Save task directly (no AI processing needed)
      if (task !== null) {
        await db.tasks.add({
          id: `task-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`,
          rawInput: task.rawInput,
          nextAction: task.nextAction,
          context: task.context,
          energy: task.energy,
          timeEstimate: task.timeEstimate,
          project: task.project,
          scheduledStart: task.scheduledStart,
          scheduledEnd: task.scheduledEnd,
          deadline: task.deadline,
          recurrence: task.recurrence,
          isSomedayMaybe: task.isSomedayMaybe,
          isCompleted: false,
          createdAt: now,
          updatedAt: now,
          sourceThoughtId: '',
        })
      }

      // Save thought directly (aiProcessed=true since user manually created it)
      if (thought !== null) {
        await db.thoughts.add({
          id: `thought-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`,
          content: thought.content,
          tags: thought.tags,
          linkedTaskIds: [],
          aiProcessed: true,
          processingStatus: 'processed',
          createdAt: now,
          updatedAt: now,
          createdByDeviceId: getDeviceId(),
        })
      }
    },
    [db]
  )

  // Show loading while database initializes
  if (isDbLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" label="Loading..." />
      </div>
    )
  }

  // Show error if database failed
  if (dbError !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Database Error</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{dbError.message}</p>
          <button
            onClick={(): void => {
              window.location.reload()
            }}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  const renderView = (): ReactElement => {
    switch (activeView) {
      case 'home':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Home</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get personalized task recommendations
              </p>
            </div>
            <WhatToDoNext />
          </div>
        )
      case 'inbox':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inbox</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Items that need your attention
              </p>
            </div>
            <InboxView />
          </div>
        )
      case 'tasks':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your tasks and projects
              </p>
            </div>
            <TaskList showFilters groupByProject />
          </div>
        )
      case 'thoughts':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thoughts</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Capture and organize your ideas
              </p>
            </div>
            <ThoughtsList />
          </div>
        )
      case 'settings':
        return <SettingsPage />
      default:
        return <div>Unknown view</div>
    }
  }

  return (
    <>
      <OfflineBanner />
      <AppLayout activeView={activeView} onViewChange={setActiveView} onCaptureClick={openCapture}>
        {renderView()}
      </AppLayout>

      <CaptureModal
        isOpen={isCaptureOpen}
        onClose={handleCloseCapture}
        onSave={(): void => {
          void handleSave()
        }}
        onManualSave={handleManualSave}
      />

      <KeyboardShortcutsModal isOpen={isHelpModalOpen} onClose={closeHelpModal} />
    </>
  )
}

function App(): ReactElement {
  return (
    <DatabaseProvider>
      <AIStatusProvider>
        <SyncProvider>
          <AppContent />
        </SyncProvider>
      </AIStatusProvider>
    </DatabaseProvider>
  )
}

export default App
