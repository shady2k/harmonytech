# Optimized Prompt (Clavix Enhanced)

## Objective

Redesign the HarmonyTech GTD app's home/inbox experience to align with true GTD methodology: users see unprocessed items (Inbox) and AI-powered next action recommendations (Home) immediately upon opening the app.

## Core Implementation

**1. Navigation Restructure**
- Rename current "Inbox" view to "Home" (AI recommendations dashboard)
- Create new "Inbox" view showing unprocessed thoughts (`aiProcessed: false`)
- Add inbox badge to navigation showing unprocessed count

**2. Home Dashboard (Landing Page)**
- Inbox alert banner: "3 items need processing" with [Review] button (only shows when count > 0)
- Primary recommendation card: One expanded task with context/energy/time badges and "Why this task?" AI reasoning
- Secondary recommendations: 2-3 collapsed alternatives

**3. True Inbox View**
- List all thoughts with `aiProcessed: false` or `processingStatus: 'failed'`
- Show processing indicator for items currently being analyzed
- Quick actions per item: Approve AI extraction, Edit, Dismiss, Retry (if failed)
- Items auto-remove when AI successfully processes them

**4. AI Classification Flow Enhancement**
- High confidence extractions (>80%): Auto-exit inbox, appear in tasks
- Low confidence extractions (<80%): Stay in inbox for user review
- Failed processing: Show error, offer retry button
- Add `processingStatus` enum to Thought schema: 'unprocessed' | 'processing' | 'processed' | 'failed'

---

## Data Migration Strategy

**Schema Changes:**
```typescript
// Thought: Add processingStatus
processingStatus: 'unprocessed' | 'processing' | 'processed' | 'failed'

// Task: Add classificationStatus
classificationStatus: 'pending' | 'classified' | 'user_override'
```

**Migration for Existing Records:**
```typescript
// Thoughts migration
- If aiProcessed === true → processingStatus = 'processed'
- If aiProcessed === false → processingStatus = 'unprocessed'
- Default for new records: 'unprocessed'

// Tasks migration
- All existing tasks → classificationStatus = 'classified' (assume user accepted)
- Default for AI-created tasks: 'pending' until confidence check passes
- Default for manually created tasks: 'user_override'
```

**Migration Execution:**
- Run migration on app startup (one-time, idempotent)
- Use RxDB migration handler with version bump
- Log migration count for verification

---

## AI Confidence Thresholds

**Confidence Definition:**
- Confidence = average of property suggestion confidences from AI response
- Each property (context, energy, timeEstimate, project) returns 0.0-1.0 confidence
- Overall confidence = `(context.confidence + energy.confidence + timeEstimate.confidence) / 3`
- Project confidence excluded (often null/optional)

**Threshold Configuration:**
```typescript
// src/lib/constants/ai.ts
export const AI_CONFIDENCE_THRESHOLD = 0.8  // 80%
export const AI_AUTO_APPROVE_ENABLED = true // Feature flag
```

**Multi-Task Extraction:**
- When AI extracts multiple tasks from one thought:
  - Each task has independent confidence score
  - Thought exits inbox only when ALL extracted tasks meet threshold
  - If any task is low-confidence, entire thought stays for review
  - User can approve individual tasks, remaining low-confidence tasks stay

**Future: Telemetry-Driven Threshold:**
- Track user approval/rejection rate per confidence band
- If users approve 95%+ of 70% confidence items, consider lowering threshold
- Store in settings: `aiConfidenceThreshold` (user-adjustable in Settings)

---

## Failure & Offline States

**Network/API Failure Handling:**
```
AI Request Failed
├─ Retry with exponential backoff (1s, 2s, 4s, max 3 attempts)
├─ After max retries: Set processingStatus = 'failed'
├─ Show in Inbox: "Processing failed" with [Retry] button
└─ Log error for debugging (existing pino logger)
```

