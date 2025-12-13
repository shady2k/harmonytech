# GTD Home Screen Design - Documentation Index

## Overview

This directory contains comprehensive UX/UI design documentation for the HarmonyTech GTD app's home screen experience. The design prioritizes:

- **Speed**: Users see what to do next in < 2 seconds
- **Clarity**: GTD-compliant information architecture
- **Minimal Friction**: AI handles classification automatically
- **Accessibility**: WCAG 2.1 AA compliant throughout

---

## Documents in This Directory

### 1. [home-screen-ux-design.md](./home-screen-ux-design.md)
**Main design specification document**

Contains:
- Complete information architecture and navigation structure
- Detailed home/dashboard design specifications
- Inbox flow and processing states
- AI classification UX integration patterns
- Full design system (colors, typography, spacing, components)
- Interaction patterns and micro-animations
- Accessibility requirements (WCAG 2.1 AA)
- Responsive design breakpoints
- Performance considerations
- Success metrics

**Use this for:** Understanding the overall design vision, design rationale, and complete specifications.

---

### 2. [design-tokens.css](./design-tokens.css)
**Design system tokens (CSS custom properties)**

Contains:
- Color palette (primary, neutral, semantic, context, energy)
- Typography scale (sizes, weights, line heights)
- Spacing system (4px base grid)
- Border radius values
- Shadow system
- Z-index scale
- Transition durations and easing functions
- Component-specific tokens
- Dark mode support
- Accessibility utilities

**Use this for:**
- Import into your CSS build
- Reference when creating components
- Ensuring design consistency
- Dark mode implementation

**Integration:**
```css
@import './design-tokens.css';
```

---

### 3. [wireframes.md](./wireframes.md)
**ASCII wireframes for all key screens**

Contains visual layouts for:
- Home screen (all states: active, loading, empty, error)
- Context refine bar (expanded/collapsed)
- Inbox/thoughts view with processing states
- Quick capture modal
- Task detail slide-over
- Desktop layout
- AI status indicator states
- Component anatomy diagrams

**Use this for:**
- Quick visual reference during development
- Understanding component hierarchy and spacing
- Layout discussions with team
- Component positioning and relationships

---

### 4. [implementation-guide.md](./implementation-guide.md)
**Practical implementation instructions**

