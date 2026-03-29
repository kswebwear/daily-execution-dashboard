# Daily Execution Dashboard

A personal productivity dashboard for daily task execution and accountability. Dark-mode, theme-rich, mobile-native.

**Live:** https://ded-app-lemon.vercel.app
**Repo:** https://github.com/kswebwear/daily-execution-dashboard

---

## Features

### Core

- Create, edit, delete, and archive tasks
- Drag-and-drop reordering (desktop)
- Swipe gestures for completion and quick actions (mobile)
- Daily carry-forward: incomplete tasks auto-reset to pending each day
- Daily notes per task with date-stamped history
- Completion history tracking across all days
- Priority system (high / medium / low) with automatic sorting
- Recurring daily tasks with auto-creation of next-day instances
- Manual task ordering via drag-and-drop

### Productivity Tools

- **Focus Mode** — full-screen view showing top 3 pending tasks
- **Pomodoro Timer** — 25/5 timer with session logging per task
- **Execution Playbook** — 6 built-in techniques (5 Min Rule, Kaizen, Eat The Frog, MIT, Time Boxing, Ikigai)
- **Weekly Insight** — local deterministic summary of completion patterns
- **Analytics Panel** — 7-day rate, streak, tag distribution, 30-day heatmap
- **Weekly Streak** — circular progress indicators (Mon-Sun) with daily commitment goals
- **Command Palette** — keyboard-driven navigation and actions (Cmd+K / Ctrl+K)

### Themes

Four visual themes, cycled via toggle button:

1. **Minimal** — clean dark mode
2. **Cyber** — neon cyberpunk with animated gradient
3. **JARVIS** — holographic HUD with particles and grid
4. **Aurora** — glass morphism with animated gradient blobs

All themes use CSS variables. Theme loads before hydration (no flash).

### Mobile

- Tab navigation (Pending | Completed | History) replaces Kanban
- Fixed bottom navigation bar
- Floating action button for task creation
- Fullscreen overlays for notes
- Touch-optimized card sizes and tap targets

### Cloud (V2.0+)

- Firebase Authentication (Google Sign-In)
- Firestore with offline persistence
- Works without login (localStorage fallback)
- Migration modal on first login

---

## Getting Started

```bash
git clone https://github.com/kswebwear/daily-execution-dashboard
cd daily-execution-dashboard
npm install
npm run dev
```

Open http://localhost:3000.

### Environment Variables

For cloud features, create `ded-app/.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Without these, the app works in localStorage-only mode.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| Auth | Firebase Authentication (Google) |
| Database | Cloud Firestore (offline persistence) |
| Deployment | Vercel (auto-deploy on push to main) |
| Timezone | Australia/Sydney (AEDT/AEST) |

---

## Project Structure

```
app/
  layout.tsx            Root layout, theme providers, anti-flicker script
  page.tsx              Main dashboard page with header
  globals.css           Tailwind base + all theme CSS
  archive/page.tsx      Archive view
  history/page.tsx      History view (desktop)
components/
  TaskBoard.tsx         Main orchestrator: DnD, state, persistence
  TaskColumn.tsx        Droppable column (pending / completed)
  TaskCard.tsx          Draggable card with swipe gestures
  AddTaskForm.tsx       Inline task creation form
  TaskModal.tsx         Task detail modal with notes editor
  WeeklyStreak.tsx      Weekly progress rings with commitment
  CommitmentPrompt.tsx  Daily commitment input
  AnalyticsPanel.tsx    Stats, heatmap, tag distribution
  PomodoroTimer.tsx     Focus timer with session logging
  PlaybookPanel.tsx     Productivity techniques
  InsightModal.tsx      Weekly insight summary
  FocusModeView.tsx     Full-screen focus overlay
  HistoryView.tsx       Completion history grouped by date
  CommandPalette.tsx    Keyboard command palette (Cmd+K)
  MobileBottomNav.tsx   Mobile tab navigation
  LiveClock.tsx         Real-time Sydney clock
  ThemeToggle.tsx       Theme cycle button
  AuthButton.tsx        Sign in / sign out
context/
  ThemeContext.tsx       Theme state, focus mode, cycle logic
  AuthContext.tsx        Firebase auth state
  PomodoroContext.tsx    Global timer state machine
lib/
  types.ts              Task and PomodoroSession types
  storage.ts            localStorage helpers
  commitment.ts         Daily commitment persistence
  carryForward.ts       New-day reset logic
  firestore.ts          Firestore CRUD + commitment storage
  firebase.ts           Firebase app initialization
  theme.ts              Tag color hashing, theme utilities
  useIsMobile.ts        matchMedia hook for responsive behavior
```

---

## Data Model

```ts
type Task = {
  id: string
  title: string
  tag: string
  createdAt: string                   // YYYY-MM-DD
  status: "pending" | "completed"
  dailyNotes: { date: string; text: string }[]
  completionHistory: { date: string; note?: string }[]
  archived?: boolean
  updatedAt?: string
  priority?: "low" | "medium" | "high"
  isRecurringDaily?: boolean
  pomodoroSessions?: PomodoroSession[]
  orderIndex?: number
}
```

All fields after `completionHistory` are optional for backward compatibility.

---

## How It Works

### Daily Carry-Forward

On each new day (midnight Sydney time), all completed tasks reset to pending. Completion history is preserved. Pending tasks carry forward unchanged.

### Weekly Streak

Seven circular progress rings (Mon-Sun) using CSS `conic-gradient`. Progress = `completedTasks / dailyCommitment`. Users set their daily commitment goal; past days without a commitment fallback to 5.

### Storage Strategy

- **Logged out:** localStorage (`execution_dashboard_tasks`)
- **Logged in:** Firestore (`users/{uid}/tasks/`) with real-time subscription
- **Commitments:** localStorage (`ded_daily_commitments`) or Firestore (`users/{uid}/meta/dailyCommitments`)

---

## Deployment

Connected to Vercel. Any push to `main` auto-deploys:

```bash
git push origin main
```

---

## Version History

| Version | Scope |
|---------|-------|
| V2.7.2 | Streak Panel Polish |
| V2.7.1 | Daily Commitment System |
| V2.7 | Weekly Streak Visualization |
| V2.6 | Command Palette (Cmd+K) |
| V2.5 | Aurora Theme & Dashboard Depth |
| V2.4.2 | Manual Ordering + History Notes |
| V2.4.1 | Notes UX Improvements |
| V2.4 | Mobile Native UX Layer |
| V2.3 | Pomodoro, Playbook, Insight |
| V2.2 | Priority, Recurring, Analytics, Focus Mode |
| V2.1.1 | JARVIS Theme |
| V2.1 | Cyberpunk Theme |
| V2.0 | Firebase Cloud Foundation |
| V1 | Core task board (localStorage) |

See [DED-V2+.md](./DED-V2+.md) for the full product specification and roadmap.
