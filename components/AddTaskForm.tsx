"use client"

import { useState } from "react"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"

type Props = {
  onAdd: (task: Task) => void
}

export default function AddTaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState("")
  const [tag, setTag] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [isRecurringDaily, setIsRecurringDaily] = useState(false)
  const [open, setOpen] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    const task: Task = {
      id: crypto.randomUUID(),
      title: trimmed,
      tag: tag.trim(),
      createdAt: today(),
      status: "pending",
      dailyNotes: [],
      completionHistory: [],
      priority,
      isRecurringDaily,
    }
    onAdd(task)
    setTitle("")
    setTag("")
    setPriority("medium")
    setIsRecurringDaily(false)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="add-task-btn w-full border border-dashed border-zinc-700 rounded-lg py-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors text-sm"
      >
        + Add task
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="add-task-form border border-zinc-700 rounded-lg p-3 space-y-2 bg-zinc-900">
      <input
        autoFocus
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 text-sm outline-none"
      />
      <input
        type="text"
        placeholder="Tag (optional)"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        className="w-full bg-transparent text-zinc-400 placeholder-zinc-600 text-xs outline-none"
      />
      {/* Priority + recurring */}
      <div className="flex items-center gap-3 pt-0.5">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
          className="bg-transparent text-zinc-500 text-xs outline-none cursor-pointer border border-zinc-700 rounded px-1.5 py-0.5"
        >
          <option value="high">↑ High</option>
          <option value="medium">— Medium</option>
          <option value="low">↓ Low</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isRecurringDaily}
            onChange={(e) => setIsRecurringDaily(e.target.checked)}
          />
          ⟳ Recurring
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
