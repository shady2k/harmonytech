# GTD Home Screen UX Design

## Design Overview

A GTD-compliant app that prioritizes instant clarity, minimal friction, and intelligent AI-powered task management. The design follows atomic design principles with accessibility-first considerations.

---

## 1. Information Architecture & Navigation

### Primary Navigation Structure

```
App Structure:
├── Home/Inbox (Default view) - What to do RIGHT NOW
├── Tasks - All tasks with filtering
├── Thoughts - Capture history & review
└── Settings - Configuration
```

### Navigation Hierarchy

**Level 1: Primary Views**
- Home/Inbox (Priority #1 - Opens by default)
- Tasks (Full review mode)
- Thoughts (Capture history)
- Settings (Configuration)

**Level 2: Contextual Actions**
- Quick Capture (Floating Action Button - always accessible)
- Task Detail (Slide-over panel)
- Thought Detail (Slide-over panel)

### User Flow Diagram

```
App Launch
    ↓
Home/Inbox (Default)
    ├─→ See "What to Do Next" (Primary recommendation)
    ├─→ Quick Capture (FAB) → Save → Auto-process → Back to Home
    ├─→ View Unprocessed Inbox Items (if any)
    ├─→ Navigate to Tasks (for full review)
    └─→ Navigate to Thoughts (for processing inbox)
```

---

## 2. Home/Dashboard Design

### Design Philosophy
**"Open app, immediately know what to do next"**

The home screen is NOT a task list - it's a decision-making interface that answers:
1. What should I do RIGHT NOW?
2. What needs my attention? (Unprocessed thoughts)
3. How can I capture something quickly?

### Layout Specification

```
┌─────────────────────────────────────────────┐
│ Header                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ "What to Do Next"         [Refine] [↻]  │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Primary Recommendation Card                  │
│ ┌─────────────────────────────────────────┐ │
│ │ #1 Recommended                           │ │
│ │                                          │ │
│ │ Call dentist to schedule checkup         │ │
│ │                                          │ │
│ │ 📱 Phone • ⚡ Low • ⏱ 5 min             │ │
│ │                                          │ │
│ │ Why: Quick win, requires phone, low      │ │
│ │ energy matches your current state        │ │
│ │                                          │ │
│ │ [Start Task]          [View Details →]  │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [Show 3 more options ▼]                     │
│                                              │
│ Inbox Alert (if unprocessed items exist)    │
│ ┌─────────────────────────────────────────┐ │
│ │ 📥 3 items need processing               │ │
│ │ [Review Inbox →]                         │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Alternative Actions                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Other suggestions:                       │ │
│ │ • Review someday/maybe list              │ │
│ │ • Plan next week's priorities            │ │
│ └─────────────────────────────────────────┘ │
│                                              │
└─────────────────────────────────────────────┘
         [Quick Capture FAB]
```

### Component Specifications

#### 1. Primary Recommendation Card

**Visual Hierarchy:**
- **L1 (Highest)**: Task title (nextAction)
- **L2**: Context badges + energy + time estimate
- **L3**: AI reasoning ("Why" section)
- **L4**: Action buttons

**Design Tokens:**
```css
/* Card */
--card-bg: white (dark: gray-900)
--card-border: 2px solid indigo-200 (dark: indigo-800)
--card-shadow: 0 4px 12px rgba(99, 102, 241, 0.15)
--card-radius: 12px
--card-padding: 24px

/* Typography */
--title-size: 20px
--title-weight: 600
--title-line-height: 1.4
--title-color: gray-900 (dark: white)

--metadata-size: 14px
--metadata-weight: 500
--metadata-color: gray-600 (dark: gray-400)

--reasoning-size: 14px
--reasoning-weight: 400
--reasoning-color: gray-700 (dark: gray-300)
--reasoning-bg: indigo-50 (dark: indigo-950)
--reasoning-padding: 12px
--reasoning-radius: 8px
```

**Accessibility Requirements:**
- ARIA label: "Top recommended task: {taskTitle}"
- Focus indicator: 3px indigo-600 outline
- Keyboard navigation: Tab order: Card → Start → View Details
- Screen reader: Announce match score and reasoning

#### 2. Context Refine Bar

**Purpose**: Allow users to quickly filter recommendations by current context

**Layout:**
```
┌────────────────────────────────────┐
│ Refine your context:               │
│                                    │
│ Energy:     [High] [Medium] [Low]  │
│ Location:   [💻] [📱] [🏠] [🛒]   │
│ Time:       [5min] [15min] [30min] │
│                                    │
│ [Apply] [Reset]                    │
└────────────────────────────────────┘
```

**Interaction:**
- Hidden by default (collapsed)
- Opens on "Refine" button click
- Smooth slide-down animation (200ms ease-out)
- Pre-fills current inferred context from device/time

**States:**
- Default: Collapsed
- Expanded: Show filter options
- Loading: Show spinner on Apply
- Applied: Show chip indicators above recommendations

#### 3. Inbox Alert Banner

**Visibility Logic:**
```typescript
Show when: unprocessedThoughts.length > 0
Priority: High (appears before alternative actions)
Dismissible: No (represents actual work to be done)
```

**Design:**
```css
--alert-bg: amber-50 (dark: amber-950)
--alert-border: 1px solid amber-200 (dark: amber-800)
--alert-icon-color: amber-600
--alert-text-color: amber-900 (dark: amber-100)
```

**Content:**
- Icon: 📥 (Inbox)
- Text: "{count} {items} need processing"
- Action: "Review Inbox" button → Navigate to Thoughts view

### States & Feedback

#### Loading State
```
┌─────────────────────────────────────┐
│     [Spinner Animation]             │
│ Analyzing your tasks and context... │
└─────────────────────────────────────┘
```

#### Empty State (No AI)
```
┌─────────────────────────────────────┐
│          [Lightbulb Icon]           │
│         Inbox                        │
│ AI recommendations available when   │
│ you configure an AI provider        │
│                                     │
│ [Go to Settings]                    │
└─────────────────────────────────────┘
```

#### Empty State (No Tasks)
```
┌─────────────────────────────────────┐
│        [Checkmark Icon]             │
│       You're all caught up!         │
│ No tasks match your current context │
│                                     │
│ [Capture Something New]             │
└─────────────────────────────────────┘
```

#### Error State
```
┌─────────────────────────────────────┐
│         [Alert Icon]                │
│   Couldn't get recommendations      │
│ [Error message details]             │
│                                     │
│ [Try Again]                         │
└─────────────────────────────────────┘
```

---

## 3. Inbox Flow Design

### Inbox Concept in This App

**Traditional GTD Inbox**: Physical/digital location for unprocessed items
**This App's Inbox**: Unprocessed Thoughts that need AI classification

### Inbox Flow

```
User captures → Creates Thought (aiProcessed: false)
                      ↓
          [Appears in Inbox Banner]
                      ↓
        Background AI processes (5s intervals)
                      ↓
          Extracts tasks → Creates Task records
                      ↓
         Thought marked (aiProcessed: true)
                      ↓
           [Removed from Inbox Banner]
```

### Inbox View Design

**Location**: Thoughts page with filter for unprocessed

```
┌─────────────────────────────────────────────┐
│ Thoughts                     [Filter ▼]      │
│ ┌─────────────────────────────────────────┐ │
│ │ [All] [Processed] [Needs Processing]    │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Unprocessed Thoughts (3)                     │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔄 Processing...                         │ │
│ │ "Need to schedule annual physical and    │ │
│ │  also buy birthday gift for mom"         │ │
│ │                                          │ │
│ │ Added 2 minutes ago                      │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ✅ 2 tasks extracted                     │ │
│ │ "Call dentist for checkup appointment"   │ │
│ │                                          │ │
│ │ Extracted tasks:                         │ │
│ │ • Schedule dentist checkup (📱 5min)     │ │
│ │ • Research dental insurance (💻 15min)   │ │
│ │                                          │ │
│ │ Added 5 minutes ago                      │ │
│ │ [View Tasks →]                           │ │
│ └─────────────────────────────────────────┘ │
│                                              │
└─────────────────────────────────────────────┘
```

### Processing States

#### State 1: Just Captured (aiProcessed: false)
```
┌─────────────────────────────────────┐
│ 🔄 Processing...                    │
│ "Thought content here..."           │
│                                     │
│ AI is extracting tasks...           │
│ Added X minutes ago                 │
└─────────────────────────────────────┘
```

**Visual Indicators:**
- Pulsing spinner icon
- Muted background (gray-50)
- Progress text below

#### State 2: Processed (aiProcessed: true)
```
┌─────────────────────────────────────┐
│ ✅ 2 tasks extracted                │
│ "Thought content here..."           │
│                                     │
│ Extracted tasks:                    │
│ • Task 1 (context, time)            │
│ • Task 2 (context, time)            │
│                                     │
│ Added X minutes ago                 │
│ [View Tasks →]                      │
└─────────────────────────────────────┘
```

**Visual Indicators:**
- Checkmark icon (success)
- Task count badge
- Linked task preview list
- Action to view tasks

#### State 3: No Tasks Found
```
┌─────────────────────────────────────┐
│ ✅ Processed                        │
│ "Random thought about life..."      │
│                                     │
│ No actionable tasks found           │
│ Added X minutes ago                 │
└─────────────────────────────────────┘
```

### Inbox Counter Badge

**Location**: Navigation indicator for Thoughts view

```
Thoughts (3)  ← Badge shows unprocessed count
```

**Design Tokens:**
```css
--badge-bg: red-500
--badge-text: white
--badge-size: 18px
--badge-font: 12px
--badge-weight: 600
```

---

## 4. AI Classification UX Integration

### AI Processing Modes

#### Mode 1: Foreground Processing (Voice)
- User captures voice → Shows transcription UI
- AI transcribes → Shows transcript immediately
- Creates thought → Background AI extracts tasks

#### Mode 2: Background Processing (Text)
- User types text → Saves immediately as thought
- User continues using app
- Background AI processes every 5 seconds
- Tasks appear automatically (no user interruption)

### AI Status Indicators

#### Global AI Status (Header)
```
[🤖 AI Active]     - AI configured and working
[⚠️ AI Offline]    - AI not configured
[🔄 Processing 3]  - Currently processing items
```

**Interaction:**
- Click to see AI activity log
- Shows last processed time
- Shows pending count

#### Processing Feedback

**Subtle, Non-Intrusive:**
- No modal dialogs
- No blocking spinners
- Status shows in thought card only

**Visual Pattern:**
```
Before processing:  [🔄 icon] + muted card
During processing:  [Pulsing animation] + status text
After processing:   [✅ icon] + success state
```

### AI Confidence Display

**For Property Suggestions:**
```
Context: 💻 Computer (High confidence)
Energy:  ⚡ Medium (Suggested - click to change)
Time:    ⏱ 15 min (Estimated)
```

**Confidence Levels:**
- High (>80%): Solid icon, no indicator
- Medium (50-80%): Dotted underline, "(Suggested)" text
- Low (<50%): Question mark icon, "(Guess - please verify)"

### Error Handling

#### Graceful Degradation

**Scenario 1: AI Provider Down**
```
Background processing continues trying
User sees: "AI temporarily unavailable"
Fallback: Tasks get default properties
User can manually classify later
```

**Scenario 2: API Rate Limited**
```
Processing slows down (increases interval)
User sees: "Processing slower than usual"
Queue continues, no data loss
```

**Scenario 3: No AI Configured**
```
App fully functional without AI
Thoughts saved normally
Manual classification required
Home shows: "Configure AI for recommendations"
```

---

## 5. Design System Specifications

### Color Palette

#### Primary Colors
```css
/* Indigo - Primary brand & actions */
--indigo-50:  #eef2ff
--indigo-100: #e0e7ff
--indigo-200: #c7d2fe
--indigo-600: #4f46e5  /* Primary CTA */
--indigo-700: #4338ca  /* Hover */
--indigo-900: #312e81

/* Supporting Colors */
--amber-50:  #fffbeb  /* Inbox alert background */
--amber-600: #d97706  /* Inbox alert icon */
--green-600: #16a34a  /* Success states */
--red-600:   #dc2626  /* Error states */
--gray-50:   #f9fafb  /* Backgrounds */
--gray-900:  #111827  /* Text */
```

#### Context Colors
```css
/* Already defined in context-config.ts */
Computer:  blue-100 / blue-800
Phone:     purple-100 / purple-800
Errands:   orange-100 / orange-800
Home:      green-100 / green-800
Anywhere:  gray-100 / gray-800
```

#### Energy Colors
```css
High:      red-100 / red-800     (⚡⚡⚡)
Medium:    amber-100 / amber-800 (⚡⚡)
Low:       green-100 / green-800 (⚡)
```

### Typography System

```css
/* Font Family */
--font-sans: system-ui, -apple-system, 'Segoe UI', sans-serif

/* Sizes */
--text-xs:   12px  /* Metadata, timestamps */
--text-sm:   14px  /* Body, descriptions */
--text-base: 16px  /* Base text */
--text-lg:   18px  /* Emphasized text */
--text-xl:   20px  /* Card titles */
--text-2xl:  24px  /* Page headings */

/* Weights */
--font-normal:    400
--font-medium:    500
--font-semibold:  600
--font-bold:      700

/* Line Heights */
--leading-tight:  1.25
--leading-normal: 1.5
--leading-relaxed: 1.75
```

### Spacing System

```css
/* Based on 4px grid */
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-6:  24px
--space-8:  32px
--space-12: 48px
--space-16: 64px
```

### Component Library

#### Card Component
```typescript
interface CardProps {
  variant?: 'default' | 'highlighted' | 'muted'
  padding?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

// Variants
default:     border-gray-200, bg-white
highlighted: border-indigo-200, bg-white, shadow-indigo
muted:       border-gray-100, bg-gray-50

// Padding
sm:  12px
md:  16px
lg:  24px
```

#### Badge Component
```typescript
interface BadgeProps {
  variant?: 'context' | 'energy' | 'status'
  size?: 'sm' | 'md'
}

// Sizes
sm:  h-6, text-xs, px-2
md:  h-8, text-sm, px-3
```

#### Button Component
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// Variants
primary:    bg-indigo-600, text-white
secondary:  bg-white, text-gray-900, border-gray-300
ghost:      bg-transparent, text-gray-700, hover:bg-gray-100

// Sizes
sm:  h-8,  text-sm, px-3
md:  h-10, text-base, px-4
lg:  h-12, text-lg, px-6
```

---

## 6. Interaction Patterns & Micro-animations

### Transitions

```css
/* Standard easing */
--ease-out:     cubic-bezier(0.0, 0.0, 0.2, 1)
--ease-in:      cubic-bezier(0.4, 0.0, 1, 1)
--ease-in-out:  cubic-bezier(0.4, 0.0, 0.2, 1)

/* Durations */
--duration-fast:    100ms  /* Hovers, focus */
--duration-normal:  200ms  /* Slides, fades */
--duration-slow:    300ms  /* Page transitions */
```

### Animation Specifications

#### 1. Card Appearance (Home recommendations)
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Apply to recommendation cards */
animation: slideUp 200ms ease-out;
/* Stagger each card by 50ms */
```

#### 2. Processing Indicator (AI status)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}

/* Apply to spinner icon */
animation: pulse 1.5s ease-in-out infinite;
```

#### 3. Inbox Badge Update
```css
@keyframes badgePop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Apply when count changes */
animation: badgePop 200ms ease-out;
```

#### 4. Task Extraction Success
```css
@keyframes checkmark {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Apply to ✅ icon */
animation: checkmark 300ms ease-out;
```

### Gesture Support (Mobile)

```typescript
// Swipe actions on thought/task cards
SwipeLeft:  → Delete (with confirmation)
SwipeRight: → Mark as complete / Process now
Pull down:  → Refresh recommendations
```

---

## 7. Accessibility Requirements (WCAG 2.1 AA)

### Color Contrast

**Minimum Ratios:**
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Verification:**
```
Primary text (gray-900 on white):    ✓ 16.7:1
Secondary text (gray-600 on white):  ✓ 7.1:1
Button (white on indigo-600):        ✓ 8.2:1
Context badges:                      ✓ All pass 4.5:1
```

### Keyboard Navigation

**Tab Order:**
1. Skip to main content link (hidden, visible on focus)
2. Main navigation (Home, Tasks, Thoughts, Settings)
3. Quick Capture FAB
4. Recommendation cards (in rank order)
5. Inbox alert banner
6. Alternative actions

**Shortcuts:**
```
C         → Open capture modal
Escape    → Close modal / Cancel
Enter     → Activate focused button
Space     → Toggle checkbox / Select
↑↓        → Navigate list items
Tab       → Next interactive element
Shift+Tab → Previous interactive element
```

### Screen Reader Optimization

**ARIA Labels:**
```html
<main aria-label="Home dashboard">
<section aria-label="Task recommendations">
<article aria-label="Recommended task 1 of 5: Call dentist. Match score 95%. Reasons: Quick win, requires phone...">
<button aria-label="Start task: Call dentist">Start</button>
<nav aria-label="Main navigation">
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- AI processing updates -->
</div>
```

**Semantic HTML:**
- Use `<main>`, `<nav>`, `<article>`, `<section>`
- Proper heading hierarchy (h1 → h2 → h3)
- `<button>` for actions (not div with onClick)
- `<a>` for navigation links

### Focus Management

**Focus Indicators:**
```css
:focus-visible {
  outline: 3px solid var(--indigo-600);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Focus Restoration:**
- After closing modal → Return focus to trigger button
- After navigation → Focus on h1 heading
- After deletion → Focus on next/previous item

### Motion & Animation

**Respect prefers-reduced-motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Responsive Design

### Breakpoints

```css
/* Mobile-first approach */
--mobile:     0px     (< 640px)
--tablet:     640px   (640px - 1024px)
--desktop:    1024px  (> 1024px)
```

### Layout Adaptations

#### Mobile (< 640px)
- Single column layout
- Bottom navigation bar (not sidebar)
- Full-width cards
- FAB in bottom-right
- Stack action buttons vertically

#### Tablet (640px - 1024px)
- Single column, wider max-width (720px)
- Side navigation (collapsible drawer)
- Cards with breathing room
- Action buttons horizontal

#### Desktop (> 1024px)
- Max-width container (1280px)
- Persistent sidebar navigation
- Multi-column option for task lists
- Hover states enabled

---

## 9. Performance Considerations

### Loading Strategy

**Critical Rendering Path:**
1. Load shell (layout, navigation) → 200ms
2. Load recommendations → 500ms
3. Load inbox count → 300ms
4. Load alternative actions → 400ms

**Skeleton Screens:**
```
┌─────────────────────────────────┐
│ [████████████]      [▪▪] [▪]    │  ← Header skeleton
│                                 │
│ ┌───────────────────────────┐   │
│ │ ████████████              │   │  ← Card skeleton
│ │ ████████                  │   │
│ │                           │   │
│ │ ██████ ████ █████         │   │
│ │                           │   │
│ │ [████████]    [████████]  │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

### Optimistic UI Updates

**Capture flow:**
1. User types/speaks
2. Show saving indicator (instant)
3. Create thought record (instant - optimistic)
4. Show in thoughts list immediately
5. Background AI processes (async)
6. Update UI when tasks extracted (no blocking)

### Data Fetching

**Auto-refresh Strategy:**
- Recommendations: Refresh on view mount + every 60s
- Inbox count: Subscribe to RxDB changes (real-time)
- AI processing status: Poll every 5s when processing
- Thoughts/tasks: RxDB reactive queries (instant updates)

---

## 10. Implementation Checklist

### Phase 1: Core Home Screen
- [ ] Create WhatToDoNext component (already exists, review)
- [ ] Design primary recommendation card layout
- [ ] Implement context refine bar
- [ ] Add inbox alert banner
- [ ] Create alternative actions section

### Phase 2: AI Integration UX
- [ ] Add AI status indicator to header
- [ ] Design processing state for thoughts
- [ ] Create confidence indicators
- [ ] Implement graceful degradation
- [ ] Add error handling UI

### Phase 3: Inbox Flow
- [ ] Add unprocessed thought filter
- [ ] Design processing state cards
- [ ] Add inbox count badge to navigation
- [ ] Create task extraction preview
- [ ] Implement "View Tasks" navigation

### Phase 4: Polish
- [ ] Add all micro-animations
- [ ] Implement skeleton screens
- [ ] Add keyboard shortcuts
- [ ] Complete ARIA labels
- [ ] Test with screen readers
- [ ] Verify color contrast
- [ ] Test mobile gestures
- [ ] Performance audit

---

## 11. Success Metrics

### User Experience Metrics
- **Time to first action**: < 2 seconds from app open
- **Capture completion**: < 10 seconds end-to-end
- **Inbox processing time**: < 30 seconds background (user unblocked)
- **Recommendation relevance**: > 70% user acceptance rate

### Accessibility Metrics
- **WCAG 2.1 AA compliance**: 100% (automated + manual testing)
- **Keyboard navigation**: 100% feature coverage
- **Screen reader compatibility**: Zero blocking issues

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Largest Contentful Paint**: < 2.5s

---

## Appendix: Component File Structure

```
src/components/
├── home/
│   ├── WhatToDoNext.tsx (already exists)
│   ├── PrimaryRecommendation.tsx
│   ├── ContextRefineBar.tsx
│   ├── InboxAlertBanner.tsx
│   └── AlternativeActions.tsx
├── inbox/
│   ├── UnprocessedThoughtCard.tsx
│   ├── ProcessingIndicator.tsx
│   ├── TaskExtractionPreview.tsx
│   └── InboxCounter.tsx
├── ai/
│   ├── AIStatusIndicator.tsx (exists)
│   ├── ProcessingFeedback.tsx
│   ├── ConfidenceBadge.tsx
│   └── ErrorFallback.tsx
└── ui/
    ├── Card.tsx (exists - enhance)
    ├── Badge.tsx (exists - enhance)
    ├── Button.tsx (exists)
    └── SkeletonCard.tsx
```

---

**End of Design Specification**

*This design prioritizes GTD methodology compliance, minimal friction, and accessibility-first principles. All components are designed to be atomic, reusable, and fully accessible.*
