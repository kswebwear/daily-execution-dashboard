// V2.3: Pomodoro session log entry
export type PomodoroSession = {
  startedAt: string  // ISO timestamp when focus started
  duration: number   // minutes elapsed (full duration if completed)
  type: "focus"      // only focus sessions are logged
  completed: boolean // false if stopped early
}

export type Task = {
  id: string
  title: string
  tag: string
  createdAt: string // YYYY-MM-DD
  status: "pending" | "completed"
  dailyNotes: {
    date: string // YYYY-MM-DD
    text: string
  }[]
  completionHistory: {
    date: string // YYYY-MM-DD
    note?: string
  }[]
  // V2.0 additions (optional for backward compat with V1 localStorage data)
  archived?: boolean   // soft delete flag; absent = false
  updatedAt?: string   // ISO timestamp of last mutation
  // V2.2 additions (optional for backward compat)
  priority?: "low" | "medium" | "high"  // default = "medium"
  isRecurringDaily?: boolean             // default = false
  // V2.3 additions (optional for backward compat)
  pomodoroSessions?: PomodoroSession[]   // append-only log
}
