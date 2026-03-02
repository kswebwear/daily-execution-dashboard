"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"
import { useTheme } from "@/context/ThemeContext"
import { getNeonTagStyle } from "@/lib/theme"

type Props = {
  task: Task
  onClick: (task: Task) => void
}

export default function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const { theme } = useTheme()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const todayStr = today()
  const todayNote = task.dailyNotes.find((n) => n.date === todayStr)

  const tagStyle = theme === "cyber" && task.tag ? getNeonTagStyle(task.tag) : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-card group border border-zinc-800 rounded-lg p-3 bg-zinc-900 hover:border-zinc-600 transition-colors cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 leading-snug break-words">{task.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.tag && (
              <span
                style={tagStyle}
                className="text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded transition-colors"
              >
                {task.tag}
              </span>
            )}
            {todayNote && (
              <span className="text-xs text-zinc-600 italic truncate max-w-[160px]">
                {todayNote.text}
              </span>
            )}
          </div>
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onClick(task)
          }}
          className="shrink-0 text-zinc-700 hover:text-zinc-400 text-xs px-1.5 py-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          ···
        </button>
      </div>
    </div>
  )
}
