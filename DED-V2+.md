# Daily Execution Dashboard

**Product Specification — V2+**

This document defines the feature roadmap and guardrails for the Daily Execution Dashboard.

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
| V2.4.2 | Manual Ordering + History Notes | Completed |
| V2.5 | Aurora Theme & Dashboard Depth System | Completed |
| V2.6 | Command Palette | Completed |
| V2.7 | Execution Score | Completed |
| V2.7.1 | Daily Commitment | Completed |
| V2.8 | Momentum Mode | Planned |
| V2.9 | Carry Forward Reflection | Planned |
| V3.0 | Idea Capture | Planned |

---

## Architectural Rules

- V1 core task behavior must never change.
- Firestore schema changes must remain backward compatible.
- All new fields must be optional.
- Theme system must remain presentation-only (CSS variables).
- No heavy third-party libraries without strong justification.
- Performance must not degrade as features increase.
- Analytics must compute client-side from already-fetched data.
- No destructive migration of Firestore documents.

---

## Data Migration Policy

- New fields must be optional.
- Existing tasks must continue working unchanged.
- No forced rewriting of existing documents.
- No breaking schema changes.

Default values: `isRecurringDaily = false`, `priority = "medium"`.

---

## Performance Guardrails

- No heavy chart libraries (Chart.js, Recharts, etc.).
- Memoize analytics calculations.
- Avoid unnecessary re-renders and expensive Firestore reads.
- No polling. No animation-heavy libraries.

---

## Theme System Contract

- Theme controlled via single state, persisted in `localStorage` as `ded_theme`.
- CSS variables drive all theme differences.
- Theme must load before hydration (anti-flicker script).
- Adding a new theme requires only new CSS variable definitions.

---

## V2.0 – Cloud Foundation [COMPLETED]

- Firebase Authentication (Google Sign-In)
- Firestore with offline persistence
- Edit and delete tasks
- Archive page (`/archive` route)
- Migration modal on first login if local tasks exist

---

## V2.1 – Cyberpunk Theme [COMPLETED]

- `html.cyber` theme class
- Theme toggle persisted in localStorage
- Anti-flicker script in layout.tsx
- Orbitron font for headings
- Deterministic neon tag colors
- Live clock (Sydney time)
- CSS animations only (no Framer Motion)

---

## V2.1.1 – JARVIS Theme [COMPLETED]

Stark-style holographic HUD theme.

- Cyan holographic interface with controlled glow
- Deep navy gradient with radial glow and faint grid
- Semi-transparent panels with cyan borders
- 24h clock with milliseconds and timezone
- Focus mode dampens particles and grid

---

## V2.2 – Productivity Expansion [COMPLETED]

### Recurring Tasks

- `isRecurringDaily?: boolean` — on completion, auto-creates next-day instance
- Prevents duplicate pending instances

### Priority System

- `priority?: "low" | "medium" | "high"` (default: `"medium"`)
- Pending sort: high > medium > low > createdAt

### Analytics Panel

- 7-day completion rate, current streak, tag distribution bars, 30-day heatmap
- All client-side, no chart libraries

### Manual Task Ordering

- `orderIndex?: number` — set by drag-and-drop only
- Two-mode sort: priority-based (default) vs manual (when any task has orderIndex)
- Sequential `0,1,2...` indices assigned on drag; minimal Firestore writes

### Focus Mode

- Shows top 3 pending tasks full-screen
- ESC exits

---

## V2.3 – Cognitive Productivity Layer [COMPLETED]

### Pomodoro Timer

- 25/5 preset with start/pause/reset
- Works inside Focus Mode
- Session logs stored per task (`pomodoroSessions?: PomodoroSession[]`)

### Execution Playbook Panel

- 6 techniques: 5 Min Rule, Kaizen, Eat The Frog, MIT, Time Boxing, Ikigai
- Apply-to-task writes note + optional priority update

### Weekly Insight

- Local deterministic summary (no AI)
- Shows: most completed/skipped task, 7-day rate, top tag, pomodoro stats

---

## V2.4 – Mobile Native UX Layer [COMPLETED]

