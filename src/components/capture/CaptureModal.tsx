import { useEffect, useCallback, useRef, type ReactElement } from 'react'
import { useCaptureStore, type ProcessingState } from '@/stores'
import { TextCapture } from './TextCapture'
import { VoiceCapture } from './VoiceCapture'
import { ProcessingIndicator } from './ProcessingIndicator'
import { NavIcon } from '@/components/layout/NavIcon'

interface CaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function CaptureModal({ isOpen, onClose, onSave }: CaptureModalProps): ReactElement | null {
  const { processingState, isRecording, extractedItems, reset } = useCaptureStore()
  const hasSavedRef = useRef(false)

  const handleClose = useCallback((): void => {
    reset()
    onClose()
  }, [reset, onClose])

  const handleSave = useCallback((): void => {
    onSave()
    handleClose()
  }, [onSave, handleClose])

  // Auto-save when processing is done - no approval needed per spec
  useEffect(() => {
    if (processingState === 'done' && extractedItems !== null && !hasSavedRef.current) {
      hasSavedRef.current = true
      handleSave()
    }
  }, [processingState, extractedItems, handleSave])

  // Reset the saved flag when modal opens
  useEffect(() => {
    if (isOpen) {
      hasSavedRef.current = false
    }
  }, [isOpen])

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
    // Show processing indicator during AI processing (including 'done' state briefly before auto-save)
    if (isProcessing(processingState) || processingState === 'done') {
      return <ProcessingIndicator state={processingState} />
    }

    // Show capture input (text or voice)
    return (
      <div className="space-y-4">
        <TextCapture />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              or
            </span>
          </div>
        </div>
        <VoiceCapture />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isRecording ? undefined : handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl dark:bg-gray-900 md:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-modal-title"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="capture-modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {getModalTitle(processingState)}
          </h2>
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

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  )
}

function isProcessing(state: ProcessingState): boolean {
  return state === 'transcribing' || state === 'extracting' || state === 'suggesting'
}

function getModalTitle(state: ProcessingState): string {
  if (state === 'done') {
    return 'Saving...'
  }
  if (isProcessing(state)) {
    return 'Processing...'
  }
  return 'Capture'
}
