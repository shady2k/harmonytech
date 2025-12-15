import { useEffect, useCallback, useRef, useState, type ReactElement } from 'react'
import { useCaptureStore, type ProcessingState } from '@/stores'
import { useUIStore } from '@/stores/ui.store'
import { useAIStatus } from '@/hooks/useAIStatus'
import { TextCapture } from './TextCapture'
import { VoiceCapture } from './VoiceCapture'
import { ProcessingIndicator } from './ProcessingIndicator'
import { ManualCapture, type ManualTaskData, type ManualThoughtData } from './ManualCapture'
import { CaptureModeSwitcher } from './CaptureModeSwitcher'
import { NavIcon } from '@/components/layout/NavIcon'

interface CaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onManualSave: (task: ManualTaskData | null, thought: ManualThoughtData | null) => void
}

export function CaptureModal({
  isOpen,
  onClose,
  onSave,
  onManualSave,
}: CaptureModalProps): ReactElement | null {
  const { processingState, isRecording, extractedItems, reset } = useCaptureStore()
  const { captureAssistMode, setCaptureAssistMode, captureItemType } = useUIStore()
  const { isAIAvailable } = useAIStatus()
  const [showVoice, setShowVoice] = useState(false)
  const [autoStartRecording, setAutoStartRecording] = useState(false)
  const hasSavedRef = useRef(false)

  const handleClose = useCallback((): void => {
    reset()
    setShowVoice(false)
    setAutoStartRecording(false)
    onClose()
  }, [reset, onClose])

  const handleMicClick = useCallback((autoStart = false): void => {
    setShowVoice(true)
    setAutoStartRecording(autoStart)
  }, [])

  const handleSave = useCallback((): void => {
    onSave()
    handleClose()
  }, [onSave, handleClose])

  const handleManualSave = useCallback(
    (task: ManualTaskData | null, thought: ManualThoughtData | null): void => {
      onManualSave(task, thought)
      handleClose()
    },
    [onManualSave, handleClose]
  )

  // Auto-save when processing is done - no approval needed per spec
  useEffect(() => {
    if (processingState === 'done' && extractedItems !== null && !hasSavedRef.current) {
      hasSavedRef.current = true
      // Defer to avoid cascading renders
      queueMicrotask(() => {
        handleSave()
      })
    }
  }, [processingState, extractedItems, handleSave])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      hasSavedRef.current = false
      queueMicrotask(() => {
        setShowVoice(false)
        setAutoStartRecording(false)
      })
      // Auto-switch to manual mode if AI is not available
      if (!isAIAvailable && captureAssistMode === 'ai') {
        setCaptureAssistMode('manual')
      }
    }
  }, [isOpen, isAIAvailable, captureAssistMode, setCaptureAssistMode])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) {
      return (): void => {
        // Empty cleanup when modal is closed
      }
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isRecording) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isRecording, handleClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return (): void => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const renderContent = (): ReactElement => {
    // Manual mode - show ManualCapture form
    if (captureAssistMode === 'manual') {
      return <ManualCapture onSave={handleManualSave} onCancel={handleClose} />
    }

    // Show processing indicator during AI processing (including 'done' state briefly before auto-save)
    if (isProcessing(processingState) || processingState === 'done') {
      return <ProcessingIndicator state={processingState} />
    }

    // Show voice capture when mic is clicked or recording
    if (showVoice || isRecording) {
      return <VoiceCapture autoStart={autoStartRecording} />
    }

    // Show text capture with inline mic button
    return (
      <TextCapture
        onMicClick={(autoStart): void => {
          handleMicClick(autoStart)
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isRecording ? undefined : handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative flex max-h-[90vh] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-modal-title"
      >
        {/* Header - fixed at top */}
        <div className="mb-6 flex shrink-0 items-center justify-between">
          <h2
            id="capture-modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {getModalTitle(processingState, captureAssistMode, captureItemType)}
          </h2>
          <div className="flex items-center gap-2">
            <CaptureModeSwitcher
              mode={captureAssistMode}
              onModeChange={setCaptureAssistMode}
              isAIAvailable={isAIAvailable}
            />
            <button
              type="button"
              onClick={handleClose}
              disabled={isRecording}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <NavIcon name="close" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content - flex/min-h-0 allow child to manage scroll + sticky regions */}
        <div className="flex min-h-0 flex-1 flex-col">{renderContent()}</div>
      </div>
    </div>
  )
}

function isProcessing(state: ProcessingState): boolean {
  return state === 'transcribing' || state === 'extracting' || state === 'suggesting'
}

function getModalTitle(
  state: ProcessingState,
  assistMode: 'ai' | 'manual',
  itemType: 'task' | 'thought' | 'both'
): string {
  if (state === 'done') {
    return 'Saving...'
  }
  if (isProcessing(state)) {
    return 'Processing...'
  }
  if (assistMode === 'manual') {
    switch (itemType) {
      case 'task':
        return 'Add Task'
      case 'thought':
        return 'Add Thought'
      case 'both':
        return 'Add Task & Thought'
    }
  }
  return 'Capture'
}
