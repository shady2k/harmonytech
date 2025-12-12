# Implementation Plan

**Project**: HarmonyTech
**Generated**: 2025-12-12T23:15:00Z

## Technical Context & Standards

*Greenfield Project - Establishing Patterns*

- **Framework**: React 18+ with Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (utility-first)
- **UI State**: Zustand (stores in `/src/stores/`)
- **Database**: RxDB with IndexedDB adapter
- **P2P Sync**: Yjs + WebRTC
- **AI**: OpenRouter API (BYOK)
- **Voice**: Gemini via OpenRouter (audio input)
- **PWA**: vite-plugin-pwa

**Conventions**:
- File naming: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Components in `/src/components/` grouped by feature
- Hooks in `/src/hooks/`
- Types in `/src/types/`
- Services in `/src/services/`
- Stores in `/src/stores/`

---

## Phase 1: Project Setup & Foundation

- [x] **Initialize Vite + React + TypeScript project**
  Task ID: phase-1-setup-01
  > **Implementation**: Run `npm create vite@latest . -- --template react-ts` in project root.
  > **Details**: After init, update `tsconfig.json` to enable strict mode. Set up path aliases (`@/` → `src/`).

- [x] **Configure ESLint with strict TypeScript rules**
  Task ID: phase-1-setup-02
  > **Implementation**: Install ESLint + TypeScript ESLint plugin, create `eslint.config.js`.
  > **Details**: Enable strict rules: no `any` type (`@typescript-eslint/no-explicit-any`: error), strict null checks, no unused vars, consistent return types. Configure for React hooks.

- [x] **Configure Tailwind CSS**
  Task ID: phase-1-setup-03
  > **Implementation**: Install and configure Tailwind in `tailwind.config.js` and `src/index.css`.
  > **Details**: Run `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`. Add Tailwind directives to `src/index.css`. Configure content paths.

- [x] **Set up PWA with vite-plugin-pwa**
  Task ID: phase-1-setup-04
  > **Implementation**: Install `vite-plugin-pwa` and configure in `vite.config.ts`.
  > **Details**: `npm install -D vite-plugin-pwa`. Configure manifest (name: "HarmonyTech", theme_color, icons). Enable service worker with `registerType: 'autoUpdate'`.

- [x] **Create project folder structure**
  Task ID: phase-1-setup-05
  > **Implementation**: Create directories: `src/components/`, `src/hooks/`, `src/services/`, `src/stores/`, `src/types/`, `src/utils/`, `src/lib/`.
  > **Details**: Also create `src/components/ui/` for base components, `src/components/capture/`, `src/components/tasks/`, `src/components/thoughts/`, `src/components/layout/`.

- [x] **Set up base layout component**
  Task ID: phase-1-setup-06
  > **Implementation**: Create `src/components/layout/AppLayout.tsx` and `src/components/layout/MobileNav.tsx`.
  > **Details**: Responsive layout: mobile = bottom nav + full-screen content; desktop = sidebar + main area. Use Tailwind responsive classes (`md:`, `lg:`).

- [x] **Create basic UI primitives**
  Task ID: phase-1-setup-07
  > **Implementation**: Create `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Badge.tsx`.
  > **Details**: Style with Tailwind. Export variants (primary, secondary, ghost for Button). These are the building blocks for the app.

---

## Phase 2: Database Layer (RxDB)

- [x] **Install and configure RxDB**
  Task ID: phase-2-database-01
  > **Implementation**: Install RxDB and create `src/lib/database.ts`.
  > **Details**: `npm install rxdb rxdb/plugin-storage-dexie`. Initialize database with Dexie storage adapter. Export `getDatabase()` singleton function.

- [x] **Define Task schema**
  Task ID: phase-2-database-02
  > **Implementation**: Create `src/types/task.ts` and `src/lib/schemas/task.schema.ts`.
  > **Details**: Task fields: `id`, `rawInput`, `nextAction`, `context` (enum: computer, phone, errands, home, anywhere), `energy` (enum: high, medium, low), `timeEstimate` (minutes), `deadline` (optional ISO date), `project` (optional string), `isSomedayMaybe` (boolean), `isCompleted`, `completedAt`, `createdAt`, `updatedAt`, `aiSuggestions` (JSON), `recurrence` (optional object).

