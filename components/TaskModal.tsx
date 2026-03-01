"use client"

import { useState } from "react"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"

type Props = {
  task: Task
  onClose: () => void
  onSaveNote: (taskId: string, note: string) => void
}

export default function TaskModal({ task, onClose, onSaveNote }: Props) {
  const todayStr = today()
  const existingNote = task.dailyNotes.find((n) => n.date === todayStr)?.text ?? ""
  const [noteText, setNoteText] = useState(existingNote)

  const allNotes = [...task.dailyNotes].sort((a, b) => b.date.localeCompare(a.date))
  const allHistory = [...task.completionHistory].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  function handleSave() {
    onSaveNote(task.id, noteText)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-zinc-100 font-medium text-base">{task.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              {task.tag && (
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                  {task.tag}
                </span>
              )}
              <span className="text-xs text-zinc-600">Created {task.createdAt}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 text-xl leading-none ml-4"
          >
            ×
          </button>
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