Contains:
- Current architecture analysis (what exists vs. what's needed)
- Prioritized implementation order (3-week roadmap)
- Complete component code examples (TypeScript/React)
- Component API specifications
- State management patterns (Zustand store structure)
- Data flow diagrams
- Performance optimization strategies
- Accessibility implementation checklist
- Testing strategy and examples
- Developer integration notes

**Use this for:**
- Step-by-step implementation
- Copy-paste component code
- Understanding data flows
- Testing guidance

---

## Quick Start Guide

### For Designers

1. **Review the vision:** Read [home-screen-ux-design.md](./home-screen-ux-design.md) sections 1-4
2. **Understand the system:** Review section 5 (Design System Specifications)
3. **See it visually:** Check [wireframes.md](./wireframes.md) for layouts
4. **Iterate:** Use design tokens from [design-tokens.css](./design-tokens.css) when creating mockups

### For Developers

1. **Understand requirements:** Read [home-screen-ux-design.md](./home-screen-ux-design.md) sections 1-4
2. **Import tokens:** Add [design-tokens.css](./design-tokens.css) to your build
3. **Follow implementation plan:** Use [implementation-guide.md](./implementation-guide.md) phase-by-phase
4. **Reference wireframes:** Keep [wireframes.md](./wireframes.md) open while coding layouts

### For Product Managers

1. **User needs:** Read section 1 (Information Architecture) in [home-screen-ux-design.md](./home-screen-ux-design.md)
2. **Success metrics:** Review section 11 (Success Metrics)
3. **Implementation timeline:** Check 3-week roadmap in [implementation-guide.md](./implementation-guide.md)
4. **Visual understanding:** Review [wireframes.md](./wireframes.md)

---

## Design Principles

### 1. GTD Methodology Compliance

**Inbox Processing:**
- Unprocessed thoughts appear in dedicated inbox view
- AI processes in background (non-blocking)
- Clear visual states (processing → completed)
- Zero items left unprocessed

**Next Actions:**
- Home screen shows THE next action (singular focus)
- AI ranks by relevance to current context
- Reasoning displayed (transparency)
- Alternative actions suggested

**Contexts:**
- 5 contexts: Computer, Phone, Home, Errands, Anywhere
- Visual badges with icons and colors
- Filter recommendations by context
- Context-aware suggestions

### 2. Speed & Friction Reduction

**Instant Capture:**
- Floating action button (always accessible)
- Voice or text (user preference)
- Saves immediately as thought
- No classification required upfront

**Background Processing:**
- AI extracts tasks asynchronously
- User never waits for AI
- Optimistic UI updates
- Progressive enhancement

**Smart Recommendations:**
- Open app → See what to do next
- No navigation required
- Match score transparency
- One-tap to start task

### 3. Accessibility First

**WCAG 2.1 AA Compliance:**
- Color contrast ratios verified
- Keyboard navigation complete
- Screen reader optimization
- Focus management
- Semantic HTML
- ARIA labels and live regions

**Inclusive Design:**
- Reduced motion support
- High contrast mode support
- Touch targets ≥ 44px
- Clear visual hierarchy
- Plain language

### 4. Progressive Disclosure

**Information Hierarchy:**
- L1: Primary recommendation (most prominent)
- L2: Additional options (collapsed by default)
- L3: Alternative actions (muted card)
- L4: Settings and secondary actions

**Show What Matters:**
- Inbox alert only when items exist
- Processing status only when processing
- Context refine bar hidden by default
- Details on demand (slide-over panel)

---

## Component Inventory

### Existing Components (To Enhance)

| Component | Location | Enhancement Needed |
|-----------|----------|-------------------|
| WhatToDoNext | `/src/components/recommendations/` | Add refine bar integration |
| RecommendationCard | `/src/components/recommendations/` | Add highlighted variant for #1 |
| Card | `/src/components/ui/` | Add muted and highlighted variants |
| Badge | `/src/components/ui/` | Add size variants |
| ContextBadge | `/src/components/ui/` | Already good |
| EnergyIndicator | `/src/components/ui/` | Already good |

### New Components (To Create)

| Component | Location | Priority |
|-----------|----------|----------|
| PrimaryRecommendationCard | `/src/components/recommendations/` | P1 (Week 1) |
| ContextRefineBar | `/src/components/recommendations/` | P1 (Week 1) |
| InboxAlertBanner | `/src/components/inbox/` | P1 (Week 1) |
| AIStatusIndicator | `/src/components/ai/` | P2 (Week 2) |
| ProcessingStateCard | `/src/components/thoughts/` | P2 (Week 2) |
| SkeletonCard | `/src/components/ui/` | P3 (Week 3) |

---

## Key User Flows

### Flow 1: Daily Task Execution

```
1. User opens app
   → Home screen loads (< 2s)

2. Sees primary recommendation
   → "Call dentist" (📱 Phone, ⚡ Low, ⏱ 5 min)
   → Reasoning: "Quick win, matches low energy state"

3. Taps "Start Task"
   → Navigates to task detail
   → Marks as complete when done

4. Returns to home
   → Next recommendation appears
```

### Flow 2: Quick Capture

```
1. User has thought while walking

2. Taps floating action button (FAB)
   → Capture modal opens

3. Taps microphone icon
   → Records: "Remember to buy groceries and call mom about weekend"

4. Taps "Save"
   → Thought saved instantly (aiProcessed: false)
   → Modal closes
   → User continues using app

5. Background AI processes (within 30s)
   → Extracts 2 tasks:
      • Buy groceries (context: errands)
      • Call mom about weekend (context: phone)
   → Thought marked processed
   → Tasks appear in task list and recommendations
```

### Flow 3: Inbox Review

```
1. User sees inbox alert: "3 items need processing"

2. Taps "Review Inbox"
   → Navigates to thoughts view (filtered: unprocessed)

3. Sees 3 thoughts in different states:
   - Thought 1: 🔄 "Processing..." (AI extracting)
   - Thought 2: ✅ "2 tasks extracted" (with preview)
   - Thought 3: 🔄 "Processing..."

4. Taps "View Tasks" on Thought 2
   → Navigates to tasks view
   → Sees extracted tasks

5. Returns to home
   → Inbox count now shows "2 items"
```

---

## Design Decisions & Rationale

### Why Single Primary Recommendation?

**Decision:** Show only ONE recommendation prominently, with others collapsed

**Rationale:**
- GTD principle: Focus on THE next action
- Reduces decision fatigue
- Clearer visual hierarchy
- Matches user need: "What should I do RIGHT NOW?"
- Better mobile experience (less scrolling)

**Trade-off:** Users might miss other good options
**Mitigation:** "Show more" button, alternative actions section

---

### Why Background AI Processing?

**Decision:** AI processes thoughts asynchronously, never blocking user

**Rationale:**
- Faster capture flow (< 10 seconds)
- No waiting for AI response
- Graceful degradation (works offline)
- Better perceived performance
- Follows "thought-first" capture principle

**Trade-off:** Tasks don't appear immediately
**Mitigation:** Clear processing state, fast processing (< 30s typical)

---

### Why Inbox Alert Banner Instead of Badge?

**Decision:** Prominent banner on home screen, not just navigation badge

**Rationale:**
- Higher visibility (users notice it)
- Actionable (direct link to inbox)
- Follows GTD principle: Inbox to zero
- Creates healthy habit (review inbox regularly)

**Trade-off:** Takes screen real estate
**Mitigation:** Only shows when items exist, dismissible by processing

---

### Why Context Refine Bar Is Collapsed By Default?

**Decision:** Hide refine options until user clicks "Refine"

**Rationale:**
- Cleaner default UI
- Most users don't need to refine
- AI auto-detects context (time of day, location)
- Progressive disclosure principle
- Faster time-to-content

**Trade-off:** Power users need extra click
**Mitigation:** Prominent "Refine" button, remembers last filters

---

## Performance Budget

| Metric | Target | Rationale |
|--------|--------|-----------|
| First Contentful Paint | < 1.5s | User sees content quickly |
| Time to Interactive | < 3s | Can start interacting |
| Largest Contentful Paint | < 2.5s | Main content loaded |
| Time to First Recommendation | < 2s | Primary user need met |
| Capture to Save | < 500ms | Feels instant |
| AI Processing Time | < 30s | Background, non-blocking |
| Recommendation Refresh | < 500ms | With cache, feels instant |

---

## Accessibility Audit Checklist

### Color Contrast
- [ ] All text meets 4.5:1 ratio
- [ ] Large text (18px+) meets 3:1 ratio
- [ ] UI components meet 3:1 ratio
- [ ] Context badges pass contrast check
- [ ] Energy indicators pass contrast check
- [ ] Dark mode verified

### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Tab order logical
- [ ] Focus indicators visible (3px outline)
- [ ] No keyboard traps
- [ ] Skip to main content link
- [ ] Escape closes modals
- [ ] Arrow keys navigate lists

### Screen Reader
- [ ] All images have alt text
- [ ] ARIA labels on complex components
- [ ] Live regions for dynamic updates
- [ ] Semantic HTML throughout
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] Form labels associated
- [ ] Button text descriptive

