"use client"

import { useMemo } from "react"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"

type Props = {
  tasks: Task[]
  onClose: () => void
}

function last30DaysList(): string[] {
  const days: string[] = []
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" })
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(fmt.format(d))
  }
  return days
}

function heatLevel(count: number, max: number): string {
  if (count === 0) return "bg-zinc-800"
  const ratio = count / max
  if (ratio >= 0.75) return "bg-cyan-400"
  if (ratio >= 0.5)  return "bg-cyan-600"
  if (ratio >= 0.25) return "bg-cyan-800"
  return "bg-cyan-900"
}

export default function AnalyticsPanel({ tasks, onClose }: Props) {
  const todayStr = today()
  const activeTasks = useMemo(() => tasks.filter((t) => !(t.archived ?? false)), [tasks])

  const days30 = useMemo(() => last30DaysList(), [])

  // Completions per day from completionHistory
  const completionsPerDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const task of activeTasks) {
      for (const h of task.completionHistory) {
        map[h.date] = (map[h.date] ?? 0) + 1
      }
    }
    return map
  }, [activeTasks])

  // 7-day completion rate: days with ≥1 completion / 7
  const { rate7, completedDays7 } = useMemo(() => {
    const last7 = days30.slice(-7)
    const completedDays7 = last7.filter((d) => (completionsPerDay[d] ?? 0) > 0).length
    return { rate7: Math.round((completedDays7 / 7) * 100), completedDays7 }
  }, [days30, completionsPerDay])

  // Current streak: consecutive days (backwards from yesterday or today) with completions
  const streak = useMemo(() => {
    let count = 0
    const reversed = [...days30].reverse()
    // If today has no completions yet, skip it (streak not broken — day not over)
    const startIdx = (completionsPerDay[todayStr] ?? 0) === 0 ? 1 : 0
    for (let i = startIdx; i < reversed.length; i++) {
      if ((completionsPerDay[reversed[i]] ?? 0) > 0) count++
      else break
    }
    return count
  }, [days30, completionsPerDay, todayStr])

  // Tag distribution
  const tagDist = useMemo(() => {
    const map: Record<string, number> = {}
    for (const task of activeTasks) {
      const key = task.tag || "untagged"
      map[key] = (map[key] ?? 0) + 1
    }
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
    const max = sorted[0]?.[1] ?? 1
    return sorted.map(([tag, count]) => ({ tag, count, pct: Math.round((count / max) * 100) }))
  }, [activeTasks])

  // 30-day heatmap max
  const heatMax = useMemo(
    () => Math.max(1, ...days30.map((d) => completionsPerDay[d] ?? 0)),
    [days30, completionsPerDay]
  )

  return (
    <div className="analytics-panel bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs text-zinc-400 uppercase tracking-widest font-medium">Analytics</h2>
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-300 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-zinc-600 uppercase tracking-wider">7-day rate</p>
          <p className="text-2xl font-semibold text-zinc-100 tabular-nums">{rate7}%</p>
          <p className="text-xs text-zinc-600">{completedDays7} of 7 days active</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-600 uppercase tracking-wider">Current streak</p>
          <p className="text-2xl font-semibold text-zinc-100 tabular-nums">{streak}</p>
          <p className="text-xs text-zinc-600">{streak === 1 ? "day" : "days"} in a row</p>
        </div>
      </div>

      {/* 30-day heatmap */}
      <div>
        <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">30-day activity</p>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
          {days30.map((day) => {
            const count = completionsPerDay[day] ?? 0
            return (
              <div
                key={day}
                title={`${day}: ${count} completion${count !== 1 ? "s" : ""}`}
                className={`h-4 rounded-sm ${heatLevel(count, heatMax)} transition-colors`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-zinc-700">{days30[0]}</span>
          <span className="text-xs text-zinc-700">today</span>
        </div>
      </div>

      {/* Tag distribution */}
      {tagDist.length > 0 && (
        <div>
          <p className="text-xs text-zinc-600 uppercase tracking-wider mb-3">Tag distribution</p>
          <div className="space-y-2">
            {tagDist.map(({ tag, count, pct }) => (
              <div key={tag} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-400">{tag}</span>
                  <span className="text-xs text-zinc-600 tabular-nums">{count}</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
