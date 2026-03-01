import { Task } from "./types"

const STORAGE_KEY = "execution_dashboard_tasks"
const LAST_ACTIVE_KEY = "execution_dashboard_last_active"

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function getLastActiveDate(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(LAST_ACTIVE_KEY)
}

export function setLastActiveDate(date: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LAST_ACTIVE_KEY, date)
}
