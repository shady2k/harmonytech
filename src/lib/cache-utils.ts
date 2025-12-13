/**
 * Utilities for AI response caching
 */

/**
 * Simple hash function for generating cache keys
 * Uses djb2 algorithm - fast and low collision rate for strings
 */
export function hashString(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  // Convert to unsigned 32-bit integer and then to hex
  return (hash >>> 0).toString(16)
}

type CacheType = 'extract' | 'props' | 'recs'

/**
 * Create a consistent cache key from type and parameters
 */
export function createCacheKey(type: CacheType, ...params: string[]): string {
  const paramString = params.join('|')
  return `${type}:${hashString(paramString)}`
}

/**
 * Create cache key for task extraction
 */
export function extractionCacheKey(text: string): string {
  return createCacheKey('extract', text.trim().toLowerCase())
}

/**
 * Create cache key for property suggestions
 */
export function propertiesCacheKey(taskText: string, projectIds: string[]): string {
  const sortedProjects = [...projectIds].sort().join(',')
  return createCacheKey('props', taskText.trim().toLowerCase(), sortedProjects)
}

/**
 * Create cache key for recommendations
 */
export function recommendationsCacheKey(
  timeAvailable: number,
  energyLevel: string,
  location: string,
  taskIds: string[]
): string {
  const sortedTaskIds = [...taskIds].sort().join(',')
  return createCacheKey('recs', String(timeAvailable), energyLevel, location, sortedTaskIds)
}
