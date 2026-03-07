"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/context/ThemeContext"
import { Task } from "@/lib/types"

type Command = {
  id: string
  label: string
  action: () => void
}

type Props = {
  tasks: Task[]
  onAddTask: () => void
  onOpenFocusMode: () => void
  onTaskClick: (task: Task) => void
}

export default function CommandPalette({ tasks, onAddTask, onOpenFocusMode, onTaskClick }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const [mode, setMode] = useState<"commands" | "tasks">("commands")
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { cycleTheme } = useTheme()

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
    setMode("commands")
    setSelected(0)
  }, [])

  const commands: Command[] = [
    {
      id: "add",
      label: "Add Task",
      action: () => { close(); onAddTask() },
    },
    {
      id: "search",
      label: "Search Tasks",
      action: () => { setMode("tasks"); setQuery(""); setSelected(0) },
    },
    {
      id: "focus",
      label: "Open Focus Mode",
      action: () => { close(); onOpenFocusMode() },
    },
    {
      id: "history",
      label: "Open History",
      action: () => { close(); router.push("/history") },
    },
    {
      id: "archive",
      label: "Open Archive",
      action: () => { close(); router.push("/archive") },
    },
    {
      id: "theme",
      label: "Switch Theme",
      action: () => { cycleTheme(); close() },
    },
  ]

  const pendingTasks = tasks.filter((t) => t.status === "pending" && !(t.archived ?? false))

  const filteredCommands = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  const filteredTasks = mode === "tasks"
    ? (query
        ? pendingTasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
        : pendingTasks)
    : []

  const items = mode === "commands" ? filteredCommands : filteredTasks

  // ── Global keyboard shortcut ────────────────────────────────────────────────
  useEffect(() => {
    function onGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => {
          if (v) return false
          setQuery("")
          setMode("commands")
          setSelected(0)
          return true
        })
      }
    }
    window.addEventListener("keydown", onGlobalKey)
    return () => window.removeEventListener("keydown", onGlobalKey)
  }, [])

  // ── Focus input on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      // rAF ensures the element is visible before focusing
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // ── Scroll selected item into view ──────────────────────────────────────────
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selected}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selected])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close()
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, items.length - 1))
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    }
    if (e.key === "Enter") {
      e.preventDefault()
      executeItem(selected)
    }
    // Backspace on empty query in task-search mode → go back to commands
    if (e.key === "Backspace" && query === "" && mode === "tasks") {
      setMode("commands")
      setSelected(0)
    }
  }

  function executeItem(index: number) {
    if (mode === "commands") {
      const cmd = filteredCommands[index]
      if (cmd) cmd.action()
    } else {
      const task = filteredTasks[index]
      if (task) { close(); onTaskClick(task) }
    }
  }

  if (!open) return null

  return (
    <div className="cmd-backdrop" onClick={close} role="presentation">
      <div
        className="cmd-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* ── Input row ───────────────────────────────────────────────────────── */}
        <div className="cmd-header">
          {mode === "tasks" && <span className="cmd-mode-badge">Tasks</span>}
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder={mode === "commands" ? "Type a command…" : "Search tasks…"}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd-kbd">esc</kbd>
        </div>

        {/* ── Results list ────────────────────────────────────────────────────── */}
        <div className="cmd-list" ref={listRef} role="listbox">
          {items.length === 0 ? (
            <div className="cmd-empty">No results</div>
          ) : mode === "commands" ? (
            (items as Command[]).map((cmd, i) => (
              <button
                key={cmd.id}
                data-index={i}
                className={`cmd-item${i === selected ? " cmd-item-selected" : ""}`}
                role="option"
                aria-selected={i === selected}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelected(i)}
              >
                <span className="cmd-item-label">{cmd.label}</span>
              </button>
            ))
          ) : (
            (items as Task[]).map((task, i) => (
              <button
                key={task.id}
                data-index={i}
                className={`cmd-item${i === selected ? " cmd-item-selected" : ""}`}
                role="option"
                aria-selected={i === selected}
                onClick={() => { close(); onTaskClick(task) }}
                onMouseEnter={() => setSelected(i)}
              >
                <span className="cmd-item-label">{task.title}</span>
                {task.tag && <span className="cmd-task-tag">{task.tag}</span>}
                {(task.priority === "high") && (
                  <span className="cmd-priority-high">high</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* ── Footer hints ────────────────────────────────────────────────────── */}
        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          {mode === "tasks" && <span><kbd>⌫</kbd> back</span>}
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
