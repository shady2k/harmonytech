/**
 * Data Export Service - Export user data to JSON
 */
import type { HarmonyDatabase } from './dexie-database'
import type { ExportData } from '@/types/export'

const APP_VERSION = '0.1.0'

/**
 * Export all user data to a JSON object
 */
export async function exportData(db: HarmonyDatabase): Promise<ExportData> {
  const [tasks, thoughts, projects, settings] = await Promise.all([
    db.tasks.toArray(),
    db.thoughts.toArray(),
    db.projects.toArray(),
    db.settings.get('user-settings'),
  ])

  const exportData: ExportData = {
    metadata: {
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
    },
    data: {
      tasks,
      thoughts,
      projects,
      settings: settings ?? undefined,
    },
  }

  return exportData
}

/**
 * Download exported data as a minified JSON file
 */
export function downloadExportFile(data: ExportData, filename?: string): void {
  const date = new Date().toISOString().split('T')[0]
  const defaultFilename = `harmonytech-backup-${date}.json`
  const finalFilename = filename ?? defaultFilename

  const json = JSON.stringify(data)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = finalFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
