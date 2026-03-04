"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Task } from "@/lib/types"
import TaskCard from "./TaskCard"

type Props = {
  id: "pending" | "completed"
  label: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
  footer?: React.ReactNode
  isDropTarget?: boolean
}

export default function TaskColumn({ id, label, tasks, onTaskClick, footer, isDropTarget }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const highlighted = isOver || (isDropTarget ?? false)

  return (
    <div className="flex flex-col gap-3">
      {/* Column header */}
      <div className="flex items-center justify-between">
        <h2 className="task-column-header text-xs text-zinc-500 uppercase tracking-widest font-medium">
          {label}
        </h2>
        <span className="text-xs text-zinc-700 tabular-nums">{tasks.length}</span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        data-over={highlighted ? "true" : "false"}
        className={`task-drop-zone flex flex-col gap-2 min-h-[200px] rounded-xl p-2 pb-8 transition-all duration-150 ${
          highlighted ? "bg-zinc-800/60 ring-1 ring-zinc-600" : "bg-transparent"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="task-empty-placeholder flex items-center justify-center h-20 text-zinc-700 text-xs border border-dashed border-zinc-800 rounded-lg">
            {id === "pending" ? "No pending tasks" : "Nothing completed yet"}
          </div>
        )}
      </div>

      {footer && <div>{footer}</div>}
    </div>
  )
}
