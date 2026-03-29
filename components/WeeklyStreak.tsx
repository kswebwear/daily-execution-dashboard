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
      // Today with no commitment set → show 0 progress (rings empty until user sets goal)
      const progress = (day.isToday && !hasCommitment)
        ? 0
        : Math.min(completed / commitment, 1)
      return { ...day, completed, commitment, progress, hasCommitment }
    })
  }, [weekDays, completionsPerDay, commitments])

  const todayData = dayData.find((d) => d.isToday)
  const todayCompleted = todayData?.completed ?? 0

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
    <div className="weekly-streak mb-6">
      <div className="flex items-center justify-center gap-3 md:gap-5">
        {dayData.map((day) => (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1.5 relative"
          >
            <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider font-medium">
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
              <div className="streak-tooltip absolute top-full mt-2 z-30 px-3 py-2 rounded-lg text-xs whitespace-nowrap">
                <p className="font-medium streak-tooltip-date">{day.date}</p>
                <p className="mt-0.5">
                  <span className="streak-tooltip-count">{day.completed}</span> / {day.commitment} completed
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress label + commitment editor */}
      <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
        {todayHasCommitment && (
          <span className="text-[10px] md:text-xs text-zinc-600 tabular-nums">
            {todayCompleted} / {commitments[todayStr]} tasks completed
          </span>
        )}
        <CommitmentPrompt
          currentValue={commitments[todayStr]}
          onSet={(v) => onSetCommitment(todayStr, v)}
        />
      </div>
    </div>
  )
}
