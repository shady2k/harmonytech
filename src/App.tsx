import { useCallback, useEffect, type ReactElement } from 'react'
import { DatabaseProvider, useDatabaseContext } from '@/contexts/DatabaseContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { useUIStore } from '@/stores/ui.store'
import { useCaptureStore } from '@/stores'
import { useSettingsStore } from '@/stores/settings.store'
import { CaptureModal } from '@/components/capture/CaptureModal'
import { ThoughtsList } from '@/components/thoughts/ThoughtsList'
import { TaskList } from '@/components/tasks/TaskList'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { WhatToDoNext } from '@/components/recommendations/WhatToDoNext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAI } from '@/hooks/useAI'

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
  const { apiKey, subscribeToDatabase } = useSettingsStore()
  const { extractTasks, processVoice, toExtractedItems } = useAI()

  // Load and subscribe to settings from database
  useEffect(() => {
    if (db === null) return
    const unsubscribe = subscribeToDatabase(db)
    return unsubscribe
  }, [db, subscribeToDatabase])

  // Process text when processingState changes to 'extracting'
  useEffect(() => {
    if (processingState !== 'extracting' || inputText.trim() === '') {
      return
    }

    const processText = async (): Promise<void> => {
      // If no API key, create based on current view
      if (!apiKey) {
        if (activeView === 'thoughts') {
          // Create a thought
          setExtractedItems({
            tasks: [],
            thoughts: [{ content: inputText, tags: [] }],
          })
        } else {
          // Create a task
          setExtractedItems({
            tasks: [
              {
                rawInput: inputText,
                nextAction: inputText,
                suggestions: {
                  suggestedContext: 'anywhere',
                  suggestedEnergy: 'medium',
                  suggestedTimeEstimate: 15,
                  confidence: 0.5,
                },
              },
            ],
            thoughts: [],
          })
        }
        setProcessingState('done')
        return
      }

      // With API key, use AI extraction
      try {
        const result = await extractTasks(inputText)
        setProcessingState('suggesting')
        const items = await toExtractedItems(result)
        setExtractedItems(items)
        setProcessingState('done')
      } catch {
        // Fallback based on current view
        if (activeView === 'thoughts') {
          setExtractedItems({
            tasks: [],
            thoughts: [{ content: inputText, tags: [] }],
          })
        } else {
          setExtractedItems({
            tasks: [
              {
                rawInput: inputText,
                nextAction: inputText,
                suggestions: {
                  suggestedContext: 'anywhere',
                  suggestedEnergy: 'medium',
                  suggestedTimeEstimate: 15,
                  confidence: 0.5,
                },
              },
            ],
            thoughts: [],
          })
        }
        setProcessingState('done')
      }
    }

    void processText()
  }, [processingState, inputText, apiKey, activeView, extractTasks, toExtractedItems, setExtractedItems, setProcessingState])

  // Process voice when processingState changes to 'transcribing'
  useEffect(() => {
    if (processingState !== 'transcribing' || audioBlob === null) {
      return
    }

    const processAudio = async (): Promise<void> => {
      // Voice requires API key
      if (!apiKey) {
        setExtractedItems({
          tasks: [],
          thoughts: [{ content: 'Voice processing requires an API key. Please add one in Settings.', tags: [] }],
        })
        setProcessingState('done')
        return
      }

      try {
        const result = await processVoice(audioBlob)
        setProcessingState('suggesting')
        const items = await toExtractedItems(result)
        setExtractedItems(items)
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
  }, [processingState, audioBlob, apiKey, processVoice, toExtractedItems, setExtractedItems, setProcessingState])

  const handleSave = useCallback(async (): Promise<void> => {
    if (db === null || extractedItems === null) {
      return
    }

    const now = new Date().toISOString()

    // Save tasks
    for (const task of extractedItems.tasks) {
      await db.tasks.insert({
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        rawInput: task.rawInput,
        nextAction: task.nextAction,
        context: task.suggestions.suggestedContext ?? 'anywhere',
        energy: task.suggestions.suggestedEnergy ?? 'medium',
        timeEstimate: task.suggestions.suggestedTimeEstimate,
        project: task.suggestions.suggestedProject,
        isSomedayMaybe: false,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Save thoughts
    for (const thought of extractedItems.thoughts) {
      await db.thoughts.insert({
        id: `thought-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content: thought.content,
        tags: thought.tags,
        createdAt: now,
        updatedAt: now,
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
            onClick={(): void => window.location.reload()}
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
      case 'inbox':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inbox</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get personalized task recommendations
              </p>
            </div>
            <WhatToDoNext />
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
      <AppLayout
        activeView={activeView}
        onViewChange={setActiveView}
        onCaptureClick={openCapture}
      >
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
      <AppContent />
    </DatabaseProvider>
  )
}

export default App