**Offline Mode:**
- Detect offline via `navigator.onLine` + fetch failure
- Show banner: "Offline - AI processing paused"
- Queue thoughts for processing when back online
- Allow manual task creation from thoughts (bypass AI)

**AI Disabled Mode:**
- Setting: `aiEnabled: boolean` in settings store
- When disabled:
  - Skip background AI processing entirely
  - Inbox shows all thoughts (manual processing only)
  - "Convert to Task" button on each thought (existing flow)
  - No confidence scores, no auto-classification

**Retry/Backoff Logic:**
```typescript
const RETRY_DELAYS = [1000, 2000, 4000] // ms
const MAX_RETRIES = 3

// In useBackgroundAI.ts
- Track retryCount per thought in processingState
- Reset retryCount on successful processing
- After MAX_RETRIES: mark failed, stop retrying until user clicks Retry
```

---

## Performance Metrics

**Measurement Definitions:**

| Metric | Definition | Target | Measurement Method |
|--------|-----------|--------|-------------------|
| Home Load | Time from navigation click to LCP (Largest Contentful Paint) | < 2s cold, < 500ms warm | `performance.mark()` at route change, `performance.measure()` at first render complete |
| Inbox Count Query | Time to fetch unprocessed count | < 100ms | Measure RxDB query execution time, log p50/p95 |
| Time to First Action | App open → user taps a task | < 10s | Analytics event: `app_open` to `task_started` |

**Device Assumptions:**
- Cold start: First load after app/browser restart
- Warm start: Navigation within running app
- Target devices: Modern smartphone (2020+), desktop browser
- Network: 4G or better (AI features), offline mode for poor connectivity

**Monitoring Implementation:**
```typescript
// src/lib/performance.ts
export function measureHomeLoad(): void {
  performance.mark('home-load-start')
  // After render complete:
  performance.mark('home-load-end')
  performance.measure('home-load', 'home-load-start', 'home-load-end')
  const measure = performance.getEntriesByName('home-load')[0]
  logger.info('Home load time:', measure.duration)
}
```

---

## UX Polish

**Empty States:**

| State | UI |
|-------|-----|
| Inbox empty (zero items) | Illustration + "All caught up! No items need processing." + subtle confetti animation |
| No recommendations | "No tasks match your current context. Try adjusting filters or add new tasks." |
| AI disabled | "AI processing is disabled. Enable in Settings or manually convert thoughts to tasks." |
| Offline | "You're offline. Tasks will sync when connection returns." |

**Processing Spinner States:**
```
Thought Card States:
├─ Unprocessed: Normal card, no indicator
├─ Processing: Pulsing border + "Analyzing..." text + spinner icon
├─ Processed: Brief green checkmark animation, then auto-remove from inbox
├─ Failed: Red border + error icon + "Failed to process" + [Retry] button
```

**Live Updates (RxDB Subscriptions):**
```typescript
// Inbox count badge - reactive subscription
const inboxCount$ = db.thoughts.find({
  selector: { processingStatus: { $in: ['unprocessed', 'failed'] } }
}).$.pipe(map(docs => docs.length))

// Subscribe in navigation component
// Badge updates automatically when thoughts change
// No polling needed - RxDB reactive queries
```

**Animation Timing:**
- Processing spinner: Infinite rotation while status = 'processing'
- Success checkmark: 800ms display, then 300ms fade out
- Card removal: 200ms slide-out animation
- Badge count: Instant update (no animation on number change)

---

## Analytics Implementation

**Events to Track:**

| Event | Payload | Purpose |
|-------|---------|---------|
| `inbox_viewed` | `{ count: number }` | Track inbox engagement |
| `inbox_item_processed` | `{ method: 'auto' \| 'manual', confidence: number }` | AI accuracy |
| `inbox_zero_achieved` | `{ timeToZero: number, itemsProcessed: number }` | Success metric |
| `task_started` | `{ source: 'home' \| 'tasks' \| 'inbox', taskId: string }` | Time to first action |
| `ai_extraction_approved` | `{ confidence: number, modified: boolean }` | Threshold validation |
| `ai_extraction_rejected` | `{ confidence: number, reason?: string }` | Improve AI prompts |