- Tab navigation (Pending | Completed | History) replaces Kanban on mobile
- Fixed bottom navigation bar
- Swipe right to complete, swipe left for quick actions
- Floating action button for task creation
- Focus mode hides nav and FAB
- History view: completion history grouped by date, paginated by 30 groups
- Desktop layout unchanged

---

## V2.4.1 – Notes UX Improvements [COMPLETED]

- Auto-expanding textarea (80px–300px) in TaskModal
- Expand/collapse per daily note entry (CSS transition)
- Mobile fullscreen notes overlay (`z-[60]`)

---

## V2.4.2 – Manual Ordering + History Notes [COMPLETED]

- Manual task ordering via drag-and-drop (see V2.2)
- History cards show title, tags, priority, completion date, 3-line notes preview
- Desktop expand/collapse for full notes; mobile fullscreen modal (`z-[70]`)
- History remains read-only

---

## V2.5 – Aurora Theme & Dashboard Depth System [COMPLETED]

### Aurora Theme

- `html.aurora` class; 4-theme cycle: minimal > cyber > jarvis > aurora
- Calm, premium aesthetic for long productivity sessions
- Multi-layer radial gradient background (indigo + sky over dark slate)
- Animated gradient blobs (`blur(48px)`, 32s/38s cycles)

### Glass Panel System

- Panels: `rgba(255,255,255,0.04)` + `blur(12px)` + soft border
- Cards: `rgba(255,255,255,0.08)` + `blur(6px)` + stronger shadow
- Hover elevation gated to `@media (hover:hover) and (pointer:fine)`

### Dashboard Depth Layers

| Layer | Element | Technique |
|-------|---------|-----------|
| 0 | Background | Multi-layer radial gradient, fixed attachment |
| 0.5 | Aurora FX | Animated blobs with blur |
| 1 | Panels | Glass containers |
| 2 | Task cards | Elevated glass cards |
| 3 | FAB / modals | Solid surfaces with glow |

### Priority Sort Update

- Priority always primary sort key
- `orderIndex` secondary within same priority
- New tasks never get orderIndex (drag-only)

---

## V2.6 – Command Palette [COMPLETED]

- Global trigger: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)
- Commands: Add Task, Search Tasks, Open Focus Mode, Open History, Open Archive, Switch Theme
- "Search Tasks" sub-mode with Backspace to return
- Arrow-key navigation + Enter/Escape
- Theme-aware CSS (base + per-theme overrides)
- No external libraries

---

## V2.7 – Execution Score [COMPLETED]

### Weekly Streak Visualization

- Horizontal row of 7 circular progress indicators (Mon–Sun)
- Progress: `completedTasks / dailyCommitment` per day
- States: full circle (goal met), partial circle (in progress), empty (no progress)
- Current day highlighted with border/glow
- CSS `conic-gradient` rendering (no chart libraries)
- Click any day to see date, completions, and commitment
- Supports all themes via CSS custom properties
- Works on mobile and desktop

---

## V2.7.1 – Daily Commitment [COMPLETED]

Required for progress accuracy in Weekly Streak.

### Schema

- `dailyCommitment?: number` — number of tasks user plans to complete for the day

### Rules

- User sets commitment at start of day (default fallback: `5`)
- Progress calculation: `completedTasks / dailyCommitment`
- If commitment is not set: fallback to `5` (not total tasks)
- If `completedTasks > dailyCommitment`: progress capped at 100%

### UX

- Prompt user once per day: "How many tasks can you complete today?"
- Editable anytime from dashboard
- Display: `3 / 6 tasks completed`

---

## V2.8 – Momentum Mode [PLANNED]

- On task completion, suggest next task automatically
- Selection priority: highest priority > next manual order > oldest pending
- Inline suggestion card with "Start Focus" action

---

## V2.9 – Carry Forward Reflection [PLANNED]

- If task carried forward 3+ consecutive days, show reflection prompt
- Options: Too big / Not important / Need help / Break into smaller tasks
- Non-intrusive (does not interrupt focus mode)

---

## V3.0 – Idea Capture [PLANNED]

- Floating "+ Capture Idea" button
- Quick input modal for fast idea entry
- Ideas stored in Idea Vault section for later review
- Must be extremely fast (< 2 seconds to open and save)