### Motion & Animation
- [ ] Respects prefers-reduced-motion
- [ ] No animations > 5 seconds
- [ ] No auto-playing video/audio
- [ ] Parallax scrolling optional

### Touch & Mobile
- [ ] Touch targets ≥ 44px × 44px
- [ ] Swipe gestures optional (buttons exist)
- [ ] No hover-only functionality
- [ ] Text readable without zoom

---

## Browser & Device Support

### Desktop
- ✅ Chrome 90+ (primary target)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Mobile
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+
- ✅ Samsung Internet 14+

### Screen Sizes
- ✅ Mobile: 375px - 640px (iPhone SE to large phones)
- ✅ Tablet: 640px - 1024px (iPad, Android tablets)
- ✅ Desktop: 1024px+ (laptops, monitors)

---

## Resources & References

### GTD Methodology
- David Allen - "Getting Things Done" book
- GTD Connect (official GTD community)
- GTD Weekly Review process

### Design Systems
- Tailwind CSS v3 documentation
- Radix UI (accessible primitives)
- Figma Variables (design tokens)

### Accessibility
- WCAG 2.1 Guidelines (W3C)
- WebAIM Contrast Checker
- NVDA Screen Reader (Windows)
- VoiceOver Screen Reader (macOS/iOS)

### Performance
- Lighthouse (Chrome DevTools)
- Web Vitals (Google)
- RxDB Performance Guide

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-13 | Initial design specification |

---

## Contact & Feedback

For questions about this design:
- Review the specific document for detailed info
- Check [implementation-guide.md](./implementation-guide.md) for code examples
- Refer to [wireframes.md](./wireframes.md) for visual reference

---

**Next Steps:**

1. **Review all documents** in this directory
2. **Import design tokens** into your build ([design-tokens.css](./design-tokens.css))
3. **Follow implementation guide** phase by phase ([implementation-guide.md](./implementation-guide.md))
4. **Test accessibility** at every step
5. **Measure performance** against budgets

---

*This design emphasizes user-centered, accessible, and GTD-compliant task management with minimal friction and maximum clarity.*
