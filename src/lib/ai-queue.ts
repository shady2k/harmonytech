/**
 * Global AI Request Queue
 *
 * Ensures only one AI request runs at a time across the entire app.
 * This prevents API rate limiting and ensures predictable processing order.
 *
 * The queue is in-memory (lost on refresh), but that's fine because:
 * - The durable "work queue" is the database (thoughts with processingStatus)
 * - This queue is just for concurrency control
 * - On restart, useBackgroundAI re-scans the database
 */

import { logger } from './logger'

const log = logger.aiQueue

interface QueuedTask<T> {
  id: string
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  priority: number
  createdAt: number
}

interface QueueStats {
  pending: number
  processing: boolean
  totalProcessed: number
  totalFailed: number
}

class AIRequestQueue {
  private queue: QueuedTask<unknown>[] = []
  private isProcessing = false
  private taskIdCounter = 0
  private stats = {
    totalProcessed: 0,
    totalFailed: 0,
  }

  /**
   * Enqueue an AI request. Returns a promise that resolves when the request completes.
   *
   * @param execute - The async function to execute
   * @param priority - Higher priority tasks run first (default: 0)
   * @returns Promise that resolves with the result
   */
  enqueue<T>(execute: () => Promise<T>, priority = 0): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: QueuedTask<T> = {
        id: `ai-task-${String(++this.taskIdCounter)}`,
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority,
        createdAt: Date.now(),
      }

      // Insert in priority order (higher priority first, then FIFO)
      // Cast is safe because we only access common properties in processNext
      const queuedTask = task as unknown as QueuedTask<unknown>
      const insertIndex = this.queue.findIndex((t) => t.priority < priority)
      if (insertIndex === -1) {
        this.queue.push(queuedTask)
      } else {
        this.queue.splice(insertIndex, 0, queuedTask)
      }

      log.debug(`Enqueued task ${task.id}, queue size: ${String(this.queue.length)}`)
      void this.processNext()
    })
  }

  /**
   * Process the next task in the queue
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    const task = this.queue.shift()

    if (task === undefined) {
      this.isProcessing = false
      return
    }

    const waitTime = Date.now() - task.createdAt
    log.debug(`Processing task ${task.id}, waited ${String(waitTime)}ms`)

    try {
      const result = await task.execute()
      this.stats.totalProcessed++
      task.resolve(result)
      log.debug(`Task ${task.id} completed successfully`)
    } catch (err) {
      this.stats.totalFailed++
      task.reject(err instanceof Error ? err : new Error(String(err)))
      log.debug(`Task ${task.id} failed:`, err)
    } finally {
      this.isProcessing = false
      // Process next task if any
      void this.processNext()
    }
  }

  /**
   * Get current queue statistics
   */
  getStats(): QueueStats {
    return {
      pending: this.queue.length,
      processing: this.isProcessing,
      totalProcessed: this.stats.totalProcessed,
      totalFailed: this.stats.totalFailed,
    }
  }

  /**
   * Check if queue is currently processing
   */
  isActive(): boolean {
    return this.isProcessing || this.queue.length > 0
  }

  /**
   * Clear all pending tasks (does not cancel the currently running task)
   */
  clear(): void {
    const cleared = this.queue.length
    for (const task of this.queue) {
      task.reject(new Error('Queue cleared'))
    }
    this.queue = []
    log.debug(`Cleared ${String(cleared)} pending tasks`)
  }
}

// Singleton instance
export const aiQueue = new AIRequestQueue()

// Re-export type for stats
export type { QueueStats }