- [x] **Define Thought schema**
  Task ID: phase-2-database-03
  > **Implementation**: Create `src/types/thought.ts` and `src/lib/schemas/thought.schema.ts`.
  > **Details**: Thought fields: `id`, `content`, `tags` (string[]), `linkedProject` (optional), `createdAt`, `updatedAt`, `sourceRecordingId` (optional, for voice).

- [x] **Define VoiceRecording schema**
  Task ID: phase-2-database-04
  > **Implementation**: Create `src/types/voice-recording.ts` and `src/lib/schemas/voice-recording.schema.ts`.
  > **Details**: Fields: `id`, `audioBlob` (attachment), `transcript`, `processedAt`, `extractedTaskIds` (string[]), `extractedThoughtIds` (string[]), `createdAt`.

- [x] **Define Project schema**
  Task ID: phase-2-database-05
  > **Implementation**: Create `src/types/project.ts` and `src/lib/schemas/project.schema.ts`.
  > **Details**: Fields: `id`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`.

- [x] **Define Settings schema**
  Task ID: phase-2-database-06
  > **Implementation**: Create `src/types/settings.ts` and `src/lib/schemas/settings.schema.ts`.
  > **Details**: Fields: `id` (always "user-settings"), `openRouterApiKey` (encrypted string), `preferredModel`, `theme`, `defaultContext`, `defaultEnergy`.

- [x] **Create database service with collections**
  Task ID: phase-2-database-07
  > **Implementation**: Update `src/lib/database.ts` to register all schemas and export typed collections.
  > **Details**: Create `initDatabase()` that adds all collections. Export `db.tasks`, `db.thoughts`, `db.voiceRecordings`, `db.projects`, `db.settings`. Add methods for common operations.

- [x] **Create React context for database**
  Task ID: phase-2-database-08
  > **Implementation**: Create `src/contexts/DatabaseContext.tsx` and `src/hooks/useDatabase.ts`.
  > **Details**: Provider initializes database on mount, exposes via context. Hook provides typed access. Handle loading state.

---

## Phase 3: State Management (Zustand)

- [x] **Create UI state store**
  Task ID: phase-3-state-01
  > **Implementation**: Create `src/stores/ui.store.ts`.
  > **Details**: State: `activeView` (inbox, tasks, thoughts, settings), `isCaptureOpen`, `isProcessing`, `selectedTaskId`, `filters` (context, energy, project, showCompleted). Actions for each.

- [x] **Create settings store**
  Task ID: phase-3-state-02
  > **Implementation**: Create `src/stores/settings.store.ts`.
  > **Details**: Syncs with RxDB settings collection. State: `apiKey`, `preferredModel`, `theme`, `isApiKeyValid`. Actions: `setApiKey`, `validateApiKey`, `updateSettings`.

- [x] **Create capture store**
  Task ID: phase-3-state-03
  > **Implementation**: Create `src/stores/capture.store.ts`.
  > **Details**: State: `inputText`, `isRecording`, `recordingDuration`, `audioBlob`, `processingState` (idle, recording, transcribing, extracting, suggesting, done), `extractedItems`, `currentSuggestions`. Actions for capture flow.

---

## Phase 4: Core UI Components

- [x] **Create Header component**
  Task ID: phase-4-ui-01
  > **Implementation**: Create `src/components/layout/Header.tsx`.
  > **Details**: Shows app title, current view name, settings icon. On mobile: hamburger menu. On desktop: minimal.

- [x] **Create BottomNav component (mobile)**
  Task ID: phase-4-ui-02
  > **Implementation**: Create `src/components/layout/BottomNav.tsx`.
  > **Details**: Fixed bottom bar with icons: Inbox, Tasks, Thoughts, Settings. Center FAB for capture. Uses `ui.store` for active view.

- [x] **Create Sidebar component (desktop)**
  Task ID: phase-4-ui-03
  > **Implementation**: Create `src/components/layout/Sidebar.tsx`.
  > **Details**: Left sidebar with navigation, project list, filters. Collapsible. Prominent capture button at top.

- [x] **Create CaptureButton (FAB)**
  Task ID: phase-4-ui-04
  > **Implementation**: Create `src/components/capture/CaptureButton.tsx`.
  > **Details**: Floating action button. Tap = open text capture. Long press = start voice recording. Animated microphone icon during recording.

- [x] **Create EmptyState component**
  Task ID: phase-4-ui-05
  > **Implementation**: Create `src/components/ui/EmptyState.tsx`.
  > **Details**: Reusable empty state with icon, title, description, optional action button. Used when no tasks/thoughts exist.

- [x] **Create LoadingSpinner component**
  Task ID: phase-4-ui-06
  > **Implementation**: Create `src/components/ui/LoadingSpinner.tsx`.
  > **Details**: Simple spinner for loading states. Variants: inline, fullscreen, button.

---

## Phase 5: Capture Flow

- [x] **Create CaptureModal component**
  Task ID: phase-5-capture-01
  > **Implementation**: Create `src/components/capture/CaptureModal.tsx`.
  > **Details**: Full-screen modal on mobile, centered modal on desktop. Contains text input area, voice recording controls, submit button. Shows processing states.

- [x] **Create TextCapture component**
  Task ID: phase-5-capture-02
  > **Implementation**: Create `src/components/capture/TextCapture.tsx`.
  > **Details**: Auto-expanding textarea. Placeholder: "What's on your mind?". Submit on Cmd/Ctrl+Enter. No required fields.

- [x] **Create VoiceCapture component**
  Task ID: phase-5-capture-03
  > **Implementation**: Create `src/components/capture/VoiceCapture.tsx`.
  > **Details**: Uses MediaRecorder API. Shows recording indicator, duration timer, waveform visualization (optional). Stop button. Stores blob in state.

- [x] **Create useVoiceRecording hook**
  Task ID: phase-5-capture-04
  > **Implementation**: Create `src/hooks/useVoiceRecording.ts`.
  > **Details**: Handles MediaRecorder lifecycle. Returns: `startRecording`, `stopRecording`, `isRecording`, `duration`, `audioBlob`, `error`. Request microphone permission.

- [x] **Create ProcessingIndicator component**
  Task ID: phase-5-capture-05
  > **Implementation**: Create `src/components/capture/ProcessingIndicator.tsx`.
  > **Details**: Shows current processing step: "Recording...", "Transcribing...", "Extracting tasks...", "Suggesting properties...". Animated progress.

- [x] **Create SuggestionReview component**
  Task ID: phase-5-capture-06
  > **Implementation**: Create `src/components/capture/SuggestionReview.tsx`.
  > **Details**: After AI processing, shows extracted items with AI suggestions. User can accept/modify each property. "Save" and "Edit more" buttons.

- [x] **Create PropertySuggestion component**
  Task ID: phase-5-capture-07
  > **Implementation**: Create `src/components/capture/PropertySuggestion.tsx`.
  > **Details**: Single property row: label, AI-suggested value (highlighted), alternative options as chips, custom input option. Tap chip to select.

---

## Phase 6: AI Integration (OpenRouter)

- [x] **Create OpenRouter client service**
  Task ID: phase-6-ai-01
  > **Implementation**: Create `src/services/openrouter.ts`.
  > **Details**: Class with methods: `chat(messages, model)`, `chatWithAudio(audioBase64, prompt, model)`. Uses fetch. Handles errors. Reads API key from settings store.

- [x] **Create AI prompts configuration**
  Task ID: phase-6-ai-02
  > **Implementation**: Create `src/lib/ai-prompts.ts`.
  > **Details**: Export prompt templates: `TASK_EXTRACTION_PROMPT`, `PROPERTY_SUGGESTION_PROMPT`, `WHAT_TO_DO_NEXT_PROMPT`. Structured to return JSON.

- [x] **Create task extraction service**
  Task ID: phase-6-ai-03
  > **Implementation**: Create `src/services/task-extractor.ts`.
  > **Details**: `extractFromText(text): Promise<ExtractionResult>` - calls OpenRouter, parses response, returns `{ tasks: [], thoughts: [], isActionable: boolean }`.

- [x] **Create voice processing service**
  Task ID: phase-6-ai-04
  > **Implementation**: Create `src/services/voice-processor.ts`.
  > **Details**: `processVoiceRecording(audioBlob): Promise<VoiceProcessingResult>`. Converts blob to base64, sends to Gemini via OpenRouter with audio input, returns transcript + extracted items.

- [x] **Create property suggester service**
  Task ID: phase-6-ai-05
  > **Implementation**: Create `src/services/property-suggester.ts`.
  > **Details**: `suggestProperties(taskText, existingProjects): Promise<PropertySuggestions>`. Returns suggestions for all GTD properties with confidence scores and alternatives.

- [x] **Create useAI hook**
  Task ID: phase-6-ai-06
  > **Implementation**: Create `src/hooks/useAI.ts`.
  > **Details**: Combines all AI services. Returns: `extractTasks`, `processVoice`, `suggestProperties`, `getRecommendation`, `isProcessing`, `error`. Handles API key validation.

- [x] **Create API key setup component**
  Task ID: phase-6-ai-07
  > **Implementation**: Create `src/components/settings/ApiKeySetup.tsx`.
  > **Details**: Input for OpenRouter API key. "Test connection" button. Shows validation status. Saves to settings store (encrypted in RxDB).

---

## Phase 7: Task Management UI

- [x] **Create TaskList component**
  Task ID: phase-7-tasks-01
  > **Implementation**: Create `src/components/tasks/TaskList.tsx`.
  > **Details**: Renders list of TaskCard components. Subscribes to RxDB tasks collection with filters from ui.store. Groups by project or shows flat list.

- [x] **Create TaskCard component**
  Task ID: phase-7-tasks-02
  > **Implementation**: Create `src/components/tasks/TaskCard.tsx`.
  > **Details**: Shows: checkbox, next action text, context badge, energy indicator, time estimate, deadline (if set). Tap to expand/edit. Swipe to complete (mobile).

- [x] **Create TaskDetail component**
  Task ID: phase-7-tasks-03
  > **Implementation**: Create `src/components/tasks/TaskDetail.tsx`.
  > **Details**: Full task view/edit. Shows all properties with inline editing. "Re-suggest" button to get fresh AI suggestions. Delete button.

- [x] **Create TaskFilters component**
  Task ID: phase-7-tasks-04
  > **Implementation**: Create `src/components/tasks/TaskFilters.tsx`.
  > **Details**: Filter chips for: context, energy, project, has deadline, someday/maybe. Updates ui.store.filters. Shows active filter count.

- [x] **Create ContextBadge component**
  Task ID: phase-7-tasks-05
  > **Implementation**: Create `src/components/ui/ContextBadge.tsx`.
  > **Details**: Colored badge for context. Icons: 💻 computer, 📱 phone, 🛒 errands, 🏠 home, 🌍 anywhere. Consistent colors.

- [x] **Create EnergyIndicator component**
  Task ID: phase-7-tasks-06
  > **Implementation**: Create `src/components/ui/EnergyIndicator.tsx`.
  > **Details**: Visual indicator for energy level. High = ⚡⚡⚡, Medium = ⚡⚡, Low = ⚡. Or use battery icon with fill level.

- [x] **Create ProjectSelector component**
  Task ID: phase-7-tasks-07
  > **Implementation**: Create `src/components/tasks/ProjectSelector.tsx`.
  > **Details**: Dropdown/modal to select project. Shows existing projects, "Create new" option. Used in task editing.

- [x] **Create useTasks hook**
  Task ID: phase-7-tasks-08
  > **Implementation**: Create `src/hooks/useTasks.ts`.
  > **Details**: Subscribe to RxDB tasks. Returns: `tasks`, `addTask`, `updateTask`, `completeTask`, `deleteTask`, `getTaskById`. Handles optimistic updates.

---

## Phase 8: Thoughts System

- [x] **Create ThoughtsList component**
  Task ID: phase-8-thoughts-01
  > **Implementation**: Create `src/components/thoughts/ThoughtsList.tsx`.
  > **Details**: List of ThoughtCard components. Search bar at top. Subscribes to RxDB thoughts collection.

- [x] **Create ThoughtCard component**
  Task ID: phase-8-thoughts-02
  > **Implementation**: Create `src/components/thoughts/ThoughtCard.tsx`.
  > **Details**: Shows thought content, tags, linked project, date. "Convert to task" action. Tap to expand.

- [x] **Create ThoughtDetail component**
  Task ID: phase-8-thoughts-03
  > **Implementation**: Create `src/components/thoughts/ThoughtDetail.tsx`.
  > **Details**: Full thought view. Edit content, manage tags, link to project. "Convert to task" button triggers AI extraction flow.

- [x] **Create ConvertToTaskFlow component**
  Task ID: phase-8-thoughts-04
  > **Implementation**: Create `src/components/thoughts/ConvertToTaskFlow.tsx`.
  > **Details**: Modal that takes thought content, runs through AI task extraction, shows SuggestionReview. On save: creates task, optionally deletes thought.

- [x] **Create useThoughts hook**
  Task ID: phase-8-thoughts-05
  > **Implementation**: Create `src/hooks/useThoughts.ts`.
  > **Details**: Subscribe to RxDB thoughts. Returns: `thoughts`, `addThought`, `updateThought`, `deleteThought`, `searchThoughts`, `convertToTask`.

---

## Phase 9: AI Recommendations

- [x] **Create WhatToDoNext component**
  Task ID: phase-9-recommendations-01
  > **Implementation**: Create `src/components/recommendations/WhatToDoNext.tsx`.
  > **Details**: Card/section that shows AI's top recommendation. "Why this?" explanation. "Show more options" expands to top 3. "Refresh" button.

- [x] **Create useRecommendations hook**
  Task ID: phase-9-recommendations-02
  > **Implementation**: Create `src/hooks/useRecommendations.ts`.
  > **Details**: `getRecommendations(context: { energy, timeAvailable, location })`. Calls AI with current tasks, returns ranked list with reasoning.

- [x] **Create ContextInput component**
  Task ID: phase-9-recommendations-03
  > **Implementation**: Create `src/components/recommendations/ContextInput.tsx`.
  > **Details**: Quick input for: "How much time do you have?" (chips: 5min, 15min, 30min, 1hr+), "Energy level?" (low, medium, high), "Where are you?" (context).

- [x] **Create RecommendationCard component**
  Task ID: phase-9-recommendations-04
  > **Implementation**: Create `src/components/recommendations/RecommendationCard.tsx`.
  > **Details**: Shows recommended task with AI reasoning ("This matches your energy level and available time"). "Start" button marks as in-progress.

---

## Phase 10: P2P Sync (Yjs + WebRTC)

- [x] **Install and configure Yjs**
  Task ID: phase-10-sync-01
  > **Implementation**: Install Yjs and create `src/lib/sync.ts`.
  > **Details**: `npm install yjs y-webrtc`. Create Y.Doc instance. Set up WebRTC provider with room name derived from user ID.

- [x] **Create RxDB-Yjs sync bridge**
  Task ID: phase-10-sync-02
  > **Implementation**: Create `src/lib/rxdb-yjs-sync.ts`.
  > **Details**: Two-way sync between RxDB collections and Yjs shared types. On RxDB change → update Yjs. On Yjs update → update RxDB. Handle conflicts with timestamps.

- [x] **Create SyncStatus component**
  Task ID: phase-10-sync-03
  > **Implementation**: Create `src/components/sync/SyncStatus.tsx`.
  > **Details**: Shows sync status: "Synced", "Syncing...", "Offline", "X peers connected". Small indicator in header.

- [x] **Create SyncSettings component**
  Task ID: phase-10-sync-04
  > **Implementation**: Create `src/components/settings/SyncSettings.tsx`.
  > **Details**: Enable/disable sync toggle. Show room/device ID. "Connect new device" flow with QR code or manual code entry.

- [x] **Create useSyncStatus hook**
  Task ID: phase-10-sync-05
  > **Implementation**: Create `src/hooks/useSyncStatus.ts`.
  > **Details**: Returns: `isOnline`, `isSyncing`, `connectedPeers`, `lastSyncTime`, `syncError`.

---

## Phase 11: Recurring Tasks

- [x] **Add recurrence types**
  Task ID: phase-11-recurring-01
  > **Implementation**: Update `src/types/task.ts` with recurrence types.
  > **Details**: Add `Recurrence` type: `{ pattern: 'daily' | 'weekly' | 'monthly' | 'custom', interval: number, daysOfWeek?: number[], dayOfMonth?: number, endDate?: string }`.

- [x] **Create RecurrenceEditor component**
  Task ID: phase-11-recurring-02
  > **Implementation**: Create `src/components/tasks/RecurrenceEditor.tsx`.
  > **Details**: UI to set recurrence: None, Daily, Weekly (pick days), Monthly (pick day), Custom. Shows preview: "Repeats every Monday and Wednesday".

- [x] **Create recurrence service**
  Task ID: phase-11-recurring-03
  > **Implementation**: Create `src/services/recurrence.ts`.
  > **Details**: `calculateNextOccurrence(task): Date`, `createNextInstance(task): Task`. Called when task is completed.

- [x] **Update task completion logic**
  Task ID: phase-11-recurring-04
  > **Implementation**: Update `src/hooks/useTasks.ts` `completeTask` function.
  > **Details**: When completing a recurring task: 1) Mark current as completed, 2) Call recurrence service to create next instance, 3) Insert new task with updated deadline.

---

## Phase 12: Archive & History

- [x] **Create ArchivedTasksList component**
  Task ID: phase-12-archive-01
  > **Implementation**: Create `src/components/archive/ArchivedTasksList.tsx`.
  > **Details**: List of completed tasks. Grouped by completion date (Today, Yesterday, This Week, Older). Search/filter by text.

- [x] **Create ArchiveStats component**
  Task ID: phase-12-archive-02
  > **Implementation**: Create `src/components/archive/ArchiveStats.tsx`.
  > **Details**: Shows: tasks completed today/this week/this month, streak, most productive context, average completion time.

- [x] **Create useArchive hook**
  Task ID: phase-12-archive-03
  > **Implementation**: Create `src/hooks/useArchive.ts`.
  > **Details**: Query completed tasks from RxDB. Returns: `archivedTasks`, `stats`, `searchArchive`, `restoreTask`.

---

## Phase 13: Settings & Polish

- [ ] **Create SettingsPage component**
  Task ID: phase-13-settings-01
  > **Implementation**: Create `src/components/settings/SettingsPage.tsx`.
  > **Details**: Sections: AI Settings (API key, model), Sync Settings, Display Settings (theme), About. Uses settings store.

- [ ] **Create ThemeToggle component**
  Task ID: phase-13-settings-02
  > **Implementation**: Create `src/components/settings/ThemeToggle.tsx`.
  > **Details**: Light/Dark/System toggle. Persists to settings. Updates Tailwind dark mode class on document.

- [ ] **Create OfflineIndicator component**
  Task ID: phase-13-settings-03
  > **Implementation**: Create `src/components/ui/OfflineIndicator.tsx`.
  > **Details**: Banner that shows when offline. "You're offline. Changes will sync when connected."

- [ ] **Create InstallPrompt component**
  Task ID: phase-13-settings-04
  > **Implementation**: Create `src/components/pwa/InstallPrompt.tsx`.
  > **Details**: Prompts user to install PWA. Shows on mobile after 2nd visit. Uses `beforeinstallprompt` event.

- [ ] **Create OnboardingFlow component**
  Task ID: phase-13-settings-05
  > **Implementation**: Create `src/components/onboarding/OnboardingFlow.tsx`.
  > **Details**: First-run experience: Welcome → Enter API key → Quick tutorial (capture, view tasks, AI suggestions) → Done.

- [ ] **Add keyboard shortcuts**
  Task ID: phase-13-settings-06
  > **Implementation**: Create `src/hooks/useKeyboardShortcuts.ts`.
  > **Details**: Shortcuts: `c` = open capture, `Escape` = close modal, `1-4` = switch views, `/` = search. Register globally.

- [ ] **Final responsive polish**
  Task ID: phase-13-settings-07
  > **Implementation**: Review all components for responsive behavior.
  > **Details**: Test on mobile (375px), tablet (768px), desktop (1024px+). Fix any layout issues. Ensure touch targets are 44px minimum.

---

## Phase 14: Testing & Documentation

- [ ] **Set up testing infrastructure**
  Task ID: phase-14-testing-01
  > **Implementation**: Install Vitest and React Testing Library. Create `vitest.config.ts`.
  > **Details**: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`. Configure for React components.

- [ ] **Write tests for core services**
  Task ID: phase-14-testing-02
  > **Implementation**: Create tests in `src/services/__tests__/`.
  > **Details**: Test: task extraction parsing, recurrence calculations, property suggestions parsing. Mock OpenRouter calls.

- [ ] **Write tests for hooks**
  Task ID: phase-14-testing-03
  > **Implementation**: Create tests in `src/hooks/__tests__/`.
  > **Details**: Test: useTasks CRUD operations, useVoiceRecording states, useRecommendations.

- [ ] **Create README with setup instructions**
  Task ID: phase-14-testing-04
  > **Implementation**: Create `README.md` in project root.
  > **Details**: Include: Project overview, tech stack, setup instructions, environment variables, development commands, architecture overview.

---

*Generated by Clavix /clavix:plan*
