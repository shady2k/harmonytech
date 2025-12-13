# Implementation Plan

**Project**: HarmonyTech
**Generated**: 2025-12-13T14:30:00Z
**PRD Version**: Refined 2025-12-13 (Major Architecture Changes)

## Technical Context & Standards

*Existing Codebase - Refactoring Required*

- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS 4.x (utility classes, dark mode via `dark:`)
- **State**: Zustand (stores in `/src/stores/`)
- **Database**: RxDB (IndexedDB) in `/src/lib/database.ts`
- **Hooks**: Custom hooks in `/src/hooks/` (useAI, useTasks, etc.)
- **Services**: Business logic in `/src/services/`
- **Types**: TypeScript interfaces in `/src/types/`
- **Prompts**: AI prompts as `.txt` in `/src/lib/prompts/`
- **Conventions**: kebab-case files, PascalCase components, camelCase functions

**Key Changes from PRD Refinement:**
1. AI is now optional (background enhancement)
2. Capture creates thoughts first, AI extracts tasks
3. No user approval needed for AI decisions
4. Inbox shows recommendations automatically
5. Multi-provider support (OpenRouter + Yandex)
6. Enhanced keyboard navigation

---

## Phase 1: AI Provider Abstraction Layer

- [ ] **Create AI Provider Interface**
  Task ID: phase-1-ai-abstraction-01
  > **Implementation**: Create `/src/services/ai/types.ts`
  > **Details**: Define `AIProvider` interface with methods: `chat()`, `chatWithAudio()`, `validateKey()`, `isAvailable()`. Define `AIProviderConfig`, `ChatMessage`, `ChatResponse` types. Export `ProviderType = 'openrouter' | 'yandex'`.

- [ ] **Create Base AI Service**
  Task ID: phase-1-ai-abstraction-02
  > **Implementation**: Create `/src/services/ai/ai-service.ts`
  > **Details**: Create `AIService` class that manages provider instances. Methods: `setProvider()`, `getProvider()`, `isAvailable()`, `chat()`, `chatWithAudio()`. Handle graceful fallback when no provider available.

- [ ] **Refactor OpenRouter as Provider**
  Task ID: phase-1-ai-abstraction-03
  > **Implementation**: Move `/src/services/openrouter.ts` to `/src/services/ai/providers/openrouter.ts`
  > **Details**: Implement `AIProvider` interface. Keep existing logic. Export `OpenRouterProvider` class. Update imports in dependent files.

- [ ] **Create Yandex Provider Stub**
  Task ID: phase-1-ai-abstraction-04
  > **Implementation**: Create `/src/services/ai/providers/yandex.ts`
  > **Details**: Implement `AIProvider` interface with placeholder methods. Add `YandexProvider` class with `chat()`, `chatWithAudio()` (for Yandex SpeechKit), `validateKey()`. Mark methods as TODO for future implementation.

- [ ] **Create Provider Factory**
  Task ID: phase-1-ai-abstraction-05
  > **Implementation**: Create `/src/services/ai/index.ts`
  > **Details**: Export `createProvider(type: ProviderType, config)` factory. Export `aiService` singleton instance. Re-export types and providers.

- [ ] **Update Settings Type for Multi-Provider**
  Task ID: phase-1-ai-abstraction-06
  > **Implementation**: Edit `/src/types/settings.ts`
  > **Details**: Add `aiProvider: 'openrouter' | 'yandex'`. Add `yandexApiKey?: string`. Add `yandexFolderId?: string`. Keep existing OpenRouter fields.

- [ ] **Update Settings Store for Providers**
  Task ID: phase-1-ai-abstraction-07
  > **Implementation**: Edit `/src/stores/settings.store.ts`
  > **Details**: Add `aiProvider`, `yandexApiKey`, `yandexFolderId` to state. Add setters. Update `syncToDatabase` and `loadFromDatabase`. Add `getActiveProvider()` method.

- [ ] **Update useAI Hook for Abstraction**
  Task ID: phase-1-ai-abstraction-08
  > **Implementation**: Edit `/src/hooks/useAI.ts`
  > **Details**: Import from `/src/services/ai`. Use `aiService` instead of direct OpenRouter. Add `isAIAvailable` boolean. Handle graceful degradation when AI unavailable.

