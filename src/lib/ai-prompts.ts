import propertySuggestionPrompt from './prompts/property-suggestion.txt?raw'
import whatToDoNextPrompt from './prompts/what-to-do-next.txt?raw'
import voiceTranscriptionPrompt from './prompts/voice-transcription.txt?raw'
import { TASK_EXTRACTION_PROMPT_GENERATED } from './prompts/generate-prompt'

// Task extraction prompt is now generated from schema metadata
// This ensures the prompt always matches the schema definition
export const TASK_EXTRACTION_PROMPT = TASK_EXTRACTION_PROMPT_GENERATED
export const PROPERTY_SUGGESTION_PROMPT = propertySuggestionPrompt
export const WHAT_TO_DO_NEXT_PROMPT = whatToDoNextPrompt
export const VOICE_TRANSCRIPTION_PROMPT = voiceTranscriptionPrompt
