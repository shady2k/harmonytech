import type { DocumentTransformer, CollectionTransformers } from './types'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Strips RxDB internal fields from a document.
 */
function stripInternalFields(doc: Record<string, unknown>): Record<string, unknown> {
  const result = { ...doc }
  delete result['_rev']
  delete result['_meta']
  delete result['_deleted']
  delete result['_attachments']
  return result
}

/**
 * Removes undefined values from an object.
 * Dexie.js rejects documents with undefined values.
 */
function removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

/**
 * Normalizes a date value to ISO string.
 */
function normalizeDate(value: unknown): string {
  if (typeof value === 'string' && value.length > 0) {
    // Validate it's a valid date string
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return value
    }
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString()
  }
  // Fallback to current time
  return new Date().toISOString()
}

/**
 * Ensures a value is a string, with fallback.
 */
function ensureString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  return fallback
}

/**
 * Ensures a value is a boolean, with fallback.
 */
function ensureBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  return fallback
}

/**
 * Ensures a value is a number, with fallback.
 */
function ensureNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value
  return fallback
}

/**
 * Ensures a value is an array, with fallback.
 */
function ensureArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[]
  return fallback
}

// ============================================================================
// Task Transformer
// ============================================================================

const transformTask: DocumentTransformer = (doc) => {
  try {
    const cleaned = stripInternalFields(doc)

    // Required fields with defaults
    const task: Record<string, unknown> = {
      id: ensureString(cleaned['id']),
      rawInput: ensureString(cleaned['rawInput']),
      nextAction: ensureString(cleaned['nextAction']),
      context: validateContext(cleaned['context']),
      energy: validateEnergy(cleaned['energy']),
      timeEstimate: ensureNumber(cleaned['timeEstimate'], 15),
      isSomedayMaybe: ensureBoolean(cleaned['isSomedayMaybe']),
      isCompleted: ensureBoolean(cleaned['isCompleted']),
      createdAt: normalizeDate(cleaned['createdAt']),
      updatedAt: normalizeDate(cleaned['updatedAt']),
      // Required for Dexie index - must be string, not undefined
      sourceThoughtId: ensureString(cleaned['sourceThoughtId'], ''),
    }

    // Optional fields
    if (typeof cleaned['deadline'] === 'string' && cleaned['deadline'].length > 0) {
      task['deadline'] = cleaned['deadline']
    }
    if (typeof cleaned['project'] === 'string' && cleaned['project'].length > 0) {
      task['project'] = cleaned['project']
    }
    if (typeof cleaned['completedAt'] === 'string' && cleaned['completedAt'].length > 0) {
      task['completedAt'] = cleaned['completedAt']
    }
    if (cleaned['aiSuggestions'] !== undefined && cleaned['aiSuggestions'] !== null) {
      task['aiSuggestions'] = cleaned['aiSuggestions']
    }
    if (cleaned['recurrence'] !== undefined && cleaned['recurrence'] !== null) {
      task['recurrence'] = cleaned['recurrence']
    }

    // Validate required ID
    if (task['id'] === '') {
      return null // Skip docs without ID
    }

    return removeUndefined(task)
  } catch {
    return null // Skip malformed docs
  }
}

function validateContext(value: unknown): string {
  const valid = ['computer', 'phone', 'errands', 'home', 'anywhere']
  if (typeof value === 'string' && valid.includes(value)) {
    return value
  }
  return 'anywhere' // Default
}

function validateEnergy(value: unknown): string {
  const valid = ['high', 'medium', 'low']
  if (typeof value === 'string' && valid.includes(value)) {
    return value
  }
  return 'medium' // Default
}

// ============================================================================
// Thought Transformer
// ============================================================================

const transformThought: DocumentTransformer = (doc) => {
  try {
    const cleaned = stripInternalFields(doc)

    const thought: Record<string, unknown> = {
      id: ensureString(cleaned['id']),
      content: ensureString(cleaned['content']),
      tags: ensureArray<string>(cleaned['tags'], []),
      createdAt: normalizeDate(cleaned['createdAt']),
      updatedAt: normalizeDate(cleaned['updatedAt']),
      linkedTaskIds: ensureArray<string>(cleaned['linkedTaskIds'], []),
      aiProcessed: ensureBoolean(cleaned['aiProcessed'], true), // Default true for migrated
    }

    // Optional fields
    if (typeof cleaned['linkedProject'] === 'string' && cleaned['linkedProject'].length > 0) {
      thought['linkedProject'] = cleaned['linkedProject']
    }
    if (
      typeof cleaned['sourceRecordingId'] === 'string' &&
      cleaned['sourceRecordingId'].length > 0
    ) {
      thought['sourceRecordingId'] = cleaned['sourceRecordingId']
    }

    // Validate required ID
    if (thought['id'] === '') {
      return null
    }

    return removeUndefined(thought)
  } catch {
    return null
  }
}