---

## Phase 2: Thought-First Capture Flow

- [ ] **Add sourceThoughtId to Task Type**
  Task ID: phase-2-thought-first-01
  > **Implementation**: Edit `/src/types/task.ts`
  > **Details**: Add `sourceThoughtId?: string` to `Task` interface. This links tasks back to their source thought.

- [ ] **Add linkedTaskIds to Thought Type**
  Task ID: phase-2-thought-first-02
  > **Implementation**: Edit `/src/types/thought.ts`
  > **Details**: Add `linkedTaskIds: string[]` to `Thought` interface. Add `aiProcessed: boolean` to track if AI has analyzed this thought.

- [ ] **Update RxDB Schemas**
  Task ID: phase-2-thought-first-03
  > **Implementation**: Edit `/src/lib/schemas/task.schema.ts` and `/src/lib/schemas/thought.schema.ts`
  > **Details**: Add `sourceThoughtId` to task schema. Add `linkedTaskIds` and `aiProcessed` to thought schema. Ensure indexes for queries.

- [ ] **Refactor Capture Flow - Always Create Thought**
  Task ID: phase-2-thought-first-04
  > **Implementation**: Edit `/src/App.tsx` (processText and processAudio effects)
  > **Details**: Change flow: always create thought first. Remove immediate task creation. Set `aiProcessed: false`. If AI unavailable, still save thought and show success.

- [ ] **Create Background AI Processor Hook**
  Task ID: phase-2-thought-first-05
  > **Implementation**: Create `/src/hooks/useBackgroundAI.ts`
  > **Details**: Create hook that watches for thoughts with `aiProcessed: false`. When found and AI available, process thought in background. Extract tasks, link them to thought, set `aiProcessed: true`. Use `useTasks` and `useThoughts` hooks.

- [ ] **Integrate Background AI into App**
  Task ID: phase-2-thought-first-06
  > **Implementation**: Edit `/src/App.tsx`
  > **Details**: Add `useBackgroundAI()` hook call in `AppContent`. It runs silently, no UI needed.

- [ ] **Update Capture Modal for Thought-First**
  Task ID: phase-2-thought-first-07
  > **Implementation**: Edit `/src/components/capture/CaptureModal.tsx`
  > **Details**: Simplify UI - remove task/thought distinction. Just "Capture". Single save creates thought. Remove extraction preview for immediate save.

- [ ] **Remove AI Approval Steps**
  Task ID: phase-2-thought-first-08
  > **Implementation**: Edit `/src/stores/capture.store.ts`
  > **Details**: Remove `currentSuggestions`, `acceptSuggestion`, suggestion-related state. Simplify to just input and processing state.

---

## Phase 3: Voice Transcription Quality

- [ ] **Update Voice Transcription Prompt**
  Task ID: phase-3-voice-quality-01
  > **Implementation**: Edit `/src/lib/prompts/voice-transcription.txt`
  > **Details**: Add formatting requirements: "Return transcription with proper grammar, capitalization at sentence start, and punctuation (periods, commas, question marks). Format as natural written text, not raw speech."

- [ ] **Simplify Voice Processing Result**
  Task ID: phase-3-voice-quality-02
  > **Implementation**: Edit `/src/services/voice-processor.ts`
  > **Details**: Change to return just `transcript` string (formatted). Remove immediate task/thought extraction from voice processor. AI analysis happens in background after thought is saved.

- [ ] **Update Voice Prompt for Single Output**
  Task ID: phase-3-voice-quality-03
  > **Implementation**: Edit `/src/lib/prompts/voice-transcription.txt`
  > **Details**: Simplify prompt: "Transcribe the audio accurately. Return properly formatted text with correct capitalization, punctuation, and grammar. Return ONLY the transcription text, no JSON."

---

## Phase 4: Automatic Inbox Recommendations

- [ ] **Create Auto-Recommendations Hook**
  Task ID: phase-4-auto-inbox-01
  > **Implementation**: Create `/src/hooks/useAutoRecommendations.ts`
  > **Details**: Hook that automatically fetches recommendations on mount (if AI available). Use sensible defaults for context. Cache results. Return `{ recommendations, isLoading, error, refresh }`.

