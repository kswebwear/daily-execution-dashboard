"use client"

import { useRef, useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"
import { useTheme } from "@/context/ThemeContext"
import { getNeonTagStyle } from "@/lib/theme"
import { PomodoroIndicator } from "./PomodoroTimer"

type Props = {
  task: Task
  onClick: (task: Task) => void
  onComplete?: (taskId: string) => void
  onArchive?: (taskId: string) => void
  onDelete?: (taskId: string) => void
}

export default function TaskCard({ task, onClick, onComplete, onArchive, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const { theme } = useTheme()
  const isJarvis = theme === "jarvis"

  const [completing, setCompleting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const todayStr = today()
  const todayNote = task.dailyNotes.find((n) => n.date === todayStr)
  const priority = task.priority ?? "medium"

  const tagStyle = theme === "cyber" && task.tag ? getNeonTagStyle(task.tag) : {}
  const priorityStripClass = isJarvis ? `priority-${priority}` : ""

  function triggerComplete() {
    if (!onComplete || completing || task.status === "completed") return
    setCompleting(true)
    setTimeout(() => onComplete(task.id), 280)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (isDragging || touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    touchStartX.current = null
    touchStartY.current = null
    // Ignore vertical scrolls or too-short swipes
    if (dy > Math.abs(dx) * 0.9 || Math.abs(dx) < 50) return
    if (dx > 50 && task.status === "pending") {
      triggerComplete()
    } else if (dx < -50) {
      setShowActions(true)
    }
  }

  return (
    <div
      className={`task-card-wrapper ${completing ? "task-completing" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Quick actions revealed on swipe-left */}
      {showActions && (
        <div className="task-quick-actions">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setShowActions(false); onClick(task) }}
            className="task-quick-btn task-quick-edit"
          >
            Edit
          </button>
          {onArchive && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowActions(false); onArchive(task.id) }}
              className="task-quick-btn task-quick-archive"
            >
              Archive
            </button>
          )}
          {onDelete && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowActions(false); onDelete(task.id) }}
              className="task-quick-btn task-quick-delete"
            >
              Delete
            </button>
          )}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setShowActions(false) }}
            className="task-quick-btn task-quick-cancel"
          >
            ✕
          </button>
        </div>
      )}

      <div
        ref={setNodeRef}
        style={style}
        className={`task-card group border border-zinc-800 rounded-lg p-3 bg-zinc-900 hover:border-zinc-600 transition-colors cursor-grab active:cursor-grabbing min-h-[60px] ${priorityStripClass}`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2 h-full">
          {/* Completion checkmark — always visible on mobile, hidden on desktop */}
          {task.status === "pending" && onComplete && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); triggerComplete() }}
              className="mobile-complete-btn shrink-0"
              aria-label="Complete task"
            >
              <span className="mobile-complete-icon">✓</span>
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              {/* JARVIS holographic status dot */}
              {isJarvis && (
                <span className={`jarvis-status-dot ${task.status} mt-0.5`} />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 leading-snug break-words">{task.title}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {task.tag && (
                    <span
                      style={isJarvis ? {} : tagStyle}
                      className={`task-tag-badge text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded transition-colors ${isJarvis ? "task-tag-badge" : ""}`}
                    >
                      {task.tag}
                    </span>
                  )}

                  {!isJarvis && priority === "high" && (
                    <span className="text-xs text-red-500/70 font-medium">↑ high</span>
                  )}
                  {!isJarvis && priority === "low" && (
                    <span className="text-xs text-zinc-600">↓ low</span>
                  )}

                  {task.isRecurringDaily && (
                    <span className="text-xs text-zinc-600" title="Recurring daily">⟳</span>
                  )}

                  {todayNote && (
                    <span className="text-xs text-zinc-600 italic truncate max-w-[140px]">
                      {todayNote.text}
                    </span>
                  )}

                  <PomodoroIndicator taskId={task.id} />
                </div>
              </div>
            </div>
          </div>

          {/* Details button — always visible, elevated on hover */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onClick(task)
            }}
            className="task-card-menu-btn shrink-0 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 text-base leading-none px-2 py-1 rounded transition-colors"
            aria-label="Edit task"
            title="Edit task"
          >
            ···
          </button>
        </div>
      </div>
    </div>
  )
}
