/**
 * Data Import Service - Import user data from JSON
 */
import type { HarmonyDatabase } from './dexie-database'
import { DEFAULT_SETTINGS } from './dexie-database'
import { exportDataSchema, type ExportData } from '@/types/export'

export interface ImportProgress {
  step: string
  current?: number
  total?: number
}

export interface ImportValidationError {
  path: string
  message: string
}

export interface ImportResult {
  success: boolean
  errors?: ImportValidationError[]
  counts?: {
    tasks: number
    thoughts: number
    projects: number
    settingsImported: boolean
  }
}

/**
 * Parse and validate JSON import file
 */
export function parseImportFile(jsonString: string): {
  data: ExportData | null
  errors: ImportValidationError[]
} {
  let parsed: unknown

  try {
    parsed = JSON.parse(jsonString)
  } catch {
    return {
      data: null,
      errors: [{ path: 'root', message: 'Invalid JSON format' }],
    }
  }

  const result = exportDataSchema.safeParse(parsed)

  if (!result.success) {
    const errors: ImportValidationError[] = result.error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }))
    return { data: null, errors }
  }

  return { data: result.data, errors: [] }
}

/**
 * Import data into database (clean import - replaces all data)
 */
export async function importData(
  db: HarmonyDatabase,
  data: ExportData,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  try {
    await db.transaction('rw', [db.tasks, db.thoughts, db.projects, db.settings], async () => {
      // Step 1: Clear existing data
      onProgress?.({ step: 'Clearing existing data...' })
      await db.tasks.clear()
      await db.thoughts.clear()
      await db.projects.clear()
      await db.settings.clear()

      // Step 2: Import tasks
      const tasksCount = data.data.tasks.length
      if (tasksCount > 0) {
        onProgress?.({ step: 'Importing tasks...', current: 0, total: tasksCount })
        await db.tasks.bulkAdd(data.data.tasks)
        onProgress?.({ step: 'Importing tasks...', current: tasksCount, total: tasksCount })
      }

      // Step 3: Import thoughts
      const thoughtsCount = data.data.thoughts.length
      if (thoughtsCount > 0) {
        onProgress?.({ step: 'Importing thoughts...', current: 0, total: thoughtsCount })
        await db.thoughts.bulkAdd(data.data.thoughts)
        onProgress?.({
          step: 'Importing thoughts...',
          current: thoughtsCount,
          total: thoughtsCount,
        })
      }

      // Step 4: Import projects
      const projectsCount = data.data.projects.length
      if (projectsCount > 0) {
        onProgress?.({ step: 'Importing projects...', current: 0, total: projectsCount })
        await db.projects.bulkAdd(data.data.projects)
        onProgress?.({
          step: 'Importing projects...',
          current: projectsCount,
          total: projectsCount,
        })
      }

      // Step 5: Import or restore settings
      onProgress?.({ step: 'Applying settings...' })
      if (data.data.settings) {
        await db.settings.add(data.data.settings)
      } else {
        // Re-seed default settings if not in import
        await db.settings.add({
          ...DEFAULT_SETTINGS,
          updatedAt: new Date().toISOString(),
        })
      }

      onProgress?.({ step: 'Done!' })
    })

    return {
      success: true,
      counts: {
        tasks: data.data.tasks.length,
        thoughts: data.data.thoughts.length,
        projects: data.data.projects.length,
        settingsImported: !!data.data.settings,
      },
    }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          path: 'database',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    }
  }
}
