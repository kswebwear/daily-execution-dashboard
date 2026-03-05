# Daily Execution Dashboard

**Product Specification — V2+**

This document defines the long-term architecture, feature roadmap, and guardrails for the Daily Execution Dashboard.

---

## Version Roadmap

| Version | Scope | Status |
|---------|-------|--------|
| V2.0 | Cloud Foundation | Completed |
| V2.1 | Cyberpunk Theme | Completed |
| V2.1.1 | JARVIS Theme | Completed |
| V2.2 | Productivity Expansion | Completed |
| V2.3 | Cognitive Productivity Layer | Completed |
| V2.4 | Mobile Native UX Layer | Completed |
| V2.4.1 | Notes UX Improvements | Completed |
| V2.5 | AI Productivity Layer | Planned |

---

## Architectural Rules (Do Not Violate)

- V1 core task behavior must never change.
- Firestore schema changes must remain backward compatible.
- All new fields must be optional.
- Theme system must remain presentation-only.
- No heavy third-party libraries without strong justification.
- Avoid introducing global state unless necessary.
- Performance must not degrade as features increase.
- Any feature added must include a clear rollback path.
- Analytics must compute client-side from already-fetched data.
- No destructive migration of Firestore documents.

---

## Data Migration Policy

When new fields are added:

- Must be optional.
- Existing tasks must continue working unchanged.

Default values:

```
isRecurringDaily = false
priority = "medium"
```

Rules:

- No forced rewriting of existing documents.
- No background batch rewriting.
- No breaking schema changes.

---

## Performance Guardrails

- No heavy chart libraries (Chart.js, Recharts, etc.).
- Heatmap must be custom lightweight grid.
- Avoid unnecessary re-renders.
- Avoid expensive Firestore reads.
- No polling.
- Memoize analytics calculations.
- Avoid animation-heavy libraries.

---

## Theme System Contract

Theme behavior must follow strict rules.

- Theme controlled via single theme state.
- CSS variables drive all theme differences.
- No inline conditional styling chaos.

Adding a new theme requires:

- Only new CSS variable definitions.
- Minimal component logic changes.

Persistence:

```
localStorage key: ded_theme
```

Theme must load before hydration to prevent UI flicker.

---

## V2.0 – Cloud Foundation [COMPLETED]

Core platform migration.

**Features:**

- Firebase Authentication (Google Sign-In)
- Firestore with offline persistence
- Edit tasks
- Delete tasks
- Archive page (`/archive` route)
- Migration modal on first login if local tasks exist

---

## V2.1 – Experience Upgrade [COMPLETED]

Cyberpunk visual theme.

**Features:**

- `html.cyber` theme class
- Theme toggle persisted in `localStorage`
- Anti-flicker script in `layout.tsx`
- Orbitron font applied to headings
- Deterministic neon tag colors
- Live clock showing Sydney time
- CSS animations only (no Framer Motion)

---

## V2.1.1 – JARVIS Theme [COMPLETED]

A third visual theme inspired by Stark-style holographic HUD interfaces.

### Design Philosophy

- Cyan holographic interface
- Clean futuristic visuals
- Controlled glow effects
- High readability

### Visual Requirements

#### Background

- Deep navy gradient
- Radial glow center
- Optional faint grid

#### Panels

- Semi-transparent dark panels
- Thin cyan borders
- Soft inner glow

#### Typography

- Clean futuristic font
- Slight letter spacing

#### Header HUD

- Tech divider lines
- Section caps
- Subtle animated accent bar

#### Clock Enhancement

- 24h format
- Milliseconds
- Date + timezone

### Constraints

- Must reuse existing theme architecture.
- No Firestore changes.
- No performance degradation.

---

## V2.2 – Productivity Expansion [COMPLETED]

Structured productivity intelligence without AI.

### Recurring Tasks (Daily Only)

**Field:**

```ts
isRecurringDaily?: boolean
```

**Behavior:**

If enabled and task is completed:

- Auto-create next-day instance.
- Prevent duplicate instances.
- Preserve full completion history.

**Scope limitations:**

- No weekly recurrence.
- No custom schedules.

### Priority System

**Field:**

```ts
priority?: "low" | "medium" | "high"
```

**Default:** `"medium"`

Task sorting order:

1. Priority (high → low)
2. Created date

### Basic Analytics Panel

Toggleable analytics panel including:

- Completion rate (7 days)
- Current streak
- Tag distribution bars
- 30-day heatmap grid

**Constraints:** No heavy chart libraries.

### Focus Mode

Purpose: reduce cognitive load.

**Features:**

- Enter Focus Mode button
- Shows only top 3 pending tasks
- Full-screen layout
- ESC exits focus mode

Pomodoro not included here.

---

## V2.3 – Cognitive Productivity Layer [COMPLETED]

Enhances execution discipline.

### Pomodoro Timer

**Features:**

- 25 / 5 preset
- Custom focus duration optional
- Start / Pause / Reset
- Works inside Focus Mode
- Session logs stored per task

No notifications. No background workers.

### Execution Playbook Panel

Built-in productivity techniques.