- [ ] **Refactor WhatToDoNext for Auto-Load**
  Task ID: phase-4-auto-inbox-02
  > **Implementation**: Edit `/src/components/recommendations/WhatToDoNext.tsx`
  > **Details**: Remove `viewState === 'input'` state. Auto-fetch on mount using `useAutoRecommendations`. Show loading immediately, then results. Keep "Change Context" as optional refinement, not required first step.

- [ ] **Add Fallback for No-AI Inbox**
  Task ID: phase-4-auto-inbox-03
  > **Implementation**: Edit `/src/components/recommendations/WhatToDoNext.tsx`
  > **Details**: If AI unavailable, show recent/unprocessed thoughts and tasks in simple list. No error state - just different UI. Add "AI recommendations available when configured" message.

- [ ] **Remove ContextInput Requirement**
  Task ID: phase-4-auto-inbox-04
  > **Implementation**: Edit `/src/components/recommendations/WhatToDoNext.tsx`
  > **Details**: Move `ContextInput` to expandable "Refine" section. Default collapsed. Recommendations work with smart defaults without user input.

---

## Phase 5: Enhanced Keyboard Navigation

- [ ] **Add List Navigation Hook**
  Task ID: phase-5-keyboard-01
  > **Implementation**: Create `/src/hooks/useListNavigation.ts`
  > **Details**: Hook for j/k navigation in lists. Accept `items[]`, return `{ selectedIndex, selectNext, selectPrev, selectItem }`. Handle wrap-around option.

- [ ] **Extend useKeyboardShortcuts**
  Task ID: phase-5-keyboard-02
  > **Implementation**: Edit `/src/hooks/useKeyboardShortcuts.ts`
  > **Details**: Add: `j/k` for list navigation, `Enter` to open, `Space/x` to complete task, `e` to edit, `d` to delete, `g+i/t/h` for go-to navigation (Inbox/Tasks/tHoughts).

- [ ] **Add Keyboard Navigation to TaskList**
  Task ID: phase-5-keyboard-03
  > **Implementation**: Edit `/src/components/tasks/TaskList.tsx`
  > **Details**: Integrate `useListNavigation`. Add focus styles to selected item. Handle Enter/Space/e/d keys for actions on selected item.

- [ ] **Add Keyboard Navigation to ThoughtsList**
  Task ID: phase-5-keyboard-04
  > **Implementation**: Edit `/src/components/thoughts/ThoughtsList.tsx`
  > **Details**: Integrate `useListNavigation`. Add focus styles. Handle Enter to expand, e to edit, d to delete.

- [ ] **Add Keyboard Navigation to Inbox**
  Task ID: phase-5-keyboard-05
  > **Implementation**: Edit `/src/components/recommendations/WhatToDoNext.tsx`
  > **Details**: Integrate `useListNavigation` for recommendation cards. Enter to start task, Space to view details.

- [ ] **Create Keyboard Shortcuts Help Modal**
  Task ID: phase-5-keyboard-06
  > **Implementation**: Create `/src/components/ui/KeyboardShortcutsModal.tsx`
  > **Details**: Modal showing all shortcuts. Triggered by `?` key. Use `getKeyboardShortcuts()` from hook. Style with Tailwind.

---

## Phase 6: Settings UI for Multi-Provider

- [ ] **Create Provider Selection UI**
  Task ID: phase-6-settings-01
  > **Implementation**: Edit `/src/components/settings/SettingsPage.tsx`
  > **Details**: Add "AI Provider" section with radio buttons: OpenRouter, Yandex. Show relevant config fields based on selection.

- [ ] **Create Yandex Settings Section**
  Task ID: phase-6-settings-02
  > **Implementation**: Create `/src/components/settings/YandexSettings.tsx`
  > **Details**: Component for Yandex config: API Key input, Folder ID input, validation button. Similar to existing OpenRouter section.

