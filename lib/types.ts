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
}
