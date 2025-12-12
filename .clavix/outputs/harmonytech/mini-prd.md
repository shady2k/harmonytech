# Requirements: HarmonyTech

*Generated from conversation on 2025-12-12*

## Objective

Build an AI-powered GTD (Getting Things Done) app that eliminates the friction of forced categorization. Users simply capture thoughts and tasks naturally (text or voice), and AI handles the organization - suggesting properties, grouping items, and extracting actionable tasks from raw input. The app respects user privacy with a local-first, decentralized architecture.

## Core Requirements

### Must Have (High Priority)

- [HIGH] **Frictionless text capture** - Just type, no required fields, AI processes later
- [HIGH] **Voice input with preservation** - Record voice, keep original, send audio to Gemini via OpenRouter for transcription + task extraction in one call
- [HIGH] **AI task extraction** - Distinguish actionable tasks from non-actionable thoughts
- [HIGH] **AI property suggestions** - Suggest context, energy, time estimate, deadline, project based on GTD best practices
- [HIGH] **User control over suggestions** - Accept, choose alternative, or type custom value
- [HIGH] **Local-first architecture** - Data lives on device, privacy by default
- [HIGH] **PWA** - Works on mobile and desktop browsers
- [HIGH] **Responsive design** - Same great experience on phone and computer
- [HIGH] **OpenRouter integration (BYOK)** - User provides their own API key

### Should Have (Medium Priority)

- [MEDIUM] **AI-powered "what to do next"** - Smart recommendations based on context, energy, time
- [MEDIUM] **Static filtered views** - Manual browsing by context, energy, project, etc.
- [MEDIUM] **Recurring tasks** - Daily, weekly, monthly task repetition
- [MEDIUM] **Task archive** - Completed tasks preserved for history/stats
- [MEDIUM] **P2P sync** - Sync between devices without server
- [MEDIUM] **Thoughts management** - Searchable, AI resurfaces relevant ones, convert to task, tag/link to projects

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
| **AI Provider** | OpenRouter (BYOK) |
| **Voice-to-Text** | Gemini via OpenRouter (audio input) |
| **PWA** | Vite PWA Plugin |

## Technical Constraints

- **Architecture:** Local-first, decentralized, optional P2P sync
- **Platform:** PWA (Progressive Web App) - mobile and desktop
- **AI Provider:** OpenRouter (BYOK - Bring Your Own Key)
- **Privacy:** User data never stored on our servers, AI calls go directly to user's provider
- **Sync:** P2P via Yjs + WebRTC, optional self-hosted server later
- **No server required for MVP:** Pure client-side with optional P2P
- **Offline:** Full functionality without internet (except AI features)

## User Context

**Target Users:** Personal use (single user, not collaborative)

**Primary Use Case:** Capture tasks and thoughts quickly without friction, let AI organize and suggest properties, review and work through tasks using AI recommendations or manual filtering.

**User Flow:**
1. User opens app, types or speaks a thought/task
2. AI processes input - extracts task(s) if actionable, stores as thought if not
3. For tasks: AI suggests properties (context, energy, time, deadline, project)
4. User taps to accept, picks alternative, or types custom value
5. Task is saved and organized
6. When ready to work: user asks AI "what should I do?" or browses filtered lists
7. Completed tasks go to archive

## Task Properties (GTD-Based)

| Property | Description | AI Suggested |
|----------|-------------|--------------|
| Next Action | The concrete physical step to take | Yes |
| Context | Where/tools needed (@computer, @phone, @errands, @home) | Yes |
| Energy Required | High focus vs autopilot task | Yes |
| Time Estimate | How long it will take | Yes |
| Hard Deadline | Only real deadlines, not aspirational | Yes |
| Project | What larger outcome it belongs to | Yes |
| Someday/Maybe | Not committed but captured for later | Yes |

## Thoughts (Non-Actionable Items)

When AI determines input is not actionable:
- Store as searchable thought/note
- AI periodically resurfaces relevant ones
- User can manually convert to task when ready
- Can be tagged or linked to projects

## Viewing Options

Users choose their preferred workflow:

1. **AI-Powered** - "What should I do now?" based on context, energy, available time
2. **Static Views** - Filter by context, energy, project, deadline, etc.

Both available, user picks what works for them.

## Edge Cases & Considerations

- What if AI can't determine if something is a task or thought? → Default to thought, user can convert
- What if voice recording is unclear? → Keep original, show transcript, allow manual editing
- What if user disagrees with AI suggestion? → Easy to change, AI learns from patterns over time
- Multiple tasks in one voice recording? → AI extracts all, presents each for review
- Recurring task completion? → Creates next instance automatically

## Implicit Requirements

*Inferred from conversation context - please verify:*

- [Architecture] Offline-capable - works without internet (AI features require connection)
- [UX] Quick capture widget or shortcut for fast entry
- [Data] All data exportable (user owns their data)
- [AI] Graceful degradation if AI unavailable - basic capture still works

## Success Criteria

How we know this is complete and working:

- Capture a thought in under 3 seconds (text or voice)
- AI correctly identifies 90%+ of actionable vs non-actionable items
- Property suggestions feel helpful, not annoying
- App works fully offline (except AI features)
- Sync works reliably between devices
- User feels in control, not forced into AI's decisions

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
*This PRD was generated by Clavix from conversational requirements gathering.*
