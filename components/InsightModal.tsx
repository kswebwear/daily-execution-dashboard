"use client"

import { useMemo } from "react"
import type { Task } from "@/lib/types"

type Props = {
  tasks: Task[]
  onClose: () => void
}

type InsightData = {
  weeklyCompletionRate: number
  activeDaysLast7: number
  mostCompletedTask: string | null
  mostSkippedTask: string | null
  topTag: string | null
  totalPomodoroSessions: number
  avgFocusDurationMinutes: number
  summary: string
}

function last7Days(): string[] {
  const days: string[] = []
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" })
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(fmt.format(d))
  }
  return days
}

// Deterministic summary — no AI, no randomness, no network
function buildSummary(data: Omit<InsightData, "summary">): string {
  const parts: string[] = []

  // Completion rate
  if (data.weeklyCompletionRate >= 71) {
    parts.push(
      `Strong week — you executed on ${data.activeDaysLast7} of 7 days (${data.weeklyCompletionRate}% completion rate).`
    )
  } else if (data.weeklyCompletionRate >= 43) {
    parts.push(
      `Moderate week — ${data.activeDaysLast7} of 7 days had completions (${data.weeklyCompletionRate}%).`
    )
  } else if (data.weeklyCompletionRate > 0) {
    parts.push(
      `Tough week — only ${data.activeDaysLast7} of 7 days showed activity (${data.weeklyCompletionRate}%).`
    )
  } else {
    parts.push(`No completions logged this week. Any motion forward counts.`)
  }

  // Most completed task
  if (data.mostCompletedTask) {
    parts.push(
      `"${data.mostCompletedTask}" is your most-executed task — a reliable anchor in your workflow.`
    )
  }

  // Most skipped task
  if (data.mostSkippedTask) {
    parts.push(
      `"${data.mostSkippedTask}" keeps getting pushed. Consider breaking it down or applying the 5 Minute Rule.`
    )
  }

  // Top tag
  if (data.topTag && data.topTag !== "untagged") {
    parts.push(`Most of your energy this week went into ${data.topTag}.`)
  }

  // Pomodoro
  if (data.totalPomodoroSessions === 0) {
    parts.push(`No Pomodoro sessions logged yet — try one today to anchor your focus.`)
  } else if (data.avgFocusDurationMinutes > 0) {
    parts.push(
      `${data.totalPomodoroSessions} focus session${data.totalPomodoroSessions === 1 ? "" : "s"} logged, averaging ${data.avgFocusDurationMinutes} minutes each.`
    )
  } else {
    parts.push(
      `${data.totalPomodoroSessions} focus session${data.totalPomodoroSessions === 1 ? "" : "s"} logged.`
    )
  }

  return parts.join(" ")
}

function computeInsight(tasks: Task[]): InsightData {
  const active = tasks.filter((t) => !(t.archived ?? false))
  const days7 = last7Days()

  // 7-day completion rate
  const completionsPerDay: Record<string, number> = {}
  for (const task of active) {
    for (const h of task.completionHistory) {
      completionsPerDay[h.date] = (completionsPerDay[h.date] ?? 0) + 1
    }
  }
  const activeDaysLast7 = days7.filter((d) => (completionsPerDay[d] ?? 0) > 0).length
  const weeklyCompletionRate = Math.round((activeDaysLast7 / 7) * 100)

  // Most completed (by total completionHistory entries)
  const byCompletions = [...active].sort(
    (a, b) => b.completionHistory.length - a.completionHistory.length
  )
  const mostCompletedTask =
    (byCompletions[0]?.completionHistory.length ?? 0) > 0
      ? byCompletions[0].title
      : null

  // Most skipped: oldest pending task
  const mostSkippedTask =
    [...active]
      .filter((t) => t.status === "pending")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]?.title ?? null

  // Top tag by task count
  const tagCount: Record<string, number> = {}
  for (const task of active) {
    const key = task.tag || "untagged"
    tagCount[key] = (tagCount[key] ?? 0) + 1
  }
  const topTag =
    Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Pomodoro stats
  const allSessions = active.flatMap((t) => t.pomodoroSessions ?? [])
  const totalPomodoroSessions = allSessions.length
  const completedSessions = allSessions.filter((s) => s.completed)
  const avgFocusDurationMinutes =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((sum, s) => sum + s.duration, 0) /
            completedSessions.length
        )
      : 0

  const base = {
    weeklyCompletionRate,
    activeDaysLast7,
    mostCompletedTask,
    mostSkippedTask,
    topTag,
    totalPomodoroSessions,
    avgFocusDurationMinutes,
  }

  return { ...base, summary: buildSummary(base) }
}

export default function InsightModal({ tasks, onClose }: Props) {
  // All computation is synchronous and memoised — zero network calls
  const data = useMemo(() => computeInsight(tasks), [tasks])

  return (
    <div className="insight-backdrop" onClick={onClose}>
      <div className="insight-modal cyber-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="insight-header">
          <div>
            <h2 className="insight-title">Weekly Insight</h2>
            <p className="insight-subtitle">Local · computed from your data</p>
          </div>
          <button className="insight-close" onClick={onClose}>×</button>
        </div>

        {/* Stats grid */}
        <div className="insight-stats-grid">
          <StatCell label="7-day rate" value={`${data.weeklyCompletionRate}%`} />
          <StatCell label="Active days" value={`${data.activeDaysLast7} / 7`} />
          <StatCell label="Pomodoro sessions" value={String(data.totalPomodoroSessions)} />
          <StatCell
            label="Avg focus"
            value={data.avgFocusDurationMinutes > 0 ? `${data.avgFocusDurationMinutes}m` : "—"}
          />
          {data.mostCompletedTask && (
            <StatCell label="Most completed" value={data.mostCompletedTask} wide />
          )}
          {data.topTag && (
            <StatCell label="Top tag" value={data.topTag} />
          )}
          {data.mostSkippedTask && (
            <StatCell label="Needs attention" value={data.mostSkippedTask} wide />
          )}
        </div>

        {/* Deterministic summary paragraph */}
        <div className="insight-result">
          <p className="insight-result-text">{data.summary}</p>
        </div>
      </div>
    </div>
  )
}

function StatCell({
  label,
  value,
  wide,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={`insight-stat-cell ${wide ? "insight-stat-wide" : ""}`}>
      <span className="insight-stat-label">{label}</span>
      <span className="insight-stat-value">{value}</span>
    </div>
  )
}
