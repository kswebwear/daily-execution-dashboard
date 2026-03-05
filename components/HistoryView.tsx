"use client"

import { useMemo, useState } from "react"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"

type HistoryEntry = { task: Task; date: string }
type DateGroup = { label: string; date: string; entries: HistoryEntry[] }

const INITIAL_GROUPS = 30

function yesterday(todayStr: string): string {
  const d = new Date(todayStr + "T00:00:00")
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function buildDateGroups(tasks: Task[], todayStr: string): DateGroup[] {
  const yest = yesterday(todayStr)
  const entries: HistoryEntry[] = []
  for (const task of tasks) {
    if (task.archived) continue
    for (const h of task.completionHistory) {
      entries.push({ task, date: h.date })
    }
  }
  const map = new Map<string, HistoryEntry[]>()
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date)!.push(e)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, entries]) => ({
      date,
      label: date === todayStr ? "Today" : date === yest ? "Yesterday" : date,
      entries,
    }))
}

function HistoryCard({ task }: { task: Task }) {
  return (
    <div className="history-card">
      <p className="text-sm text-zinc-300 leading-snug break-words">{task.title}</p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {task.tag && (
          <span className="text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">
            {task.tag}
          </span>
        )}
        {task.isRecurringDaily && (
          <span className="text-xs text-zinc-700" title="Recurring">⟳</span>
        )}
        {(task.priority ?? "medium") !== "medium" && (
          <span className={`text-xs ${task.priority === "high" ? "text-red-500/60" : "text-zinc-600"}`}>
            {task.priority === "high" ? "↑ high" : "↓ low"}
          </span>
        )}
      </div>
    </div>
  )
}

type Props = {
  tasks: Task[]
  onClose?: () => void
}

export default function HistoryView({ tasks, onClose }: Props) {
  const todayStr = today()
  const [visibleCount, setVisibleCount] = useState(INITIAL_GROUPS)

  const groups = useMemo(() => buildDateGroups(tasks, todayStr), [tasks, todayStr])
  const visible = groups.slice(0, visibleCount)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-600 uppercase tracking-widest">Completion History</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-zinc-600 italic">No completions yet.</p>
      ) : (
        <>
          {visible.map((group) => (
            <div key={group.date}>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.entries.map((entry, i) => (
                  <HistoryCard key={`${entry.task.id}-${entry.date}-${i}`} task={entry.task} />
                ))}
              </div>
            </div>
          ))}

          {visibleCount < groups.length && (
            <button
              onClick={() => setVisibleCount((v) => v + INITIAL_GROUPS)}
              className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
            >
              Show older
            </button>
          )}
        </>
      )}
    </div>
  )
}
