"use client"

import { useMemo, useState } from "react"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"
import { CommitmentMap, getCommitment } from "@/lib/commitment"
import CommitmentPrompt from "./CommitmentPrompt"

type Props = {
  tasks: Task[]
  commitments: CommitmentMap
  onSetCommitment: (date: string, value: number) => void
}

function getWeekDays(): { label: string; date: string; isToday: boolean }[] {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" })
  const dayFmt = new Intl.DateTimeFormat("en-AU", { weekday: "short", timeZone: "Australia/Sydney" })
  const todayStr = today()

  const now = new Date()
  const sydneyDay = new Date(
    now.toLocaleString("en-US", { timeZone: "Australia/Sydney" })
  )
  const dayOfWeek = sydneyDay.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(sydneyDay)
  monday.setDate(sydneyDay.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const days: { label: string; date: string; isToday: boolean }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = fmt.format(d)
    days.push({
      label: dayFmt.format(d),
      date: dateStr,
      isToday: dateStr === todayStr,
    })
  }
  return days
}

export default function WeeklyStreak({ tasks, commitments, onSetCommitment }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const todayStr = today()

  const activeTasks = useMemo(() => tasks.filter((t) => !(t.archived ?? false)), [tasks])
  const weekDays = useMemo(() => getWeekDays(), [])

  const completionsPerDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const task of activeTasks) {
      for (const h of task.completionHistory) {
        map[h.date] = (map[h.date] ?? 0) + 1
      }
    }
    return map
  }, [activeTasks])

  const todayHasCommitment = commitments[todayStr] !== undefined

  const dayData = useMemo(() => {
    return weekDays.map((day) => {
      const completed = completionsPerDay[day.date] ?? 0
      const hasCommitment = commitments[day.date] !== undefined
      const commitment = getCommitment(commitments, day.date)
      const progress = (day.isToday && !hasCommitment)
        ? 0
        : Math.min(completed / commitment, 1)
      return { ...day, completed, commitment, progress, hasCommitment }
    })
  }, [weekDays, completionsPerDay, commitments])

  const todayData = dayData.find((d) => d.isToday)
  const todayCompleted = todayData?.completed ?? 0
  const todayProgress = todayData?.progress ?? 0

  function handleDayClick(date: string) {
    setExpandedDay((prev) => (prev === date ? null : date))
  }

  function conicStyle(progress: number) {
    const deg = Math.round(progress * 360)
    const fillColor = progress >= 1
      ? "var(--streak-full, #22c55e)"
      : "var(--streak-partial, #818cf8)"
    const trackColor = "var(--streak-track, rgba(63, 63, 70, 0.5))"
    return {
      background: `conic-gradient(${fillColor} ${deg}deg, ${trackColor} ${deg}deg)`,
    }
  }

  return (
    <div className="weekly-streak streak-panel mb-6 rounded-xl p-4 md:p-5">
      {/* Day rings — full width */}
      <div className="flex items-center justify-between">
        {dayData.map((day) => (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1.5 relative flex-1"
          >
            <span className={`text-[10px] md:text-xs uppercase tracking-wider font-medium ${
              day.isToday ? "streak-label-today" : "text-zinc-500"
            }`}>
              {day.label}
            </span>

            <button
              onClick={() => handleDayClick(day.date)}
              className={`streak-ring relative flex items-center justify-center rounded-full transition-all duration-200 ${
                day.isToday ? "streak-today" : ""
              }`}
              style={conicStyle(day.progress)}
              title={`${day.date}: ${day.completed}/${day.commitment}`}
            >
              <span className="streak-ring-inner absolute rounded-full" />
              <span className="relative z-10 text-[10px] md:text-xs font-semibold tabular-nums streak-ring-text">
                {day.isToday && !day.hasCommitment ? "?" : day.completed > 0 ? day.completed : ""}
              </span>
            </button>

            {expandedDay === day.date && (
              <div className="streak-tooltip absolute top-full mt-2 z-30 px-3 py-2 rounded-lg text-xs whitespace-nowrap left-1/2 -translate-x-1/2">
                <p className="font-medium streak-tooltip-date">{day.date}</p>
                <p className="mt-0.5">
                  <span className="streak-tooltip-count">{day.completed}</span> / {day.commitment} completed
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Today's progress bar */}
      {todayHasCommitment && (
        <div className="mt-4">
          <div className="streak-progress-track h-1.5 rounded-full overflow-hidden">
            <div
              className="streak-progress-fill h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(todayProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer: progress label + commitment editor */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {todayHasCommitment && (
            <span className="text-xs text-zinc-500 tabular-nums">
              {todayCompleted} / {commitments[todayStr]} tasks
            </span>
          )}
          <CommitmentPrompt
            currentValue={commitments[todayStr]}
            onSet={(v) => onSetCommitment(todayStr, v)}
          />
        </div>
        {todayHasCommitment && (
          <span className="text-xs text-zinc-600 tabular-nums">
            {Math.round(todayProgress * 100)}%
          </span>
        )}
      </div>
    </div>
  )
}