**Techniques:**

- 5 Minute Rule
- Kaizen
- Eat The Frog
- MIT
- Time Boxing
- Ikigai Alignment Prompt

Each technique contains:

- Explanation
- When to use
- Apply-to-task button

No AI dependency.

### Weekly Insight (Local Deterministic Summary)

Insight generated locally using existing task data.

**Displays:**

- Most completed task
- Most skipped task
- 7-day completion rate
- Top tag
- Total Pomodoro sessions
- Average focus duration

No AI API calls.

---

## V2.4 – Mobile Native UX Layer [PLANNED]

Goal: Make the mobile experience behave like a native iPhone productivity app.

Desktop experience remains unchanged.

### Mobile Layout

When screen width < 768px, replace Kanban layout with tab navigation.

**Tabs:**

- Pending
- Completed
- Insights

Only one list visible at a time.

### Bottom Navigation

Mobile must use a fixed bottom navigation bar.

**Layout:**

```
Pending | Completed | Insights
```

Navigation switches views without page reload.

### Mobile Task Interaction

Dragging across long vertical lists is not mobile-friendly.

**Primary completion method:** Tap completion button

**Optional gesture support:**

- Swipe right → Complete task
- Swipe left → Edit / Archive / Delete

Must reuse existing task logic.

### Floating Add Task Button

Add mobile floating action button.

**Position:** Bottom-right corner

Tap opens task creation modal.

### Task Card Mobile Improvements

- Minimum height: 60px
- Larger tap targets
- Increased spacing
- Smooth completion animation

### Focus Mode Mobile Compatibility

Focus Mode must:

- Display active task clearly
- Allow completion
- Show Pomodoro timer prominently
- Hide non-essential panels

### Constraints

- Desktop layout must remain unchanged.
- No Firestore schema changes.
- No heavy gesture libraries.
- Maintain theme compatibility.
- Maintain performance guardrails.

---

## V2.4 – Mobile Native UX Layer [COMPLETED]

Goal: Make the mobile experience behave like a native iPhone productivity app.

Desktop experience remains unchanged.

### Mobile Layout

When screen width < 768px, replace Kanban layout with tab navigation.

**Tabs:**

- Pending
- Completed
- History (replaced Insights tab; Insight modal accessible via top-bar button)

Only one list visible at a time.

### Bottom Navigation

Mobile must use a fixed bottom navigation bar.

**Layout:**

```
Pending | Completed | History
```

Navigation switches views without page reload.

### Mobile Task Interaction

**Primary completion method:** Tap completion button

**Gesture support:**

- Swipe right → Complete task
- Swipe left → Edit / Archive / Delete

### Floating Add Task Button

Bottom-right corner. Tap opens task creation modal.

### Task Card Mobile Improvements

- Minimum height: 60px
- Larger tap targets
- Smooth completion animation

### Focus Mode Mobile Compatibility

Focus Mode hides nav and FAB when active.

### History View

- `/history` route (desktop) and "History" tab (mobile bottom nav)
- Completion history grouped by date (Today / Yesterday / date string)
- Derived client-side from existing `completionHistory[]` field
- No Firestore schema changes
- Pagination: 30 date-groups default, expandable in 30-group increments

### Constraints

- Desktop layout unchanged
- No Firestore schema changes
- No heavy gesture libraries
- Theme compatible

---

## V2.4.1 – Notes UX Improvements [COMPLETED]

Enhanced notes editing and reading experience inside `TaskModal`.

### Auto-Expanding Textarea (Desktop)

- Textarea grows vertically as user types
- Range: 80px minimum → 300px maximum
- Beyond 300px: vertical scrollbar appears inside the textarea
- Implementation: `resizeNote()` sets `el.style.height` to `scrollHeight` clamped to range; called via `useEffect` on `noteText` change
- No scroll during normal typing; `overflow-y: hidden` below max, `auto` above

### Expand / Collapse Notes (Daily Notes History)

- Each historical note shows a 4-line collapsed preview (`max-height: 5.5rem`)
- "Expand notes" / "Collapse" toggle per note entry
- Animation: `max-height` CSS transition (0.25s ease) between `5.5rem` and `600px`
- Toggle only shown when note qualifies: length > 200 chars OR > 3 newlines
- State: `Set<number>` of expanded indices — no re-renders of other entries

### Mobile Fullscreen Notes Modal

- On mobile (<768px), the notes textarea is replaced by a tap-target button
- Tapping opens a `z-[60]` fixed fullscreen overlay (above task modal at `z-50`)
- Overlay: task title header + full scrollable textarea + single "Save note" footer
- Auto-expand also applies inside the mobile overlay textarea
- Closing with "Done" without saving discards unsaved changes; "Save note" persists

### No Schema or Firestore Changes

- Reuses existing `dailyNotes[]` field on Task
- No new fields added

---

## V2.5 – AI Productivity Layer [PLANNED]

Future AI-assisted productivity.

**Possible features:**

- AI weekly insight generation
- Pattern analysis
- Smart task recommendations
- Natural language task creation
- Voice task input
- Conversational task clarification