**Derived Metrics (Dashboard):**
```
- Time to First Action = avg(task_started.timestamp - app_open.timestamp)
- Inbox Zero Rate = count(inbox_zero_achieved) / count(unique_daily_users)
- AI Accuracy = count(ai_extraction_approved) / count(ai_extraction_approved + ai_extraction_rejected)
- AI Auto-Approve Rate = count(method='auto') / count(inbox_item_processed)
```

**Implementation:**
- Use existing logger for now (pino debug logs)
- Future: Add analytics service (Mixpanel, Amplitude, or custom)
- Store locally for MVP, export on demand

---

## Technical Requirements

- **Stack**: React 18, TypeScript, RxDB, Zustand, Tailwind CSS
- **New Hook**: `useInbox()` - fetches thoughts where `processingStatus` in ['unprocessed', 'failed']
- **New Components**: `InboxAlertBanner`, `InboxView`, `QuickProcessCard`, `EmptyInboxState`
- **Schema Migration**: Add `processingStatus` to Thought, `classificationStatus` to Task
- **Performance**: Home load < 2s cold / < 500ms warm, inbox count query < 100ms p95

## Success Criteria

- [ ] Inbox count visible within 1 second of app open
- [ ] Unprocessed thoughts appear in Inbox view (not recommendations)
- [ ] AI-processed items automatically leave inbox (when confidence > 80%)
- [ ] Low-confidence items stay in inbox for user review
- [ ] Home shows contextual recommendation with reasoning
- [ ] Time to first action < 10 seconds (measured via analytics)
- [ ] Graceful degradation when offline or AI disabled
- [ ] Empty states provide clear guidance
- [ ] Users can achieve Inbox Zero daily

## Files to Modify

- `src/App.tsx` - Update view routing and default landing
- `src/components/recommendations/WhatToDoNext.tsx` - Add inbox alert banner
- `src/hooks/useBackgroundAI.ts` - Add confidence-based inbox exit logic, retry/backoff
- `src/types/thought.ts` - Add processingStatus field
- `src/types/task.ts` - Add classificationStatus field
- `src/lib/constants/navigation.ts` - Update navigation structure
- `src/lib/database/schema.ts` - Schema migration for new fields
- `src/stores/settings.store.ts` - Add aiEnabled, aiConfidenceThreshold settings

## Files to Create

- `src/hooks/useInbox.ts` - Fetch unprocessed items with reactive subscription
- `src/components/inbox/InboxView.tsx` - True inbox component
- `src/components/inbox/InboxAlertBanner.tsx` - Alert for home dashboard
- `src/components/inbox/QuickProcessCard.tsx` - Individual inbox item with states
- `src/components/inbox/EmptyInboxState.tsx` - Empty state illustration
- `src/lib/constants/ai.ts` - AI configuration constants
- `src/lib/performance.ts` - Performance measurement utilities
- `src/lib/analytics.ts` - Analytics event helpers (optional for MVP)

---

## Optimization Improvements Applied

1. **[STRUCTURED]** - Reorganized into clear sections with new de-risking sections
2. **[CLARIFIED]** - Defined confidence calculation, multi-task handling, threshold configurability
3. **[COMPLETENESS]** - Added migration strategy, failure states, offline mode, performance measurement
4. **[ACTIONABILITY]** - Converted to specific code snippets, event schemas, measurement methods
5. **[EFFICIENCY]** - Removed ambiguity, every requirement has clear implementation path
6. **[SCOPED]** - Defined empty states, animation timing, analytics events

---
*Optimized by Clavix on 2025-12-13. Updated with de-risking additions. Ready for implementation.*
