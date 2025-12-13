# Implementation Guide - GTD Home Screen Experience

This guide provides practical instructions for implementing the designed home screen experience, with specific code patterns, component APIs, and integration points.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Implementation Order](#component-implementation-order)
3. [Component API Specifications](#component-api-specifications)
4. [State Management](#state-management)
5. [Data Flow](#data-flow)
6. [Performance Optimization](#performance-optimization)
7. [Accessibility Implementation](#accessibility-implementation)
8. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Current State Analysis

**What Already Exists:**
- ✅ `WhatToDoNext.tsx` - Main recommendation component
- ✅ `RecommendationCard.tsx` - Individual recommendation display
- ✅ `useAutoRecommendations.ts` - Hook for fetching recommendations
- ✅ `useBackgroundAI.ts` - Background AI processing
- ✅ Context/Energy configs and badge components
- ✅ Basic UI components (Card, Badge, Button)

**What Needs Enhancement:**
- 🔨 Primary recommendation card styling (highlighted state)
- 🔨 Context refine bar component
- 🔨 Inbox alert banner
- 🔨 Processing state indicators for thoughts
- 🔨 AI status indicator with dropdown
- 🔨 Skeleton loading states

**What Needs Creation:**
- ➕ Enhanced recommendation card with reasoning display
- ➕ Context refine bar with filter UI
- ➕ Inbox counter badge
- ➕ Task extraction preview component
- ➕ AI confidence indicators

---

## Component Implementation Order

### Phase 1: Core Home Screen (Week 1)

#### Priority 1: Enhanced Recommendation Card
**File:** `/src/components/recommendations/PrimaryRecommendationCard.tsx`

```typescript
interface PrimaryRecommendationCardProps {
  task: Task
  reasoning: string
  matchScore: number
  rank: number
  onStart: (taskId: string) => void
  onViewDetails: (taskId: string) => void
}

export function PrimaryRecommendationCard({
  task,
  reasoning,
  matchScore,
  rank,
  onStart,
  onViewDetails,
}: PrimaryRecommendationCardProps) {
  return (
    <article
      className="
        rounded-xl border-2 border-indigo-200 bg-white p-6
        shadow-[0_4px_12px_rgba(99,102,241,0.15)]
        dark:border-indigo-800 dark:bg-gray-900
      "
      aria-label={`Top recommended task: ${task.nextAction}. Match score ${matchScore}%`}
    >
      {/* Header with rank and score */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          #{rank} Recommended
        </span>
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium">{matchScore}%</span>
        </div>
      </div>

      {/* Task title */}
      <h3 className="mb-4 text-xl font-semibold leading-tight text-gray-900 dark:text-white">
        {task.nextAction}
      </h3>

      {/* Metadata badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        <ContextBadge context={task.context} />
        <EnergyIndicator energy={task.energy} />
        <Badge variant="neutral" size="sm">
          <span className="mr-1">⏱</span>
          {task.timeEstimate} min
        </Badge>
        {task.project && (
          <Badge variant="neutral" size="sm">
            📁 {task.project}
          </Badge>
        )}
      </div>

      {/* AI Reasoning */}
      <div className="mb-6 rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-indigo-900 dark:text-indigo-100">
          <span>💡</span>
          <span>Why this task?</span>
        </div>
        <p className="text-sm leading-relaxed text-indigo-800 dark:text-indigo-200">
          {reasoning}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={() => onStart(task.id)}
          className="flex-1"
        >
          Start Task
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => onViewDetails(task.id)}
          className="flex-shrink-0"
        >
          Details →
        </Button>
      </div>
    </article>
  )
}
```

**Why this first?** This is the primary user interaction point - users need to immediately see high-quality recommendations.

---

#### Priority 2: Context Refine Bar
**File:** `/src/components/recommendations/ContextRefineBar.tsx`

```typescript
interface ContextRefineBarProps {
  isOpen: boolean
  onClose: () => void
  onApply: (context: {
    energy?: TaskEnergy
    timeAvailable?: number
    location?: TaskContext
  }) => void
  isLoading?: boolean
}

export function ContextRefineBar({
  isOpen,
  onClose,
  onApply,
  isLoading = false,
}: ContextRefineBarProps) {
  const [energy, setEnergy] = useState<TaskEnergy | undefined>()
  const [location, setLocation] = useState<TaskContext | undefined>()
  const [timeAvailable, setTimeAvailable] = useState<number | undefined>()

  const handleApply = () => {
    onApply({ energy, location, timeAvailable })
    onClose()
  }

  const handleReset = () => {
    setEnergy(undefined)
    setLocation(undefined)
    setTimeAvailable(undefined)
  }

  if (!isOpen) return null

  return (
    <div
      className="
        overflow-hidden rounded-lg border border-gray-200 bg-gray-50
        dark:border-gray-700 dark:bg-gray-800
      "
      style={{
        animation: 'slideDown 200ms ease-out',
      }}
    >
      <div className="p-6">
        <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          Refine your context
        </h4>

        {/* Energy Level */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Energy Level
          </label>
          <div className="flex gap-2">
            {(['high', 'medium', 'low'] as TaskEnergy[]).map((level) => (
              <button
                key={level}
                onClick={() => setEnergy(level)}
                className={`
                  rounded-lg px-4 py-2 text-sm font-medium transition-all
                  ${
                    energy === level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200'
                  }
                `}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Current Location */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Location
          </label>
          <div className="flex gap-2">
            {(['computer', 'phone', 'home', 'errands', 'anywhere'] as TaskContext[]).map(
              (ctx) => {
                const config = CONTEXT_CONFIG[ctx]
                return (
                  <button
                    key={ctx}
                    onClick={() => setLocation(ctx)}
                    className={`
                      rounded-lg p-3 text-2xl transition-all
                      ${
                        location === ctx
                          ? 'bg-indigo-600 shadow-md'
                          : 'bg-white hover:bg-gray-100 dark:bg-gray-700'
                      }
                    `}
                    title={config.label}
                  >
                    {config.icon}
                  </button>
                )
              }
            )}
          </div>
        </div>

        {/* Time Available */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Available
          </label>
          <div className="flex gap-2">
            {[5, 15, 30, 60].map((minutes) => (
              <button
                key={minutes}
                onClick={() => setTimeAvailable(minutes)}
                className={`
                  rounded-lg px-4 py-2 text-sm font-medium transition-all
                  ${
                    timeAvailable === minutes
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200'
                  }
                `}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Applying...' : 'Apply'}
          </Button>
          <Button variant="ghost" size="md" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}

// Add to global CSS or Tailwind config:
// @keyframes slideDown {
//   from {
//     opacity: 0;
//     max-height: 0;
//     transform: translateY(-8px);
//   }
//   to {
//     opacity: 1;
//     max-height: 500px;
//     transform: translateY(0);
//   }
// }
```

---

#### Priority 3: Inbox Alert Banner
**File:** `/src/components/inbox/InboxAlertBanner.tsx`

```typescript
interface InboxAlertBannerProps {
  unprocessedCount: number
  onViewInbox: () => void
}

export function InboxAlertBanner({
  unprocessedCount,
  onViewInbox,
}: InboxAlertBannerProps) {
  if (unprocessedCount === 0) return null

  return (
    <div
      className="
        rounded-lg border border-amber-200 bg-amber-50 p-4
        dark:border-amber-800 dark:bg-amber-950
      "
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {unprocessedCount} {unprocessedCount === 1 ? 'item' : 'items'} need
              processing
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onViewInbox}
          className="flex-shrink-0"
        >
          Review Inbox →
        </Button>
      </div>
    </div>
  )
}
```

---

### Phase 2: AI Integration UX (Week 2)

#### Priority 4: AI Status Indicator
**File:** `/src/components/ai/AIStatusIndicator.tsx`

```typescript
interface AIStatusIndicatorProps {
  isAvailable: boolean
  processingCount: number
  lastProcessedAt?: Date
  provider?: string
  model?: string
}

export function AIStatusIndicator({
  isAvailable,
  processingCount,
  lastProcessedAt,
  provider,
  model,
}: AIStatusIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const statusIcon = processingCount > 0 ? '🔄' : isAvailable ? '🤖' : '⚠️'
  const statusText =
    processingCount > 0
      ? `Processing (${processingCount})`
      : isAvailable
        ? 'AI Active'
        : 'AI Offline'

  const statusColor =
    processingCount > 0
      ? 'text-blue-600'
      : isAvailable
        ? 'text-green-600'
        : 'text-amber-600'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
          transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
          ${statusColor}
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className={processingCount > 0 ? 'animate-pulse' : ''}>{statusIcon}</span>
        <span>{statusText}</span>
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 top-full z-dropdown mt-2 w-64 rounded-lg
            border border-gray-200 bg-white p-4 shadow-lg
            dark:border-gray-700 dark:bg-gray-800
          "
        >
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            AI Status
          </h4>

          <div className="mb-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isAvailable ? 'Connected' : 'Disconnected'}</span>
            </div>
            {isAvailable && (
              <>
                <div>Provider: {provider || 'Not configured'}</div>
                <div>Model: {model || 'Not configured'}</div>
              </>
            )}
          </div>

          {processingCount > 0 && (
            <div className="mb-3 rounded-md bg-blue-50 p-2 dark:bg-blue-950">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                Currently processing {processingCount}{' '}
                {processingCount === 1 ? 'thought' : 'thoughts'}
              </p>
            </div>
          )}

          {lastProcessedAt && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last activity: {formatRelativeTime(lastProcessedAt)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

---

#### Priority 5: Processing State Card
**File:** `/src/components/thoughts/ProcessingStateCard.tsx`

```typescript
interface ProcessingStateCardProps {
  thought: Thought
  extractedTasks?: Task[]
  onViewTasks?: () => void
}

export function ProcessingStateCard({
  thought,
  extractedTasks = [],
  onViewTasks,
}: ProcessingStateCardProps) {
  const isProcessing = !thought.aiProcessed
  const hasExtractedTasks = extractedTasks.length > 0

  return (
    <article
      className={`
        rounded-lg border p-4 transition-all
        ${
          isProcessing
            ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
            : hasExtractedTasks
              ? 'border-green-200 bg-white dark:border-green-800 dark:bg-gray-900'
              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
        }
      `}
      aria-busy={isProcessing}
    >
      {/* Status Header */}
      <div className="mb-3 flex items-center gap-2">
        {isProcessing ? (
          <>
            <svg
              className="h-5 w-5 animate-pulse text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Processing...
            </span>
          </>
        ) : hasExtractedTasks ? (
          <>
            <svg
              className="h-5 w-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {extractedTasks.length} {extractedTasks.length === 1 ? 'task' : 'tasks'} extracted
            </span>
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5 text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Processed
            </span>
          </>
        )}
      </div>

      {/* Thought Content */}
      <p className="mb-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
        {thought.content}
      </p>

      {/* Status Message */}
      {isProcessing && (
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          AI is extracting tasks...
        </p>
      )}

      {!isProcessing && !hasExtractedTasks && (
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          No actionable tasks found
        </p>
      )}

      {/* Extracted Tasks Preview */}
      {hasExtractedTasks && (
        <div className="mb-3 space-y-2 rounded-md bg-green-50 p-3 dark:bg-green-950">
          <p className="text-xs font-medium text-green-900 dark:text-green-100">
            Extracted tasks:
          </p>
          {extractedTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 text-green-600">•</span>
              <div className="flex-1">
                <p className="text-green-900 dark:text-green-100">{task.nextAction}</p>
                <div className="mt-1 flex gap-2">
                  <ContextBadge context={task.context} size="xs" />
                  <EnergyIndicator energy={task.energy} size="xs" />
                  <span className="text-green-700 dark:text-green-300">
                    {task.timeEstimate} min
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Added {formatRelativeTime(new Date(thought.createdAt))}
      </p>

      {/* View Tasks Button */}
      {hasExtractedTasks && onViewTasks && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewTasks}
          className="mt-3 w-full"
        >
          View Tasks →
        </Button>
      )}
    </article>
  )
}
```

---

### Phase 3: Polish & Accessibility (Week 3)

#### Priority 6: Skeleton Loading States
**File:** `/src/components/ui/SkeletonCard.tsx`

```typescript
export function SkeletonRecommendationCard() {
  return (
    <div
      className="
        animate-pulse rounded-xl border-2 border-gray-200 bg-white p-6
        dark:border-gray-700 dark:bg-gray-900
      "
      aria-label="Loading recommendations"
    >
      {/* Header skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Title skeleton */}
      <div className="mb-4 space-y-2">
        <div className="h-6 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Badges skeleton */}
      <div className="mb-4 flex gap-2">
        <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Reasoning skeleton */}
      <div className="mb-6 space-y-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Buttons skeleton */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}
```

---

## State Management

### Recommended Zustand Store Structure

**File:** `/src/stores/recommendations.store.ts`

```typescript
interface RecommendationsState {
  // Data
  recommendations: Recommendation[]
  alternativeActions: string[]
  isLoading: boolean
  error: string | null
  lastRefreshed: Date | null

  // UI State
  showRefineBar: boolean
  showAllRecommendations: boolean
  currentFilters: {
    energy?: TaskEnergy
    location?: TaskContext
    timeAvailable?: number
  }

  // Actions
  fetchRecommendations: (filters?: RecommendationFilters) => Promise<void>
  refresh: () => Promise<void>
  toggleRefineBar: () => void
  toggleShowAll: () => void
  applyFilters: (filters: RecommendationFilters) => Promise<void>
  clearFilters: () => void
}

export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  // Initial state
  recommendations: [],
  alternativeActions: [],
  isLoading: false,
  error: null,
  lastRefreshed: null,
  showRefineBar: false,
  showAllRecommendations: false,
  currentFilters: {},

  // Actions
  fetchRecommendations: async (filters) => {
    set({ isLoading: true, error: null })
    try {
      const result = await getRecommendations(filters)
      set({
        recommendations: result.recommendations,
        alternativeActions: result.alternativeActions,
        isLoading: false,
        lastRefreshed: new Date(),
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load recommendations',
      })
    }
  },

  refresh: async () => {
    const { currentFilters } = get()
    await get().fetchRecommendations(currentFilters)
  },

  toggleRefineBar: () => set((state) => ({ showRefineBar: !state.showRefineBar })),
  toggleShowAll: () => set((state) => ({ showAllRecommendations: !state.showAllRecommendations })),

  applyFilters: async (filters) => {
    set({ currentFilters: filters, showRefineBar: false })
    await get().fetchRecommendations(filters)
  },

  clearFilters: () => {
    set({ currentFilters: {} })
    get().fetchRecommendations({})
  },
}))
```

---

## Data Flow

### Home Screen Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Opens App                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           AppContent Component Mounts                   │
│  - Loads database                                       │
│  - Initializes AI background processor                  │
│  - Subscribes to settings                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          WhatToDoNext Component Renders                 │
│  - Calls useAutoRecommendations() hook                  │
│  - Shows skeleton while loading                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         useAutoRecommendations Hook Executes            │
│  1. Checks if AI is available                           │
│  2. Fetches incomplete tasks from RxDB                  │
│  3. Calls AI service with user context                  │
│  4. Receives ranked recommendations + alternatives      │
│  5. Queries unprocessed thoughts count                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Component Re-renders With Data             │
│  - Primary recommendation (highlighted card)            │
│  - Additional recommendations (collapsed)               │
│  - Inbox alert banner (if unprocessed > 0)              │
│  - Alternative actions                                  │
└─────────────────────────────────────────────────────────┘
```

### Background AI Processing Flow

```
┌─────────────────────────────────────────────────────────┐
│        User Captures Thought (Voice or Text)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│   Thought Saved to RxDB (aiProcessed: false)            │
│   - Optimistic UI update (instant)                      │
│   - Appears in ThoughtsList immediately                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│       useBackgroundAI Hook (Polling Every 5s)           │
│   1. Queries unprocessed thoughts (limit 3)             │
│   2. For each thought:                                  │
│      a. Call AI to extract tasks                        │
│      b. Get property suggestions for each task          │
│      c. Insert tasks to RxDB                            │
│      d. Update thought (aiProcessed: true)              │
│      e. Link tasks to thought                           │
│   3. Throttle between thoughts (1s delay)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            RxDB Reactive Query Updates UI               │
│   - ThoughtsList shows updated state (✅ icon)          │
│   - Inbox counter decreases                             │
│   - New tasks appear in TaskList                        │
│   - Recommendations refresh (new tasks available)       │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

### Critical Rendering Path

1. **Immediate Shell** (< 200ms)
   - Render AppLayout with navigation
   - Show skeleton cards

2. **Essential Data** (< 500ms)
   - Load top recommendation
   - Load inbox count

3. **Progressive Enhancement** (< 1000ms)
   - Load additional recommendations
   - Load alternative actions
   - Load recent thoughts

### Code Splitting Strategy

```typescript
// Lazy load secondary views
const TaskList = lazy(() => import('@/components/tasks/TaskList'))
const ThoughtsList = lazy(() => import('@/components/thoughts/ThoughtsList'))
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'))

// Eager load home screen components (no lazy loading)
import { WhatToDoNext } from '@/components/recommendations/WhatToDoNext'
import { PrimaryRecommendationCard } from '@/components/recommendations/PrimaryRecommendationCard'
```

### Memoization Guidelines

```typescript
// Memoize expensive calculations
const sortedRecommendations = useMemo(
  () => recommendations.sort((a, b) => b.matchScore - a.matchScore),
  [recommendations]
)

// Memoize callbacks passed to child components
const handleStartTask = useCallback(
  (taskId: string) => {
    selectTask(taskId)
    setActiveView('tasks')
  },
  [selectTask, setActiveView]
)

// Memoize components with stable props
const PrimaryCard = memo(PrimaryRecommendationCard)
```

---

## Accessibility Implementation

### Focus Management Checklist

- [ ] Focus trap in modal dialogs (Capture modal)
- [ ] Focus restoration after modal close
- [ ] Focus indicator visible on all interactive elements
- [ ] Skip to main content link
- [ ] Focus moves to page heading after navigation

### ARIA Implementation

```typescript
// Example: Recommendation card
<article
  role="article"
  aria-labelledby={`task-title-${task.id}`}
  aria-describedby={`task-meta-${task.id} task-reasoning-${task.id}`}
>
  <h3 id={`task-title-${task.id}`}>{task.nextAction}</h3>
  <div id={`task-meta-${task.id}`} aria-label="Task metadata">
    {/* Badges */}
  </div>
  <div id={`task-reasoning-${task.id}`} aria-label="AI reasoning">
    {reasoning}
  </div>
</article>

// Live regions for dynamic updates
<div role="status" aria-live="polite" aria-atomic="true">
  {processingCount > 0 && `Processing ${processingCount} thoughts`}
</div>
```

### Keyboard Shortcuts

```typescript
// Global keyboard shortcuts hook
export function useGlobalKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Capture: C
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        openCapture()
        e.preventDefault()
      }

      // Refresh recommendations: R
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        refreshRecommendations()
        e.preventDefault()
      }

      // Navigation: 1-4
      if (['1', '2', '3', '4'].includes(e.key) && !e.metaKey) {
        const views = ['inbox', 'tasks', 'thoughts', 'settings']
        setActiveView(views[parseInt(e.key) - 1])
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}
```

---

## Testing Strategy

### Component Testing Checklist

**PrimaryRecommendationCard.test.tsx:**
- [ ] Renders task title correctly
- [ ] Shows correct context/energy badges
- [ ] Displays match score
- [ ] Shows AI reasoning
- [ ] Calls onStart when "Start Task" clicked
- [ ] Calls onViewDetails when "Details" clicked
- [ ] Has correct ARIA labels

**ContextRefineBar.test.tsx:**
- [ ] Opens/closes with animation
- [ ] Selects energy level correctly
- [ ] Selects location correctly
- [ ] Selects time available correctly
- [ ] Calls onApply with correct values
- [ ] Resets all filters
- [ ] Keyboard navigation works

**InboxAlertBanner.test.tsx:**
- [ ] Hidden when count is 0
- [ ] Shows correct count (singular/plural)
- [ ] Calls onViewInbox when clicked
- [ ] Has alert role for screen readers

### Integration Testing

**Home Screen Flow:**
```typescript
describe('Home Screen Flow', () => {
  it('shows primary recommendation when loaded', async () => {
    render(<App />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Analyzing your tasks')).not.toBeInTheDocument()
    })

    // Check primary recommendation is visible
    expect(screen.getByText(/#1 Recommended/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start task/i })).toBeInTheDocument()
  })

  it('allows refining context and updates recommendations', async () => {
    render(<App />)

    // Click refine button
    await userEvent.click(screen.getByText(/refine/i))

    // Select low energy
    await userEvent.click(screen.getByText(/low/i))

    // Apply filters
    await userEvent.click(screen.getByText(/apply/i))

    // Check recommendations updated
    await waitFor(() => {
      expect(screen.getByText(/low energy/i)).toBeInTheDocument()
    })
  })
})
```

---

## Implementation Checklist

### Phase 1: Core Home Screen
- [ ] Create `PrimaryRecommendationCard` component
- [ ] Create `ContextRefineBar` component
- [ ] Create `InboxAlertBanner` component
- [ ] Update `WhatToDoNext` to use new components
- [ ] Add skeleton loading states
- [ ] Test with real data

### Phase 2: AI Integration
- [ ] Create `AIStatusIndicator` component
- [ ] Create `ProcessingStateCard` component
- [ ] Add confidence indicators to badges
- [ ] Update background AI to emit status events
- [ ] Add error fallback states
- [ ] Test graceful degradation

### Phase 3: Polish
- [ ] Add all micro-animations
- [ ] Implement keyboard shortcuts
- [ ] Complete ARIA labels
- [ ] Test with screen readers (VoiceOver, NVDA)
- [ ] Verify color contrast (all states)
- [ ] Add focus indicators
- [ ] Test reduced motion preference

### Phase 4: Testing
- [ ] Write unit tests for all components
- [ ] Write integration tests for key flows
- [ ] Manual accessibility audit
- [ ] Performance audit (Lighthouse)
- [ ] Cross-browser testing

---

## Developer Notes

### CSS Custom Properties Integration

Add to `index.css`:
```css
@import './design-tokens.css';

/* Apply design tokens to Tailwind */
@layer base {
  :root {
    /* Map tokens to Tailwind utilities */
    --color-primary: var(--color-primary-600);
    --color-text-primary: var(--color-neutral-900);
    --color-bg: var(--color-neutral-50);
  }
}
```

### Tailwind Config Extension

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary-600)',
        // Add all design tokens
      },
      spacing: {
        // Use token spacing scale
      },
      borderRadius: {
        // Use token radius scale
      },
    },
  },
}
```

---

**End of Implementation Guide**

*This guide provides specific, actionable steps for implementing the designed home screen experience. Follow the priority order to deliver maximum value incrementally.*
