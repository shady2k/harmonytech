/**
 * Data Clear Service - Clear user data
 */
import type { HarmonyDatabase } from './dexie-database'
import { DEFAULT_SETTINGS } from './dexie-database'

export interface ClearProgress {
  step: string
}

/**
 * Clear user data (tasks, thoughts, projects) but keep settings
 */
export async function clearUserData(
  db: HarmonyDatabase,
  onProgress?: (progress: ClearProgress) => void
): Promise<void> {
  await db.transaction('rw', [db.tasks, db.thoughts, db.projects], async () => {
    onProgress?.({ step: 'Clearing tasks...' })
    await db.tasks.clear()

    onProgress?.({ step: 'Clearing thoughts...' })
    await db.thoughts.clear()

    onProgress?.({ step: 'Clearing projects...' })
    await db.projects.clear()

    onProgress?.({ step: 'Done!' })
  })
}

/**
 * Clear all data and reset settings to defaults (factory reset)
 */
export async function clearAllData(
  db: HarmonyDatabase,
  onProgress?: (progress: ClearProgress) => void
): Promise<void> {
  await db.transaction('rw', [db.tasks, db.thoughts, db.projects, db.settings], async () => {
    onProgress?.({ step: 'Clearing tasks...' })
    await db.tasks.clear()

    onProgress?.({ step: 'Clearing thoughts...' })
    await db.thoughts.clear()

    onProgress?.({ step: 'Clearing projects...' })
    await db.projects.clear()

    onProgress?.({ step: 'Resetting settings...' })
    await db.settings.clear()
    await db.settings.add({
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString(),
    })

    onProgress?.({ step: 'Done!' })
  })
}
