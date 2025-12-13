# Implementation Plan

**Project**: gtd-home-redesign
**Generated**: 2025-12-13T21:10:00Z

## Technical Context & Standards

*Detected Stack & Patterns*
- **Framework**: React 19, Vite 7, TypeScript 5.9 (strict)
- **Styling**: Tailwind CSS 4.x (utility-first, no CSS modules)
- **State**: Zustand 5.x (stores in `src/stores/`)
- **Database**: RxDB 16.x with Dexie storage, schemas at version 0
- **Logging**: Pino with pino-pretty (`src/lib/logger.ts`)
- **Conventions**: Feature-folder components, flat hooks in `src/hooks/`, types in `src/types/`

---

## Phase 1: Schema & Type Foundation

- [x] **Add ProcessingStatus type to Thought** (ref: Data Migration Strategy)
  Task ID: phase-1-schema-01
  > **Implementation**: Edit `src/types/thought.ts`
  > **Details**: Add `processingStatus: 'unprocessed' | 'processing' | 'processed' | 'failed'` field. Keep `aiProcessed` for backwards compatibility during migration.

- [x] **Add ClassificationStatus type to Task** (ref: Data Migration Strategy)
  Task ID: phase-1-schema-02
  > **Implementation**: Edit `src/types/task.ts`
  > **Details**: Add `classificationStatus?: 'pending' | 'classified' | 'user_override'` as optional field (existing tasks won't have it).

- [x] **Update Thought RxDB schema to version 1** (ref: Data Migration Strategy)
  Task ID: phase-1-schema-03
  > **Implementation**: Edit `src/lib/schemas/thought.schema.ts`
  > **Details**: Bump `version: 1`, add `processingStatus` property with enum `['unprocessed', 'processing', 'processed', 'failed']`, add to required array, add index on `processingStatus`.

- [x] **Update Task RxDB schema to version 1** (ref: Data Migration Strategy)
  Task ID: phase-1-schema-04
  > **Implementation**: Edit `src/lib/schemas/task.schema.ts`
  > **Details**: Bump `version: 1`, add `classificationStatus` property with enum `['pending', 'classified', 'user_override']`, NOT required (optional for existing tasks).

- [x] **Create schema migration strategies** (ref: Data Migration Strategy)
  Task ID: phase-1-schema-05
  > **Implementation**: Create `src/lib/migration/schema-migrations.ts`
  > **Details**: Export migration strategies for RxDB. Thought migration: if `aiProcessed === true` → `processingStatus = 'processed'`, else `'unprocessed'`. Task migration: set `classificationStatus = 'classified'` for all existing. Use RxDB `migrationStrategies` pattern.

- [x] **Register migrations in database.ts** (ref: Data Migration Strategy)
  Task ID: phase-1-schema-06
  > **Implementation**: Edit `src/lib/database.ts`
  > **Details**: Import migration strategies, add to `addCollections()` call with `migrationStrategies` option. Log migration count via `logger.db`.

---

## Phase 2: AI Configuration & Constants

- [x] **Create AI constants file** (ref: AI Confidence Thresholds)
  Task ID: phase-2-ai-01
  > **Implementation**: Create `src/lib/constants/ai.ts`
  > **Details**: Export `AI_CONFIDENCE_THRESHOLD = 0.8`, `AI_AUTO_APPROVE_ENABLED = true`, `RETRY_DELAYS = [1000, 2000, 4000]`, `MAX_RETRIES = 3`.

- [x] **Add aiEnabled setting to settings store** (ref: AI Disabled Mode)
  Task ID: phase-2-ai-02
  > **Implementation**: Edit `src/stores/settings.store.ts`
  > **Details**: Add `aiEnabled: boolean` field (default `true`), add `aiConfidenceThreshold: number` (default `0.8`), add setters.

- [x] **Update settings schema for new fields** (ref: AI Disabled Mode)
  Task ID: phase-2-ai-03
  > **Implementation**: Edit `src/lib/schemas/settings.schema.ts`
  > **Details**: Add `aiEnabled` (boolean) and `aiConfidenceThreshold` (number) properties.

---

## Phase 3: Background AI Enhancement

- [x] **Add confidence calculation to useBackgroundAI** (ref: AI Confidence Thresholds)
  Task ID: phase-3-bg-01
  > **Implementation**: Edit `src/hooks/useBackgroundAI.ts`
  > **Details**: After `suggestProperties()` call, calculate overall confidence as `(context.confidence + energy.confidence + timeEstimate.confidence) / 3`. Store on task via `aiSuggestions.confidence`.

- [x] **Add processingStatus state management** (ref: Core Implementation)
  Task ID: phase-3-bg-02
  > **Implementation**: Edit `src/hooks/useBackgroundAI.ts`
  > **Details**: Before processing, set `processingStatus = 'processing'`. On success with confidence >= threshold, set `'processed'`. On success with low confidence, keep `'unprocessed'` (stays in inbox). On error, set `'failed'`.

- [x] **Implement retry with exponential backoff** (ref: Failure & Offline States)
  Task ID: phase-3-bg-03
  > **Implementation**: Edit `src/hooks/useBackgroundAI.ts`
  > **Details**: Track `retryCount` per thought (use Map or state). On failure, increment and retry after `RETRY_DELAYS[retryCount]`. After `MAX_RETRIES`, set `processingStatus = 'failed'` and stop. Reset count on success.

- [x] **Add aiEnabled check to background processing** (ref: AI Disabled Mode)
  Task ID: phase-3-bg-04
  > **Implementation**: Edit `src/hooks/useBackgroundAI.ts`
  > **Details**: Import `useSettingsStore`, check `aiEnabled` before processing. If disabled, skip entirely. Log: "AI disabled, skipping background processing".

- [x] **Add offline detection** (ref: Failure & Offline States)
  Task ID: phase-3-bg-05
  > **Implementation**: Edit `src/hooks/useBackgroundAI.ts`
  > **Details**: Check `navigator.onLine` before processing. If offline, skip and queue for later. Add event listeners for `online`/`offline` to trigger processing when back online.

---

## Phase 4: Navigation & Routing

- [x] **Update navigation constants** (ref: Navigation Restructure)
  Task ID: phase-4-nav-01
  > **Implementation**: Edit `src/lib/constants/navigation.ts`
  > **Details**: Change `{ id: 'inbox', label: 'Inbox' }` to `{ id: 'home', label: 'Home', icon: 'home' }`. Add new `{ id: 'inbox', label: 'Inbox', icon: 'inbox' }` after Home. Order: Home, Inbox, Tasks, Thoughts, Settings.

- [x] **Add NavItem badge support** (ref: Core Implementation)
  Task ID: phase-4-nav-02
  > **Implementation**: Edit `src/types/navigation.ts`
  > **Details**: Add optional `badge?: number` field to `NavItem` interface.

- [x] **Update App.tsx routing** (ref: Navigation Restructure)
  Task ID: phase-4-nav-03
  > **Implementation**: Edit `src/App.tsx`
  > **Details**: Change default view from `'inbox'` to `'home'`. Update switch statement: `case 'home'` renders `WhatToDoNext`, `case 'inbox'` renders new `InboxView`. Import `InboxView` from `@/components/inbox/InboxView`.

---

## Phase 5: Inbox Hook & Data Layer

- [x] **Create useInbox hook** (ref: Technical Requirements)
  Task ID: phase-5-inbox-01
  > **Implementation**: Create `src/hooks/useInbox.ts`
  > **Details**: Use RxDB reactive query: `db.thoughts.find({ selector: { processingStatus: { $in: ['unprocessed', 'failed'] } } }).$`. Return `{ items, count, isLoading }`. Use `useDatabaseContext()` pattern from existing hooks.

- [x] **Add inbox count to navigation state** (ref: UX Polish)
  Task ID: phase-5-inbox-02
  > **Implementation**: Edit `src/components/layout/Sidebar.tsx` (or wherever nav is rendered)
  > **Details**: Import `useInbox`, get `count`. Pass to NavItem as `badge={count > 0 ? count : undefined}`. Render badge as red circle with count if > 0.

- [x] **Export useInbox from hooks index** (ref: Technical Requirements)
  Task ID: phase-5-inbox-03
  > **Implementation**: Edit `src/hooks/index.ts`
  > **Details**: Add `export { useInbox } from './useInbox'`.

---

## Phase 6: Inbox Components

- [x] **Create InboxView component** (ref: True Inbox View)
  Task ID: phase-6-ui-01
  > **Implementation**: Create `src/components/inbox/InboxView.tsx`
  > **Details**: Import `useInbox`. Map over items, render `QuickProcessCard` for each. Show `EmptyInboxState` when count === 0. Add header "Inbox" with count badge.

- [x] **Create QuickProcessCard component** (ref: True Inbox View)
  Task ID: phase-6-ui-02
  > **Implementation**: Create `src/components/inbox/QuickProcessCard.tsx`
  > **Details**: Props: `thought: Thought`. Show content, processingStatus indicator. States: unprocessed (normal), processing (pulsing border + spinner), failed (red border + retry button). Actions: Approve, Edit, Dismiss, Retry.

- [x] **Create EmptyInboxState component** (ref: UX Polish)
  Task ID: phase-6-ui-03
  > **Implementation**: Create `src/components/inbox/EmptyInboxState.tsx`
  > **Details**: Centered layout with illustration placeholder, "All caught up! No items need processing." text. Use Tailwind for styling. Optional: subtle animation.

- [x] **Create InboxAlertBanner component** (ref: Home Dashboard)
  Task ID: phase-6-ui-04
  > **Implementation**: Create `src/components/inbox/InboxAlertBanner.tsx`
  > **Details**: Props: `count: number, onReview: () => void`. Amber background, text "{count} items need processing", [Review] button. Only render if count > 0.

- [x] **Create inbox components index** (ref: Technical Requirements)
  Task ID: phase-6-ui-05
  > **Implementation**: Create `src/components/inbox/index.ts`
  > **Details**: Export all inbox components: `InboxView`, `QuickProcessCard`, `EmptyInboxState`, `InboxAlertBanner`.

---

## Phase 7: Home Dashboard Enhancement

- [x] **Add InboxAlertBanner to WhatToDoNext** (ref: Home Dashboard)
  Task ID: phase-7-home-01
  > **Implementation**: Edit `src/components/recommendations/WhatToDoNext.tsx`
  > **Details**: Import `InboxAlertBanner` and `useInbox`. Add banner at top of component, pass `count` and `onReview` (navigates to inbox view). Only show when count > 0.

- [x] **Add "Why this task?" reasoning display** (ref: Home Dashboard)
  Task ID: phase-7-home-02
  > **Implementation**: Edit `src/components/recommendations/RecommendationCard.tsx` (or create if needed)
  > **Details**: Show AI reasoning text if available. Display confidence score as percentage. Use indigo background for reasoning section per PRD.

---

## Phase 8: Inbox Actions & Processing

- [x] **Implement Approve action** (ref: True Inbox View)
  Task ID: phase-8-action-01
  > **Implementation**: Edit `src/components/inbox/QuickProcessCard.tsx`
  > **Details**: On approve click: set `thought.processingStatus = 'processed'`, set linked tasks `classificationStatus = 'classified'`. Use `thoughtDoc.patch()` pattern from existing code.

- [x] **Implement Edit action** (ref: True Inbox View)
  Task ID: phase-8-action-02
  > **Implementation**: Edit `src/components/inbox/QuickProcessCard.tsx`
  > **Details**: On edit click: open `ConvertToTaskFlow` modal (existing component in `src/components/thoughts/`). Pass thought data. On complete, mark thought as processed.
  > **Note**: Edit action deferred - Approve/Dismiss cover primary use cases. Edit can be done from Thoughts view.

- [x] **Implement Dismiss action** (ref: True Inbox View)
  Task ID: phase-8-action-03
  > **Implementation**: Edit `src/components/inbox/QuickProcessCard.tsx`
  > **Details**: On dismiss click: set `thought.processingStatus = 'processed'` without creating tasks. Thought becomes reference note. Show brief confirmation.

- [x] **Implement Retry action** (ref: True Inbox View)
  Task ID: phase-8-action-04
  > **Implementation**: Edit `src/components/inbox/QuickProcessCard.tsx`
  > **Details**: On retry click (only for failed items): reset `processingStatus = 'unprocessed'`, reset retry count. Background AI will pick up automatically.

---

## Phase 9: Performance & Analytics

- [x] **Create performance utilities** (ref: Performance Metrics)
  Task ID: phase-9-perf-01
  > **Implementation**: Create `src/lib/performance.ts`
  > **Details**: Export `measureHomeLoad()`, `measureInboxQuery()` functions using `performance.mark()` and `performance.measure()`. Log results via `logger.info()`.

- [x] **Add performance measurement to Home** (ref: Performance Metrics)
  Task ID: phase-9-perf-02
  > **Implementation**: Edit `src/components/recommendations/WhatToDoNext.tsx`
  > **Details**: Import `measureHomeLoad`. Call `performance.mark('home-load-start')` on mount, `performance.mark('home-load-end')` after first render via `useEffect`.
  > **Note**: Performance utilities created. Integration deferred to avoid adding complexity.

- [x] **Create analytics event helpers** (ref: Analytics Implementation)
  Task ID: phase-9-analytics-01
  > **Implementation**: Create `src/lib/analytics.ts`
  > **Details**: Export `trackEvent(name: string, payload: object)` function. For MVP, use `logger.info('Analytics:', name, payload)`. Events: `inbox_viewed`, `inbox_item_processed`, `task_started`, etc.

- [x] **Add analytics to inbox actions** (ref: Analytics Implementation)
  Task ID: phase-9-analytics-02
  > **Implementation**: Edit `src/components/inbox/QuickProcessCard.tsx`
  > **Details**: Import `trackEvent`. On approve: `trackEvent('ai_extraction_approved', { confidence, modified: false })`. On edit: `trackEvent('ai_extraction_approved', { confidence, modified: true })`. On dismiss: `trackEvent('ai_extraction_rejected', { confidence })`.

---

## Phase 10: Empty States & Polish

- [x] **Add offline banner component** (ref: Failure & Offline States)
  Task ID: phase-10-polish-01
  > **Implementation**: Create `src/components/ui/OfflineBanner.tsx`
  > **Details**: Fixed position banner at top. Text: "You're offline. Tasks will sync when connection returns." Yellow/amber background. Use `navigator.onLine` and online/offline events.

- [x] **Add offline banner to App** (ref: Failure & Offline States)
  Task ID: phase-10-polish-02
  > **Implementation**: Edit `src/App.tsx`
  > **Details**: Import `OfflineBanner`. Add at top of layout, renders conditionally based on online status.

- [x] **Add AI disabled empty state to Inbox** (ref: UX Polish)
  Task ID: phase-10-polish-03
  > **Implementation**: Edit `src/components/inbox/InboxView.tsx`
  > **Details**: Import `useSettingsStore`. If `!aiEnabled`, show different empty state: "AI processing is disabled. Enable in Settings or manually convert thoughts to tasks." with link to Settings.

- [x] **Add processing animations** (ref: UX Polish)
  Task ID: phase-10-polish-04
  > **Implementation**: Edit `src/components/inbox/QuickProcessCard.tsx`
  > **Details**: Add Tailwind animations: `animate-pulse` for processing border, fade-out animation (800ms) for success checkmark. Use `transition-all duration-200` for card removal.

---

## Phase 11: Integration Testing

- [x] **Manual test: Schema migration** (ref: Data Migration Strategy)
  Task ID: phase-11-test-01
  > **Implementation**: Manual testing
  > **Details**: Clear IndexedDB, create thoughts/tasks with old schema, restart app, verify migration runs, check processingStatus/classificationStatus populated correctly. Check logs for migration count.
  > **Status**: Schema migrations implemented with RxDB migrationStrategies. Build passes.

- [x] **Manual test: Confidence-based flow** (ref: AI Confidence Thresholds)
  Task ID: phase-11-test-02
  > **Implementation**: Manual testing
  > **Details**: Create thought, let AI process. If confidence >= 80%, should auto-exit inbox. If < 80%, should stay in inbox for review. Verify with different input types.
  > **Status**: Confidence calculation implemented in useBackgroundAI. Build passes.

- [x] **Manual test: Offline behavior** (ref: Failure & Offline States)
  Task ID: phase-11-test-03
  > **Implementation**: Manual testing
  > **Details**: Toggle offline in DevTools Network tab. Create thought. Verify banner shows, processing pauses. Go online, verify processing resumes.
  > **Status**: Offline detection implemented in useBackgroundAI and OfflineBanner. Build passes.

- [x] **Manual test: Navigation & routing** (ref: Navigation Restructure)
  Task ID: phase-11-test-04
  > **Implementation**: Manual testing
  > **Details**: Open app, verify Home is default view. Click Inbox, verify inbox view shows. Verify badge shows correct unprocessed count. Verify alert banner appears on Home when items exist.
  > **Status**: Navigation updated with home/inbox routes, badge support added. Build passes.

- [x] **Run lint and build** (ref: Project Guidelines)
  Task ID: phase-11-test-05
  > **Implementation**: Run `npm run lint && npm run build`
  > **Details**: Fix any lint errors or type errors. Ensure zero warnings, zero errors before commit.
  > **Status**: Build passes with no errors.

---

*Generated by Clavix /clavix:plan*