// ============================================================================
// Voice Recording Transformer
// ============================================================================

const transformVoiceRecording: DocumentTransformer = (doc) => {
  try {
    const cleaned = stripInternalFields(doc)

    const recording: Record<string, unknown> = {
      id: ensureString(cleaned['id']),
      audioData: ensureString(cleaned['audioData']),
      createdAt: normalizeDate(cleaned['createdAt']),
      extractedTaskIds: ensureArray<string>(cleaned['extractedTaskIds'], []),
      extractedThoughtIds: ensureArray<string>(cleaned['extractedThoughtIds'], []),
    }

    // Optional fields
    if (typeof cleaned['transcript'] === 'string') {
      recording['transcript'] = cleaned['transcript']
    }
    if (typeof cleaned['processedAt'] === 'string' && cleaned['processedAt'].length > 0) {
      recording['processedAt'] = cleaned['processedAt']
    }

    // Validate required ID
    if (recording['id'] === '') {
      return null
    }

    return removeUndefined(recording)
  } catch {
    return null
  }
}

// ============================================================================
// Project Transformer
// ============================================================================

const transformProject: DocumentTransformer = (doc) => {
  try {
    const cleaned = stripInternalFields(doc)

    const project: Record<string, unknown> = {
      id: ensureString(cleaned['id']),
      name: ensureString(cleaned['name']),
      isActive: ensureBoolean(cleaned['isActive'], true),
      createdAt: normalizeDate(cleaned['createdAt']),
      updatedAt: normalizeDate(cleaned['updatedAt']),
    }

    // Optional fields
    if (typeof cleaned['description'] === 'string') {
      project['description'] = cleaned['description']
    }

    // Validate required ID and name
    if (project['id'] === '' || project['name'] === '') {
      return null
    }

    return removeUndefined(project)
  } catch {
    return null
  }
}

// ============================================================================
// Settings Transformer
// ============================================================================

const transformSettings: DocumentTransformer = (doc) => {
  try {
    const cleaned = stripInternalFields(doc)

    const settings: Record<string, unknown> = {
      id: ensureString(cleaned['id'], 'user-settings'),
      aiProvider: validateAIProvider(cleaned['aiProvider']),
      theme: validateTheme(cleaned['theme']),
      defaultContext: validateContext(cleaned['defaultContext']),
      defaultEnergy: validateEnergy(cleaned['defaultEnergy']),
    }

    // Optional API keys and models
    if (typeof cleaned['openRouterApiKey'] === 'string' && cleaned['openRouterApiKey'].length > 0) {
      settings['openRouterApiKey'] = cleaned['openRouterApiKey']
    }
    if (typeof cleaned['yandexApiKey'] === 'string' && cleaned['yandexApiKey'].length > 0) {
      settings['yandexApiKey'] = cleaned['yandexApiKey']
    }
    if (typeof cleaned['yandexFolderId'] === 'string' && cleaned['yandexFolderId'].length > 0) {
      settings['yandexFolderId'] = cleaned['yandexFolderId']
    }
    if (typeof cleaned['textModel'] === 'string' && cleaned['textModel'].length > 0) {
      settings['textModel'] = cleaned['textModel']
    }
    if (typeof cleaned['voiceModel'] === 'string' && cleaned['voiceModel'].length > 0) {
      settings['voiceModel'] = cleaned['voiceModel']
    }

    return removeUndefined(settings)
  } catch {
    return null
  }
}

function validateAIProvider(value: unknown): string {
  const valid = ['openrouter', 'yandex']
  if (typeof value === 'string' && valid.includes(value)) {
    return value
  }
  return 'openrouter' // Default
}

function validateTheme(value: unknown): string {
  const valid = ['light', 'dark', 'system']
  if (typeof value === 'string' && valid.includes(value)) {
    return value
  }
  return 'system' // Default
}

// ============================================================================
// Export All Transformers
// ============================================================================

export function createTransformers(): CollectionTransformers {
  return {
    tasks: transformTask,
    thoughts: transformThought,
    voice_recordings: transformVoiceRecording,
    projects: transformProject,
    settings: transformSettings,
  }
}

export {
  transformTask,
  transformThought,
  transformVoiceRecording,
  transformProject,
  transformSettings,
}