- [ ] **Add Provider Status Indicator**
  Task ID: phase-6-settings-03
  > **Implementation**: Edit `/src/components/layout/AppLayout.tsx`
  > **Details**: Add small indicator (icon/badge) showing AI status: connected, disconnected, or not configured. Non-intrusive, bottom corner or header.

---

## Phase 7: Graceful AI Degradation

- [ ] **Create AI Status Context**
  Task ID: phase-7-graceful-01
  > **Implementation**: Create `/src/contexts/AIStatusContext.tsx`
  > **Details**: Context providing `isAIAvailable`, `aiProvider`, `aiError`. Wrap app. Check AI availability on mount and periodically.

- [ ] **Update All AI-Dependent Components**
  Task ID: phase-7-graceful-02
  > **Implementation**: Edit components in `/src/components/`
  > **Details**: Each component using AI should check `isAIAvailable` from context. Show appropriate fallback UI. Never block functionality.

- [ ] **Add Offline-First Capture**
  Task ID: phase-7-graceful-03
  > **Implementation**: Edit `/src/App.tsx`
  > **Details**: Capture always works. If AI unavailable during voice, just skip transcription step and save audio blob. Show "Will transcribe when AI available" message.

- [ ] **Queue Unprocessed Thoughts for Later**
  Task ID: phase-7-graceful-04
  > **Implementation**: Edit `/src/hooks/useBackgroundAI.ts`
  > **Details**: When AI becomes available, process backlog of thoughts with `aiProcessed: false`. Throttle to avoid API spam. Show progress indicator if many items.

---

## Phase 8: Polish & Integration

- [ ] **Update Task Extractor for Auto-Apply**
  Task ID: phase-8-polish-01
  > **Implementation**: Edit `/src/services/task-extractor.ts`
  > **Details**: Ensure extracted tasks have all properties filled by AI. No "suggested" prefix - just set the values directly.

- [ ] **Update Property Suggester for Auto-Apply**
  Task ID: phase-8-polish-02
  > **Implementation**: Edit `/src/services/property-suggester.ts`
  > **Details**: Return definitive values, not suggestions. Change response format from `{ value, confidence, alternatives }` to just values. Keep alternatives for edit UI only.

- [ ] **Clean Up Unused Suggestion Code**
  Task ID: phase-8-polish-03
  > **Implementation**: Edit `/src/types/task.ts`, `/src/stores/capture.store.ts`
  > **Details**: Remove `AISuggestions` type complexity. Simplify to just store AI-applied values. Remove `CurrentSuggestions`, `PropertySuggestion` types if unused.

- [ ] **Add Thought-Task Link UI**
  Task ID: phase-8-polish-04
  > **Implementation**: Edit `/src/components/tasks/TaskCard.tsx`
  > **Details**: If task has `sourceThoughtId`, show small link icon. Clicking navigates to source thought.

- [ ] **Add Task-Thought Link UI**
  Task ID: phase-8-polish-05
  > **Implementation**: Edit `/src/components/thoughts/ThoughtCard.tsx`
  > **Details**: Show linked tasks count badge. Expandable section showing linked task titles.

- [ ] **Integration Testing Checklist**
  Task ID: phase-8-polish-06
  > **Implementation**: Manual testing
  > **Details**: Test: 1) Capture without AI creates thought, 2) AI processes thought in background, 3) Inbox loads recommendations automatically, 4) All keyboard shortcuts work, 5) App works fully offline, 6) Provider switching works.

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 8 | AI Provider Abstraction |
| 2 | 8 | Thought-First Capture |
| 3 | 3 | Voice Quality |
| 4 | 4 | Auto Inbox |
| 5 | 6 | Keyboard Navigation |
| 6 | 3 | Settings UI |
| 7 | 4 | Graceful Degradation |
| 8 | 6 | Polish & Integration |
| **Total** | **42** | |

---

## Previous Implementation (Completed)

The following phases were completed in the initial implementation:

- [x] Phase 1-7: Project Setup, Database, State Management, Core UI
- [x] Phase 8-11: Capture Flow, AI Integration, Task/Thought Management, Recommendations
- [x] Phase 12-13: P2P Sync, Recurring Tasks, Archive, Settings

---

*Generated by Clavix /clavix:plan*
