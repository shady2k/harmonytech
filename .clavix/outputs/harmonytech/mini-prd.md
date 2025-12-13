# Requirements: HarmonyTech

*Generated from conversation on 2025-12-12*
*Refined on 2025-12-13*

## Objective

Build an AI-enhanced GTD (Getting Things Done) app that eliminates the friction of forced categorization. Users simply capture thoughts naturally (text or voice), and AI works in the background to organize, extract tasks, and suggest what to do next. The app is **fully functional without AI** - AI enhances but is never required. Privacy-first with local-first, decentralized architecture.

## Core Requirements

### Must Have (High Priority)

- [HIGH] **Frictionless capture** - Just type or speak, no required fields, creates a thought
- [HIGH] **Voice input with preservation** - Record voice, keep original audio, transcribe with proper formatting (capitals, punctuation, grammar)
- [HIGH] **AI runs in background** - Processes thoughts, extracts tasks, applies properties automatically
- [HIGH] **Capture creates thoughts, AI creates tasks** - User captures thoughts; AI analyzes and creates linked tasks if actionable
- [HIGH] **AI applies decisions automatically** - No approval needed; user edits only if wrong
- [HIGH] **App works without AI** - All features functional when AI unavailable; AI enhances, not requires
- [HIGH] **Keyboard navigation** - All core actions accessible via hotkeys, no mouse required
- [HIGH] **Local-first architecture** - Data lives on device, privacy by default
- [HIGH] **PWA** - Works on mobile and desktop browsers
- [HIGH] **Responsive design** - Same great experience on phone and computer
- [HIGH] **AI provider abstraction layer** - Support multiple AI providers through unified interface
- [HIGH] **OpenRouter integration (BYOK)** - User provides API key and chooses their model
- [HIGH] **Yandex provider support** - Alternative provider for STT and AI

### Should Have (Medium Priority)

- [MEDIUM] **Inbox with automatic recommendations** - AI suggestions shown immediately on open, no button needed
- [MEDIUM] **Static filtered views** - Manual browsing by context, energy, project, etc. (works without AI)
- [MEDIUM] **Recurring tasks** - Daily, weekly, monthly task repetition
- [MEDIUM] **Task archive** - Completed tasks preserved for history/stats
- [MEDIUM] **P2P sync** - Sync between devices without server
- [MEDIUM] **Thoughts management** - Searchable, AI resurfaces relevant ones, linked to extracted tasks

### Could Have (Low Priority / Post-MVP)

- [LOW] **Notifications/reminders** - Due date alerts, AI nudges
- [LOW] **Self-hosted sync server** - For push notifications
- [LOW] **Data backup/export** - Export to file, cloud storage integration

## Technical Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React |
| **Build Tool** | Vite |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI State** | Zustand |
| **Database** | RxDB (IndexedDB) |
| **P2P Sync** | Yjs + WebRTC |
| **AI Layer** | Provider abstraction (supports multiple backends) |
| **AI Providers** | OpenRouter (user chooses model), Yandex, extensible |
| **Voice Processing** | Single multimodal API call (transcription + formatting + extraction) |
| **PWA** | Vite PWA Plugin |

## AI Provider Architecture

```
AI Service Interface
├── OpenRouter Provider (user selects model)
├── Yandex Provider (STT + AI)
└── [Future providers easily added]
```

**Key principles:**
- Unified interface for all AI operations
- Provider-specific implementations behind abstraction
- User configures their preferred provider(s)
- Graceful fallback when AI unavailable

## Technical Constraints

- **Architecture:** Local-first, decentralized, optional P2P sync
- **Platform:** PWA (Progressive Web App) - mobile and desktop
- **AI:** Optional enhancement, app fully works without it
- **AI Providers:** Abstraction layer supporting OpenRouter, Yandex, and future providers
- **Privacy:** User data never stored on our servers, AI calls go directly to user's provider
- **Sync:** P2P via Yjs + WebRTC, optional self-hosted server later
- **No server required for MVP:** Pure client-side with optional P2P
- **Offline:** Full functionality without internet (AI features need connection when available)

## User Context

**Target Users:** Personal use (single user, not collaborative)

**Primary Use Case:** Capture thoughts quickly without friction. AI works in background to extract tasks, apply properties, and surface recommendations. User focuses on doing, not organizing.

**User Flow:**
1. User opens app, types or speaks → **thought is created**
2. AI (background, if available) analyzes thought
3. If actionable → AI **automatically creates linked task(s)** with properties applied
4. No approval needed - user edits only if AI got it wrong
5. Inbox shows AI recommendations automatically when opened
6. User works through tasks via recommendations or static filtered views
7. Completed tasks go to archive

