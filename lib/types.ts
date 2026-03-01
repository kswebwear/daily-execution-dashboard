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
}
