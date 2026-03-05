"use client"

import { useMemo, useState } from "react"
import { Task } from "@/lib/types"
import { today } from "@/lib/carryForward"
import { useIsMobile } from "@/lib/useIsMobile"

type HistoryEntry = { task: Task; date: string }
type DateGroup = { label: string; date: string; entries: HistoryEntry[] }

const INITIAL_GROUPS = 30

function yesterday(todayStr: string): string {
  const [y, m, d] = todayStr.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

function buildDateGroups(tasks: Task[], todayStr: string): DateGroup[] {
  const yest = yesterday(todayStr)
  const entries: HistoryEntry[] = []
  for (const task of tasks) {
    if (task.archived) continue
    for (const h of task.completionHistory) {
      entries.push({ task, date: h.date })
    }
  }
  const map = new Map<string, HistoryEntry[]>()
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date)!.push(e)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, entries]) => ({
      date,
      label: date === todayStr ? "Today" : date === yest ? "Yesterday" : date,
      entries,
    }))
}

// ── Notes modal (mobile fullscreen) ──────────────────────────────────────────
function NotesModal({
  task,
  onClose,
}: {
  task: Task
  onClose: () => void
}) {
  const notes = task.dailyNotes.filter((n) => n.text.trim())
  return (
    <div
      className="fixed inset-0 z-[70] bg-zinc-950/95 flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex flex-col h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <p className="text-sm font-medium text-zinc-200 truncate flex-1 mr-3">{task.title}</p>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors shrink-0"
          >
            Close
          </button>
        </div>
        {/* Notes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {notes.length === 0 ? (
            <p className="text-sm text-zinc-600 italic">No notes for this task.</p>
          ) : (
            notes
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((n) => (
                <div key={n.date}>
                  <p className="text-xs text-zinc-600 mb-1">{n.date}</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {n.text}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── History card ──────────────────────────────────────────────────────────────
function HistoryCard({ task, date }: { task: Task; date: string }) {
  const isMobile = useIsMobile()
  const [expanded, setExpanded] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const priority = task.priority ?? "medium"
  const notes = task.dailyNotes.filter((n) => n.text.trim())
  const hasNotes = notes.length > 0

  // Show preview of most-recent note (3-line clamp)
  const previewNote = notes.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
  const needsExpand =
    hasNotes &&
    (notes.some((n) => n.text.length > 150 || n.text.includes("\n")) || notes.length > 1)

  function handleExpandClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (isMobile) {
      setShowModal(true)
    } else {
      setExpanded((v) => !v)
    }
  }

  return (
    <>
      {showModal && (
        <NotesModal task={task} onClose={() => setShowModal(false)} />
      )}

      <div className="history-card">
        {/* Title */}
        <p className="text-sm text-zinc-300 leading-snug break-words">{task.title}</p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.tag && (
            <span className="text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">
              {task.tag}
            </span>
          )}
          {task.isRecurringDaily && (
            <span className="text-xs text-zinc-700" title="Recurring">⟳</span>
          )}
          {priority !== "medium" && (
            <span
              className={`text-xs ${
                priority === "high" ? "text-red-500/60" : "text-zinc-600"
              }`}
            >
              {priority === "high" ? "↑ high" : "↓ low"}
            </span>
          )}
          <span className="text-xs text-zinc-700 tabular-nums ml-auto">{date}</span>
        </div>

        {/* Notes preview */}
        {hasNotes && (
          <div className="mt-2">
            {/* 3-line clamped preview of most recent note */}
            {!expanded && previewNote && (
              <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                {previewNote.text}
              </p>
            )}

            {/* Expanded: all notes, all dates */}
            {expanded && !isMobile && (
              <div className="space-y-3 mt-1">
                {notes
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((n) => (
                    <div key={n.date}>
                      <p className="text-xs text-zinc-600 mb-0.5">{n.date}</p>
                      <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                        {n.text}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {/* Expand/collapse control */}
            {needsExpand && (
              <button
                onClick={handleExpandClick}
                className="mt-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {isMobile ? "View notes" : expanded ? "Collapse" : "Expand notes"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
type Props = {
  tasks: Task[]
  onClose?: () => void
}

export default function HistoryView({ tasks, onClose }: Props) {
  const todayStr = today()
  const [visibleCount, setVisibleCount] = useState(INITIAL_GROUPS)

  const groups = useMemo(() => buildDateGroups(tasks, todayStr), [tasks, todayStr])
  const visible = groups.slice(0, visibleCount)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-600 uppercase tracking-widest">Completion History</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-zinc-600 italic">No completions yet.</p>
      ) : (
        <>
          {visible.map((group) => (
            <div key={group.date}>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.entries.map((entry, i) => (
                  <HistoryCard
                    key={`${entry.task.id}-${entry.date}-${i}`}
                    task={entry.task}
                    date={entry.date}
                  />
                ))}
              </div>
            </div>
          ))}

          {visibleCount < groups.length && (
            <button
              onClick={() => setVisibleCount((v) => v + INITIAL_GROUPS)}
              className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
            >
              Show older
            </button>
          )}
        </>
      )}
    </div>
  )
}