## Keyboard Navigation

| Action | Hotkey |
|--------|--------|
| Quick capture | Global shortcut (configurable) |
| Navigate items | Arrow keys / j,k |
| Open item | Enter |
| Complete task | Space or x |
| Edit item | e |
| Delete | d or Backspace |
| Go to Inbox | g then i |
| Go to Tasks | g then t |
| Go to Thoughts | g then h |

*All core actions accessible without mouse*

## Task Properties (GTD-Based)

| Property | Description | AI Applied |
|----------|-------------|------------|
| Next Action | The concrete physical step to take | Automatically |
| Context | Where/tools needed (@computer, @phone, @errands, @home) | Automatically |
| Energy Required | High focus vs autopilot task | Automatically |
| Time Estimate | How long it will take | Automatically |
| Hard Deadline | Only real deadlines, not aspirational | Automatically |
| Project | What larger outcome it belongs to | Automatically |
| Someday/Maybe | Not committed but captured for later | Automatically |

*AI applies all properties automatically. User edits if needed.*

## Thoughts & Tasks Relationship

**New model:**
- **Thought** = raw capture (always created first)
- **Task** = actionable item extracted by AI (linked to source thought)

**How it works:**
1. User captures → Thought created
2. AI analyzes (background) → Creates 0, 1, or many Tasks
3. Tasks link back to source Thought for context
4. Thought remains searchable even after tasks extracted
5. User can manually convert thought to task if AI missed it

## Voice Transcription Requirements

**Quality standards:**
- Sentences start with capital letter
- Proper punctuation (periods, commas, question marks)
- Correct grammar structure
- Language-appropriate formatting

**Technical approach:**
- Single multimodal API call to user's chosen model
- Prompt instructs: transcribe + format + extract tasks
- One round-trip for complete processing

## Viewing Options

**Both work without AI:**

1. **Inbox with AI Recommendations** - Opens with suggestions visible (if AI available)
2. **Static Views** - Filter by context, energy, project, deadline, etc.

*Static views are fully functional without AI. Inbox shows items with or without recommendations.*

## Edge Cases & Considerations

- What if AI unavailable? → App works normally, just without AI enhancements
- What if AI can't determine if actionable? → Creates thought only, user can convert later
- What if voice recording is unclear? → Keep original, show transcript, allow manual editing
- What if user disagrees with AI? → Easy to edit, no approval step to slow down
- Multiple tasks in one thought? → AI extracts all, links each to source thought
- Recurring task completion? → Creates next instance automatically

## Implicit Requirements

- [Architecture] Offline-capable - works fully without internet
- [UX] Keyboard-first navigation with hotkeys
- [Data] All data exportable (user owns their data)
- [AI] AI is enhancement, not requirement - app works without it

## Success Criteria

How we know this is complete and working:

- Capture a thought in under 3 seconds (text or voice)
- App fully functional without AI configured
- AI correctly identifies 90%+ of actionable items (when available)
- Zero approval steps - AI applies, user edits if wrong
- All navigation possible via keyboard
- Voice transcription returns properly formatted text
- Multiple AI providers configurable
- Inbox shows recommendations immediately on open

## Out of Scope (MVP)

Explicitly excluded from first version:
- Notifications and reminders
- Server infrastructure
- Data backup/export features
- Collaboration/sharing
- Calendar integration

## Next Steps

1. Review this PRD for accuracy and completeness
2. If anything is missing or unclear, continue the conversation
3. When ready, use `/clavix:plan` to generate implementation tasks

---

## Refinement History

### 2025-12-13

**Changes made:**
- [MODIFIED] AI is now optional, runs in background - app fully works without it
- [MODIFIED] Capture creates thoughts; AI creates tasks from thoughts (not direct task capture)
- [MODIFIED] AI applies decisions automatically - no user approval needed
- [MODIFIED] Inbox shows recommendations automatically on open (no button)
- [MODIFIED] OpenRouter: user chooses their model (not hardcoded to Gemini)
- [MODIFIED] Voice transcription must return properly formatted text (capitals, punctuation)
- [ADDED] Keyboard navigation with hotkeys for all core actions
- [ADDED] AI provider abstraction layer for multiple providers
- [ADDED] Yandex provider support (STT + AI)
- [ADDED] Single multimodal API call for voice processing

**Rationale:** Make AI a background enhancement rather than a requirement. Reduce friction to zero - capture fast, AI handles the rest, user only intervenes if needed.

---
*This PRD was generated by Clavix from conversational requirements gathering.*
