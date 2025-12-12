# Optimized Prompt (Clavix Enhanced)

## Project: HarmonyTech - AI-Powered Frictionless GTD App

Build a local-first PWA for personal task and thought management that eliminates capture friction through AI assistance. Users input via text or voice without required fields; AI extracts tasks, suggests GTD-based properties, and organizes everything while users retain full control.

### Core Architecture

- **Local-first**: All data stored on device, works offline (except AI features)
- **P2P sync**: Device-to-device sync without central server
- **PWA**: Single codebase for mobile and desktop, responsive design
- **BYOK AI**: OpenRouter integration, user provides their own API key

### Capture Flow

1. **Input**: Text field or voice recording (no required fields)
2. **Processing**: AI analyzes input, extracts task(s) or classifies as thought
3. **Task Enhancement**: AI suggests properties (user accepts/modifies/customizes):
   - Next action (concrete physical step)
   - Context (@computer, @phone, @errands, @home)
   - Energy required (high focus / autopilot)
   - Time estimate
   - Hard deadline (real deadlines only)
   - Project
   - Someday/maybe flag
4. **Storage**: Task saved with properties, or thought stored for later

### Voice Input Specifics

- Preserve original audio recording
- Show transcript (editable)
- Extract multiple tasks from single recording
- Link extracted tasks back to source recording

### Viewing & Working

Two modes (user chooses):
1. **AI Recommendations**: "What should I do now?" based on current context, energy, available time
2. **Static Views**: Filter/browse by context, energy, project, deadline, status

### Thoughts System

Non-actionable items stored separately:
- Fully searchable
- AI resurfaces relevant thoughts periodically
- Convert to task when ready
- Tag or link to projects

### Additional Features

- **Recurring tasks**: Daily, weekly, monthly repetition with auto-creation
- **Task archive**: Completed tasks preserved, searchable, stats-ready

### MVP Exclusions

- Notifications/reminders
- Server infrastructure
- Data backup/export
- Collaboration features

### Success Metrics

- Capture time: < 3 seconds from app open to saved
- AI accuracy: 90%+ correct task vs thought classification
- Offline: Full functionality without internet (except AI)
- User control: Easy to override any AI suggestion

---

## Optimization Improvements Applied

1. **[STRUCTURED]** - Reorganized from narrative paragraphs into scannable sections with clear hierarchy (Architecture → Flow → Features → Exclusions → Metrics)

2. **[CLARIFIED]** - Made capture flow explicit as numbered steps instead of prose description; specified exact property list with concrete examples

3. **[COMPLETENESS]** - Added success metrics with specific targets (< 3 seconds, 90%+ accuracy); added offline capability requirement that was implicit

4. **[EFFICIENCY]** - Reduced from 6 paragraphs to structured sections; removed conversational phrases ("the key is", "the main pain point"); information density increased ~40%

5. **[ACTIONABILITY]** - Converted vague "works well on mobile and desktop" to specific "PWA, responsive design, single codebase"; converted "keep history" to "searchable, stats-ready"

6. **[SCOPED]** - Explicitly listed MVP exclusions in dedicated section; clarified "personal use" means no collaboration features needed

---
*Optimized by Clavix on 2025-12-12. This version is ready for implementation.*
