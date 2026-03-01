import { Task } from "./types"
import { getLastActiveDate, setLastActiveDate } from "./storage"

export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date())
}

/**
 * On app load: if today != lastActiveDate, reset all completed tasks back to
 * pending (preserving their completionHistory). Pending tasks stay pending.
 */
export function applyCarryForward(tasks: Task[]): Task[] {
  const todayStr = today()
  const lastActive = getLastActiveDate()

  setLastActiveDate(todayStr)

  if (!lastActive || lastActive === todayStr) {
    return tasks
  }

  // New day — reset completed tasks back to pending
  return tasks.map((task) => {
    if (task.status === "completed") {
      return { ...task, status: "pending" }
    }
    return task
  })
}
