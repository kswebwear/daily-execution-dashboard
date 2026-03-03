"use client"

import { useState } from "react"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"

type EditUpdates = {
  title: string
  tag: string
  priority: "low" | "medium" | "high"
  isRecurringDaily: boolean
}

type Props = {
  task: Task
  onClose: () => void
  onSaveNote: (taskId: string, note: string) => void
  onEdit?: (taskId: string, updates: EditUpdates) => void
  onArchive?: (taskId: string) => void
}

const PRIORITY_LABELS: Record<string, string> = { high: "High", medium: "Medium", low: "Low" }
const PRIORITY_CYCLE: Array<"low" | "medium" | "high"> = ["low", "medium", "high"]

export default function TaskModal({ task, onClose, onSaveNote, onEdit, onArchive }: Props) {
  const todayStr = today()
  const existingNote = task.dailyNotes.find((n) => n.date === todayStr)?.text ?? ""
  const [noteText, setNoteText] = useState(existingNote)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editTag, setEditTag] = useState(task.tag)
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">(task.priority ?? "medium")
  const [editRecurring, setEditRecurring] = useState(task.isRecurringDaily ?? false)

  const allNotes = [...task.dailyNotes].sort((a, b) => b.date.localeCompare(a.date))
  const allHistory = [...task.completionHistory].sort((a, b) => b.date.localeCompare(a.date))

  function handleSave() {
    onSaveNote(task.id, noteText)
    onClose()
  }

  function handleSaveEdit() {
    const trimmed = editTitle.trim()
    if (!trimmed) return
    if (onEdit) onEdit(task.id, { title: trimmed, tag: editTag.trim(), priority: editPriority, isRecurringDaily: editRecurring })
    setEditing(false)
  }

  function cyclePriority() {
    const idx = PRIORITY_CYCLE.indexOf(editPriority)
    setEditPriority(PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length])
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="cyber-panel bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800 cyber-panel-divider">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2 pr-2">
                <input
                  autoFocus
                  value={editTitle}
                  maxLength={200}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-zinc-100 text-sm outline-none focus:border-zinc-400"
                />
                <input
                  value={editTag}
                  maxLength={50}
                  onChange={(e) => setEditTag(e.target.value)}
                  placeholder="Tag (optional)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-400 text-xs outline-none focus:border-zinc-500 placeholder-zinc-600"
                />
                {/* Priority & recurring row */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={cyclePriority}
                    className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-2 py-1 rounded transition-colors"
                    title="Cycle priority"
                  >
                    Priority: {PRIORITY_LABELS[editPriority]}
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editRecurring}
                      onChange={(e) => setEditRecurring(e.target.checked)}
                      className="accent-current"
                    />
                    Recurring daily
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditTitle(task.title)
                      setEditTag(task.tag)
                      setEditPriority(task.priority ?? "medium")
                      setEditRecurring(task.isRecurringDaily ?? false)
                      setEditing(false)
                    }}
                    className="px-3 py-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-zinc-100 font-medium text-base">{task.title}</h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {task.tag && (
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                      {task.tag}
                    </span>
                  )}
                  <span className="text-xs text-zinc-600">Created {task.createdAt}</span>
                  {(task.priority ?? "medium") !== "medium" && (
                    <span className="text-xs text-zinc-600">
                      {task.priority === "high" ? "↑ High priority" : "↓ Low priority"}
                    </span>
                  )}
                  {task.isRecurringDaily && (
                    <span className="text-xs text-zinc-600">⟳ Recurring</span>
                  )}
                </div>
              </>
            )}
          </div>

          {!editing && (
            <div className="flex items-center gap-1 ml-4 shrink-0">
              {onEdit && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded transition-colors"
                >
                  Edit
                </button>
              )}
              {onArchive && (
                <button
                  onClick={() => onArchive(task.id)}
                  className="text-xs text-zinc-600 hover:text-red-500 px-2 py-1 rounded transition-colors"
                >
                  Archive
                </button>
              )}
              <button
                onClick={onClose}
                className="text-zinc-600 hover:text-zinc-300 text-xl leading-none px-1"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Today's note */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">
              Note for today
            </label>
            <textarea
              value={noteText}
              maxLength={2000}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note for today..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none focus:border-zinc-500 transition-colors"
            />
            <button
              onClick={handleSave}
              className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
            >
              Save note
            </button>
          </div>

          {/* Completion history */}
          {allHistory.length > 0 && (
            <div>
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                Completion history
              </h3>
              <div className="space-y-2">
                {allHistory.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xs text-zinc-600 pt-0.5 shrink-0 font-mono">
                      {entry.date}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {entry.note || <span className="text-zinc-600 italic">Completed</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily notes history */}
          {allNotes.length > 0 && (
            <div>
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                Daily notes
              </h3>
              <div className="space-y-2">
                {allNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xs text-zinc-600 pt-0.5 shrink-0 font-mono">
                      {note.date}
                    </span>
                    <span className="text-sm text-zinc-400">{note.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allHistory.length === 0 && allNotes.length === 0 && (
            <p className="text-sm text-zinc-600 italic">No history yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
