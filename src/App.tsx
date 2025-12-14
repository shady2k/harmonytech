import { useCallback, useEffect, type ReactElement } from 'react'
import { DatabaseProvider, useDatabaseContext } from '@/contexts/DatabaseContext'
import { AIStatusProvider } from '@/contexts/AIStatusContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { useUIStore } from '@/stores/ui.store'
import { useCaptureStore } from '@/stores'
import { useSettingsStore } from '@/stores/settings.store'
import { CaptureModal } from '@/components/capture/CaptureModal'
import { ThoughtsList } from '@/components/thoughts/ThoughtsList'
import { TaskList } from '@/components/tasks/TaskList'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { WhatToDoNext } from '@/components/recommendations/WhatToDoNext'
import { InboxView } from '@/components/inbox/InboxView'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { useAI } from '@/hooks/useAI'
import { useBackgroundAI } from '@/hooks/useBackgroundAI'
import { getDeviceId } from '@/lib/sync'

function AppContent(): ReactElement {
  const { db, isLoading: isDbLoading, error: dbError } = useDatabaseContext()
  const { activeView, setActiveView, isCaptureOpen, openCapture, closeCapture } = useUIStore()
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
  const { processVoice, isAIAvailable } = useAI()

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
  // Thought-first: transcribe and create thought, AI extracts tasks in background
  useEffect(() => {
    if (processingState !== 'transcribing' || audioBlob === null) {
      return
    }

    const processAudio = async (): Promise<void> => {
      // Voice requires AI for transcription
      if (!isAIAvailable) {
        // Save a placeholder thought - the actual audio cannot be stored without AI transcription
        // User is informed they need to configure AI for voice capture
        setExtractedItems({
          tasks: [],
          thoughts: [
            {
              content:
                '[Voice recording] Unable to transcribe - AI provider not configured. Please configure an AI provider in Settings for voice capture.',
              tags: ['voice-pending'],
            },
          ],
        })
        setProcessingState('done')
        return
      }

      try {
        const result = await processVoice(audioBlob)
        // Create a thought from the transcript - AI will extract tasks in background
        setExtractedItems({
          tasks: [],
          thoughts: [{ content: result.transcript, tags: [] }],
        })
        setProcessingState('done')
      } catch (err) {
        // Show error as a thought
        const message = err instanceof Error ? err.message : 'Voice processing failed'
        setExtractedItems({
          tasks: [],
          thoughts: [{ content: `Error: ${message}`, tags: [] }],
        })
        setProcessingState('done')
      }
    }

    void processAudio()
  }, [
    processingState,
    audioBlob,
    isAIAvailable,
    processVoice,
    setExtractedItems,
    setProcessingState,
  ])

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
      />
    </>
  )
}

function App(): ReactElement {
  return (
    <DatabaseProvider>
      <AIStatusProvider>
        <AppContent />
      </AIStatusProvider>
    </DatabaseProvider>
  )
}

export default App
