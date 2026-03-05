"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"
import { useIsMobile } from "@/lib/useIsMobile"

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
const NOTE_MIN_H = 80
const NOTE_MAX_H = 300

function needsExpand(text: string): boolean {
  return text.length > 200 || (text.match(/\n/g)?.length ?? 0) > 3
}

export default function TaskModal({ task, onClose, onSaveNote, onEdit, onArchive }: Props) {
  const todayStr = today()
  const isMobile = useIsMobile()

  const existingNote = task.dailyNotes.find((n) => n.date === todayStr)?.text ?? ""
  const [noteText, setNoteText] = useState(existingNote)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editTag, setEditTag] = useState(task.tag)
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">(task.priority ?? "medium")
  const [editRecurring, setEditRecurring] = useState(task.isRecurringDaily ?? false)
  const [showMobileNotes, setShowMobileNotes] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [portalReady, setPortalReady] = useState(false)

  const noteRef = useRef<HTMLTextAreaElement>(null)
  const mobileNoteRef = useRef<HTMLTextAreaElement>(null)

  const allNotes = [...task.dailyNotes].sort((a, b) => b.date.localeCompare(a.date))
  const allHistory = [...task.completionHistory].sort((a, b) => b.date.localeCompare(a.date))

  // ── Auto-expand textarea ──────────────────────────────────────────────────
  const resizeNote = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = `${NOTE_MIN_H}px`
    const clamped = Math.min(Math.max(el.scrollHeight, NOTE_MIN_H), NOTE_MAX_H)
    el.style.height = `${clamped}px`
    el.style.overflowY = el.scrollHeight > NOTE_MAX_H ? "auto" : "hidden"
  }, [])

  useEffect(() => { setPortalReady(true) }, [])

  // Lock body scroll while modal is open; reset horizontal drift on close
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
      window.scrollTo(0, window.scrollY) // reset any horizontal scroll bleed
    }
  }, [])

  useEffect(() => { resizeNote(noteRef.current) }, [noteText, resizeNote])
  useEffect(() => { resizeNote(mobileNoteRef.current) }, [noteText, showMobileNotes, resizeNote])

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

  function toggleNoteExpand(i: number) {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  // ── Mobile fullscreen notes overlay ──────────────────────────────────────
  const MobileNotesOverlay = (
    <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <p className="text-sm font-medium text-zinc-100 truncate flex-1 mr-4">{task.title}</p>
        <button
          onClick={() => setShowMobileNotes(false)}
          className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors shrink-0"
        >
          Done
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <p className="text-xs text-zinc-600 uppercase tracking-wider">Note for today</p>
        <textarea
          ref={mobileNoteRef}
          autoFocus
          value={noteText}
          maxLength={2000}
          onChange={(e) => { setNoteText(e.target.value); resizeNote(mobileNoteRef.current) }}
          placeholder="Add a note for today..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none focus:border-zinc-500 transition-colors"
          style={{ minHeight: NOTE_MIN_H, maxHeight: NOTE_MAX_H }}
        />
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-zinc-800">
        <button
          onClick={() => { onSaveNote(task.id, noteText); setShowMobileNotes(false) }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
        >
          Save note
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile fullscreen notes — rendered in a portal to escape body overflow-x: hidden */}
      {showMobileNotes && portalReady && createPortal(MobileNotesOverlay, document.body)}

      {/* Main modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="cyber-panel bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-x-hidden">
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
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={cyclePriority}
                      className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-2 py-1 rounded transition-colors"
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
          <div className="overflow-y-auto overflow-x-hidden flex-1 p-5 space-y-6">
            {/* Today's note */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">
                Note for today
              </label>

              {/* Mobile: tap-to-edit trigger */}
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setShowMobileNotes(true)}
                  className="w-full text-left bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm min-h-[80px] transition-colors hover:border-zinc-600"
                >
                  {noteText ? (
                    <span className="text-zinc-200 whitespace-pre-wrap break-words block overflow-hidden">{noteText}</span>
                  ) : (
                    <span className="text-zinc-600">Tap to add a note for today…</span>
                  )}
                </button>
              ) : (
                /* Desktop: auto-expanding textarea */
                <textarea
                  ref={noteRef}
                  value={noteText}
                  maxLength={2000}
                  onChange={(e) => { setNoteText(e.target.value); resizeNote(noteRef.current) }}
                  placeholder="Add a note for today..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none focus:border-zinc-500 transition-colors"
                  style={{ minHeight: NOTE_MIN_H, maxHeight: NOTE_MAX_H }}
                />
              )}

              {!isMobile && (
                <button
                  onClick={handleSave}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                >
                  Save note
                </button>
              )}
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

            {/* Daily notes history — with expand/collapse */}
            {allNotes.length > 0 && (
              <div>
                <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                  Daily notes
                </h3>
                <div className="space-y-3">
                  {allNotes.map((note, i) => {
                    const isExpanded = expandedNotes.has(i)
                    const collapsible = needsExpand(note.text)
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xs text-zinc-600 pt-0.5 shrink-0 font-mono">
                          {note.date}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            style={{
                              maxHeight: isExpanded ? "600px" : "5.5rem",
                              overflow: "hidden",
                              transition: "max-height 0.25s ease",
                            }}
                          >
                            <span className="text-sm text-zinc-400 whitespace-pre-wrap break-words block overflow-hidden">
                              {note.text}
                            </span>
                          </div>
                          {collapsible && (
                            <button
                              onClick={() => toggleNoteExpand(i)}
                              className="mt-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                              {isExpanded ? "Collapse" : "Expand notes"}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {allHistory.length === 0 && allNotes.length === 0 && (
              <p className="text-sm text-zinc-600 italic">No history yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
