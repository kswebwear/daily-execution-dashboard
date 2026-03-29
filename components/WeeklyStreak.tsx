"use client"

import { useMemo, useState } from "react"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"

type Props = {
  tasks: Task[]
}

// Daily commitment: minimum tasks to consider a day "fully complete"
const DAILY_COMMITMENT = 3

function getWeekDays(): { label: string; date: string; isToday: boolean }[] {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" })
  const dayFmt = new Intl.DateTimeFormat("en-AU", { weekday: "short", timeZone: "Australia/Sydney" })
  const todayStr = today()

  // Find Monday of the current week
  const now = new Date()
  const sydneyDay = new Date(
    now.toLocaleString("en-US", { timeZone: "Australia/Sydney" })
  )
  const dayOfWeek = sydneyDay.getDay() // 0=Sun
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

export default function WeeklyStreak({ tasks }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const activeTasks = useMemo(() => tasks.filter((t) => !(t.archived ?? false)), [tasks])

  const weekDays = useMemo(() => getWeekDays(), [])

  // Build completions-per-day map from completionHistory
  const completionsPerDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const task of activeTasks) {
      for (const h of task.completionHistory) {
        map[h.date] = (map[h.date] ?? 0) + 1
      }
    }
    return map
  }, [activeTasks])

  // Build pending-per-day: count tasks that were pending on each day
  // For simplicity, we use commitment as the denominator
  const dayData = useMemo(() => {
    return weekDays.map((day) => {
      const completed = completionsPerDay[day.date] ?? 0
      const commitment = DAILY_COMMITMENT
      const progress = Math.min(completed / commitment, 1)
      return { ...day, completed, commitment, progress }
    })
  }, [weekDays, completionsPerDay])

  function handleDayClick(date: string) {
    setExpandedDay((prev) => (prev === date ? null : date))
  }

  // Conic gradient: filled portion uses accent color, remainder is transparent/muted
  function conicStyle(progress: number, isToday: boolean) {
    const deg = Math.round(progress * 360)
    // The color is determined by CSS custom properties per theme
    // We use a CSS class approach but inline the conic-gradient
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

            {/* Circular progress ring */}
            <button
              onClick={() => handleDayClick(day.date)}
              className={`streak-ring relative flex items-center justify-center rounded-full transition-all duration-200 ${
                day.isToday ? "streak-today" : ""
              }`}
              style={conicStyle(day.progress, day.isToday)}
              title={`${day.date}: ${day.completed}/${day.commitment}`}
            >
              {/* Inner circle cutout */}
              <span className="streak-ring-inner absolute rounded-full" />
              {/* Center label */}
              <span className="relative z-10 text-[10px] md:text-xs font-semibold tabular-nums streak-ring-text">
                {day.completed > 0 ? day.completed : ""}
              </span>
            </button>

            {/* Expanded tooltip on click */}
            {expandedDay === day.date && (
              <div className="streak-tooltip absolute top-full mt-2 z-30 px-3 py-2 rounded-lg text-xs whitespace-nowrap">
                <p className="font-medium streak-tooltip-date">{day.date}</p>
                <p className="mt-0.5">
                  <span className="streak-tooltip-count">{day.completed}</span> completed
                </p>
                <p className="opacity-60">Goal: {day.commitment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
