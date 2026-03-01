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
    }
    onAdd(task)
    setTitle("")
    setTag("")
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-dashed border-zinc-700 rounded-lg py-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors text-sm"
      >
        + Add task
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-zinc-700 rounded-lg p-3 space-y-2 bg-zinc-900">
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
