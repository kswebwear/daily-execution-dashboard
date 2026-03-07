"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Task } from "@/lib/types"
import { loadTasks, saveTasks } from "@/lib/storage"
import { applyCarryForward, today } from "@/lib/carryForward"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import {
  subscribeToTasks,
  addTask,
  updateTask,
  permanentDeleteTask as _permanentDeleteTask,
  migrateTasks,
} from "@/lib/firestore"
import { useIsMobile } from "@/lib/useIsMobile"
import TaskColumn from "./TaskColumn"
import TaskModal from "./TaskModal"
import AddTaskForm from "./AddTaskForm"
import MigrationModal from "./MigrationModal"
import AnalyticsPanel from "./AnalyticsPanel"
import PomodoroTimer from "./PomodoroTimer"
import PlaybookPanel from "./PlaybookPanel"
import InsightModal from "./InsightModal"
import HistoryView from "./HistoryView"
import MobileBottomNav, { MobileTab } from "./MobileBottomNav"
import CommandPalette from "./CommandPalette"
import { usePomodoro } from "@/context/PomodoroContext"

// ── Pending task sort ─────────────────────────────────────────────────────────
// Priority is ALWAYS the primary sort key.
// Within the same priority group, orderIndex (set by drag) is the tiebreaker.
// Tasks without orderIndex (newly added) fall after dragged tasks of the same
// priority, then sort by createdAt.
const P_WEIGHT: Record<string, number> = { high: 0, medium: 1, low: 2 }

function sortPendingTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. Priority always wins across groups
    const pa = P_WEIGHT[a.priority ?? "medium"]
    const pb = P_WEIGHT[b.priority ?? "medium"]
    if (pa !== pb) return pa - pb

    // 2. Within same priority: respect drag order
    const ai = a.orderIndex ?? Infinity
    const bi = b.orderIndex ?? Infinity
    if (ai !== bi) return ai - bi

    // 3. Same priority, same (or both absent) orderIndex: older first
    return a.createdAt.localeCompare(b.createdAt)
  })
}

// ── Tomorrow in Sydney TZ ─────────────────────────────────────────────────────
function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(d)
}

// ── Recurring instance factory ────────────────────────────────────────────────
function createRecurringInstance(source: Task, allTasks: Task[]): Task | null {
  const hasPending = allTasks.some(
    (t) =>
      t.id !== source.id &&
      t.title === source.title &&
      t.isRecurringDaily === true &&
      t.status === "pending" &&
      !(t.archived ?? false)
  )
  if (hasPending) return null

  return {
    id: crypto.randomUUID(),
    title: source.title,
    tag: source.tag,
    createdAt: tomorrow(),
    status: "pending",
    dailyNotes: [],
    completionHistory: [],
    priority: source.priority,
    isRecurringDaily: true,
    archived: false,
    updatedAt: new Date().toISOString(),
  }
}

// ── Focus Mode overlay ────────────────────────────────────────────────────────
function FocusModeView({
  tasks,
  onExit,
  onTaskClick,
  onComplete,
}: {
  tasks: Task[]
  onExit: () => void
  onTaskClick: (t: Task) => void
  onComplete: (taskId: string) => void
}) {
  const { theme } = useTheme()
  const isJarvis = theme === "jarvis"

  const focalTask = tasks[0] ?? null

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "Enter" && focalTask) {
        e.preventDefault()
        onComplete(focalTask.id)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [focalTask, onComplete])

  return (
    <div className="focus-overlay">
      {/* Exit + title bar */}
      <div className="relative z-10 w-full max-w-lg mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-600 uppercase tracking-widest">Focus Mode</p>
          <p className="text-zinc-500 text-sm mt-0.5">{tasks.length} task{tasks.length !== 1 ? "s" : ""} remaining</p>
        </div>
        <button
          onClick={onExit}
          className="text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
        >
          Exit focus
        </button>
      </div>

      {/* Prominent Pomodoro timer when a task exists */}
      {focalTask && (
        <div className="relative z-10 w-full max-w-lg mb-4">
          <PomodoroTimer task={focalTask} compact />
        </div>
      )}

      {/* Complete Task button */}
      {focalTask && (
        <div className="relative z-10 w-full max-w-lg mb-6">
          <button
            onClick={() => onComplete(focalTask.id)}
            className="focus-complete-btn w-full py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Complete Task
            <span className="ml-2 text-xs opacity-40 hidden sm:inline">Shift+Enter</span>
          </button>
          <p className="mt-1.5 text-center text-xs text-zinc-600">
            Marks <span className="text-zinc-500 font-medium">&ldquo;{focalTask.title}&rdquo;</span> as done
          </p>
        </div>
      )}

      {/* Task cards */}
      <div className="relative z-10 w-full max-w-lg space-y-3">
        {tasks.length === 0 ? (
          <p className="text-center text-zinc-600 text-sm">All clear — nothing pending.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={`focus-task-card border border-zinc-800 rounded-xl p-4 bg-zinc-900 cursor-pointer hover:border-zinc-600 transition-colors ${isJarvis ? "focus-task-card" : ""}`}
            >
              <div className="flex items-start gap-3">
                {isJarvis && (
                  <span className={`jarvis-status-dot ${task.status} mt-1`} />
                )}
                <div>
                  <p className="text-zinc-100 text-base font-medium">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.tag && (
                      <span className="text-xs text-zinc-600">{task.tag}</span>
                    )}
                    {task.isRecurringDaily && (
                      <span className="text-xs text-zinc-700">⟳</span>
                    )}
                    {(task.priority ?? "medium") === "high" && (
                      <span className="text-xs text-red-500/60">↑ high</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TaskBoard() {
  const { user } = useAuth()
  const { focusMode, toggleFocusMode } = useTheme()
  const { state: pomoState, stop: pomoStop } = usePomodoro()
  const isMobile = useIsMobile()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<"pending" | "completed" | null>(null)
  const [modalTask, setModalTask] = useState<Task | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showMigration, setShowMigration] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showPlaybook, setShowPlaybook] = useState(false)
  const [showInsight, setShowInsight] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>("pending")
  const [showMobileAdd, setShowMobileAdd] = useState(false)

  // Load tasks — Firestore when logged in, localStorage otherwise
  useEffect(() => {
    if (!user) {
      const loaded = loadTasks()
      const carried = applyCarryForward(loaded)
      setTasks(carried)
      if (loaded !== carried) saveTasks(carried)
      setMounted(true)
      return
    }

    const migrationKey = `ded_migrated_${user.uid}`
    if (localStorage.getItem(migrationKey) == null) {
      const localTasks = loadTasks()
      if (localTasks.length > 0) {
        setShowMigration(true)
      } else {
        localStorage.setItem(migrationKey, "done")
      }
    }

    let firstLoad = true
    const unsub = subscribeToTasks(user.uid, (allTasks) => {
      if (firstLoad) {
        firstLoad = false
        const active = allTasks.filter((t) => !(t.archived ?? false))
        const carried = applyCarryForward(active)
        const archived = allTasks.filter((t) => t.archived ?? false)

        carried.forEach((task, i) => {
          if (task.status !== active[i]?.status) {
            updateTask(user.uid, task.id, {
              status: task.status,
              updatedAt: new Date().toISOString(),
            })
          }
        })

        setTasks([...carried, ...archived])
      } else {
        setTasks(allTasks)
      }
      setMounted(true)
    })

    return () => unsub()
  }, [user])

  // On mobile: effectively disable both sensors — tap-to-complete and swipe
  // gestures handle all interactions. This prevents iOS PointerSensor from
  // treating scroll as a drag and distorting the card list.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isMobile ? { distance: 999999 } : { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: isMobile
        ? { delay: 999999, tolerance: 0 }
        : { delay: 200, tolerance: 8 },
    })
  )

  function persist(updated: Task[]) {
    setTasks(updated)
    if (!user) saveTasks(updated)
  }

  function handleAdd(task: Task) {
    const now = new Date().toISOString()
    // Never pre-assign orderIndex. New tasks slot into priority sort automatically.
    // If manual ordering is active, sortPendingTasks merges them by priority.
    // orderIndex is only assigned by drag-and-drop (handleDragEnd).
    const full: Task = { ...task, archived: false, updatedAt: now }
    persist([...tasks, full])
    if (user) addTask(user.uid, full)
  }

  function handleSaveNote(taskId: string, noteText: string) {
    const todayStr = today()
    const updatedAt = new Date().toISOString()
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t
      const existing = t.dailyNotes.findIndex((n) => n.date === todayStr)
      let notes = [...t.dailyNotes]
      if (noteText.trim() === "") {
        notes = notes.filter((n) => n.date !== todayStr)
      } else if (existing >= 0) {
        notes[existing] = { date: todayStr, text: noteText }
      } else {
        notes.push({ date: todayStr, text: noteText })
      }
      return { ...t, dailyNotes: notes, updatedAt }
    })
    persist(updated)
    if (user) {
      const changed = updated.find((t) => t.id === taskId)!
      updateTask(user.uid, taskId, { dailyNotes: changed.dailyNotes, updatedAt })
    }
    const refreshed = updated.find((t) => t.id === taskId)
    if (refreshed) setModalTask(refreshed)
  }

  function handleEdit(
    taskId: string,
    updates: { title: string; tag: string; priority: "low" | "medium" | "high"; isRecurringDaily: boolean }
  ) {
    const updatedAt = new Date().toISOString()
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt } : t))
    persist(updated)
    if (user) updateTask(user.uid, taskId, { ...updates, updatedAt })
    const refreshed = updated.find((t) => t.id === taskId)
    if (refreshed) setModalTask(refreshed)
  }

  function handleArchive(taskId: string) {
    const updatedAt = new Date().toISOString()
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, archived: true, updatedAt } : t))
    persist(updated)
    if (user) updateTask(user.uid, taskId, { archived: true, updatedAt })
    setModalTask(null)
  }

  function handleDelete(taskId: string) {
    const updated = tasks.filter((t) => t.id !== taskId)
    persist(updated)
    if (user) _permanentDeleteTask(user.uid, taskId)
  }

  function handleApplyTechnique(
    taskId: string,
    note: string,
    priority?: "low" | "medium" | "high"
  ) {
    const todayStr = today()
    const updatedAt = new Date().toISOString()
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t
      const existing = t.dailyNotes.findIndex((n) => n.date === todayStr)
      const notes = [...t.dailyNotes]
      const newText = existing >= 0
        ? `${notes[existing].text}\n${note}`
        : note
      if (existing >= 0) {
        notes[existing] = { date: todayStr, text: newText }
      } else {
        notes.push({ date: todayStr, text: newText })
      }
      const newPriority = priority ?? t.priority
      return { ...t, dailyNotes: notes, priority: newPriority, updatedAt }
    })
    persist(updated)
    if (user) {
      const changed = updated.find((t) => t.id === taskId)!
      updateTask(user.uid, taskId, {
        dailyNotes: changed.dailyNotes,
        priority: changed.priority,
        updatedAt,
      })
    }
  }

  async function handleMigrate() {
    if (!user) return
    const localTasks = loadTasks()
    await migrateTasks(user.uid, localTasks)
    localStorage.setItem(`ded_migrated_${user.uid}`, "done")
    setShowMigration(false)
  }

  function handleSkipMigration() {
    if (!user) return
    localStorage.setItem(`ded_migrated_${user.uid}`, "skipped")
    setShowMigration(false)
  }

  function handleCompleteTask(taskId: string) {
    const todayStr = today()
    const updatedAt = new Date().toISOString()
    let updated = tasks.map((t) => {
      if (t.id !== taskId) return t
      return {
        ...t,
        status: "completed" as const,
        completionHistory: [...t.completionHistory, { date: todayStr }],
        updatedAt,
      }
    })
    updated = maybeAddRecurring(taskId, updated)
    persist(updated)
    if (user) {
      const changed = updated.find((t) => t.id === taskId)!
      updateTask(user.uid, taskId, {
        status: changed.status,
        completionHistory: changed.completionHistory,
        updatedAt,
      })
    }
    if (pomoState.taskId === taskId && pomoState.phase !== "idle") {
      pomoStop()
    }
    const remaining = updated.filter((t) => t.status === "pending" && !(t.archived ?? false))
    if (remaining.length === 0 && focusMode) toggleFocusMode()
  }

  function maybeAddRecurring(completedId: string, currentTasks: Task[]): Task[] {
    const completedTask = currentTasks.find((t) => t.id === completedId)
    if (!completedTask?.isRecurringDaily) return currentTasks
    const instance = createRecurringInstance(completedTask, currentTasks)
    if (!instance) return currentTasks
    if (user) addTask(user.uid, instance)
    return [...currentTasks, instance]
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
    setDragOverColumn(null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) {
      setDragOverColumn(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    let targetColumn: "pending" | "completed" | null = null
    if (overId === "pending" || overId === "completed") {
      targetColumn = overId
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) targetColumn = overTask.status as "pending" | "completed"
    }
    setDragOverColumn(targetColumn)

    const activeTaskItem = tasks.find((t) => t.id === activeId)
    if (!activeTaskItem) return

    if (targetColumn && activeTaskItem.status !== targetColumn) {
      const todayStr = today()
      const updatedAt = new Date().toISOString()
      let updated = tasks.map((t) => {
        if (t.id !== activeId) return t
        if (targetColumn === "completed") {
          return {
            ...t,
            status: "completed" as const,
            completionHistory: [...t.completionHistory, { date: todayStr }],
            updatedAt,
          }
        }
        return { ...t, status: "pending" as const, updatedAt }
      })

      if (targetColumn === "completed") {
        updated = maybeAddRecurring(activeId, updated)
      }

      persist(updated)
      if (user) {
        const changed = updated.find((t) => t.id === activeId)!
        updateTask(user.uid, activeId, {
          status: changed.status,
          completionHistory: changed.completionHistory,
          updatedAt,
        })
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    setDragOverColumn(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTaskItem = tasks.find((t) => t.id === activeId)
    const overTask = tasks.find((t) => t.id === overId)
    if (!activeTaskItem) return

    if (overTask && activeTaskItem.status === overTask.status) {
      // Use the same sorted visual list that SortableContext sees so indices match
      const todayStr = today()
      const visualList =
        activeTaskItem.status === "pending"
          ? sortPendingTasks(
              tasks.filter(
                (t) => t.status === "pending" && !(t.archived ?? false) && t.createdAt <= todayStr
              )
            )
          : tasks.filter(
              (t) =>
                t.status === "completed" &&
                t.completionHistory.some((h) => h.date === todayStr)
            )

      const oldIndex = visualList.findIndex((t) => t.id === activeId)
      const newIndex = visualList.findIndex((t) => t.id === overId)

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(visualList, oldIndex, newIndex)

        if (activeTaskItem.status === "pending") {
          // Assign sequential orderIndex; only write tasks whose index changed
          const updatedAt = new Date().toISOString()
          const changed: { id: string; orderIndex: number }[] = []
          reordered.forEach((t, i) => {
            if ((t.orderIndex ?? -1) !== i) changed.push({ id: t.id, orderIndex: i })
          })
          const reorderedWithIndex = reordered.map((t, i) => ({ ...t, orderIndex: i, updatedAt }))
          // Merge back: keep tasks not in the visual list unchanged
          const notInList = tasks.filter((t) => !visualList.some((vt) => vt.id === t.id))
          persist([...reorderedWithIndex, ...notInList])
          if (user && changed.length > 0) {
            changed.forEach(({ id, orderIndex }) =>
              updateTask(user.uid, id, { orderIndex, updatedAt })
            )
          }
        } else {
          // Completed tasks: visual reorder in local state only (no orderIndex)
          const notInList = tasks.filter((t) => !visualList.some((vt) => vt.id === t.id))
          const all = [...reordered, ...notInList]
          setTasks(all)
          if (!user) saveTasks(all)
        }
      }
      return
    }
    // Cross-column status changes are fully handled in handleDragOver,
    // so by the time handleDragEnd fires the task is already in the right column.
  }

  if (!mounted) return null

  const activeTasks = tasks.filter((t) => !(t.archived ?? false))
  // Only show pending tasks whose createdAt is today or earlier.
  // Recurring instances get createdAt: tomorrow() so they stay hidden until the next day.
  const todayStr = today()
  const pendingTasks = sortPendingTasks(
    activeTasks.filter((t) => t.status === "pending" && t.createdAt <= todayStr)
  )
  const completedTasks = activeTasks.filter(
    (t) => t.status === "completed" && t.completionHistory.some((h) => h.date === todayStr)
  )

  return (
    <>
      {showMigration && (
        <MigrationModal onConfirm={handleMigrate} onSkip={handleSkipMigration} />
      )}

      {/* Focus Mode full-screen overlay */}
      {focusMode && (
        <FocusModeView
          tasks={pendingTasks.slice(0, 3)}
          onExit={toggleFocusMode}
          onTaskClick={setModalTask}
          onComplete={handleCompleteTask}
        />
      )}

      {/* ── Desktop controls bar (hidden on mobile) ── */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleFocusMode}
            className="cyber-outline-btn text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors"
          >
            {focusMode ? "Exit focus" : "Focus mode"}
          </button>
          <button
            onClick={() => { setShowAnalytics((v) => !v); setShowPlaybook(false) }}
            className="cyber-outline-btn text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors"
          >
            {showAnalytics ? "Hide analytics" : "Analytics"}
          </button>
          <button
            onClick={() => { setShowPlaybook((v) => !v); setShowAnalytics(false) }}
            className="cyber-outline-btn text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors"
          >
            {showPlaybook ? "Hide playbook" : "Playbook"}
          </button>
          <button
            onClick={() => setShowInsight(true)}
            className="cyber-outline-btn text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors"
          >
            Weekly insight
          </button>
        </div>
        <span className="text-xs text-zinc-700 tabular-nums">
          {pendingTasks.length} pending · {completedTasks.length} done
        </span>
      </div>

      {/* ── Mobile controls bar (hidden on desktop) ── */}
      <div className="flex md:hidden items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFocusMode}
            className="cyber-outline-btn text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors"
          >
            Focus
          </button>
          <button
            onClick={() => setShowInsight(true)}
            className="cyber-outline-btn text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors"
          >
            Insight
          </button>
        </div>
        <span className="text-xs text-zinc-700 tabular-nums">
          {pendingTasks.length} pending
        </span>
      </div>

      {/* Analytics panel — desktop only */}
      {showAnalytics && (
        <div className="mb-8 hidden md:block">
          <AnalyticsPanel tasks={tasks} onClose={() => setShowAnalytics(false)} />
        </div>
      )}

      {/* Playbook panel — desktop only */}
      {showPlaybook && (
        <div className="mb-8 hidden md:block">
          <PlaybookPanel
            pendingTasks={pendingTasks}
            onClose={() => setShowPlaybook(false)}
            onApplyTechnique={handleApplyTechnique}
          />
        </div>
      )}

      {/* Weekly Insight modal */}
      {showInsight && (
        <InsightModal tasks={tasks} onClose={() => setShowInsight(false)} />
      )}

      {/* ── Mobile Add Task overlay (FAB triggered) ── */}
      {showMobileAdd && (
        <div
          className="mobile-add-backdrop"
          onClick={() => setShowMobileAdd(false)}
        >
          <div
            className="mobile-add-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <AddTaskForm
              defaultOpen
              onAdd={(task) => { handleAdd(task); setShowMobileAdd(false) }}
              onCancel={() => setShowMobileAdd(false)}
            />
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* ── Desktop: two-column Kanban ── */}
        {!isMobile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TaskColumn
              id="pending"
              label="Pending"
              tasks={pendingTasks}
              onTaskClick={setModalTask}
              onComplete={handleCompleteTask}
              onArchive={handleArchive}
              onDelete={handleDelete}
              footer={<AddTaskForm onAdd={handleAdd} />}
              isDropTarget={dragOverColumn === "pending"}
            />
            <TaskColumn
              id="completed"
              label="Completed today"
              tasks={completedTasks}
              onTaskClick={setModalTask}
              isDropTarget={dragOverColumn === "completed"}
            />
          </div>
        )}

        {/* ── Mobile: tab-based single-column view ── */}
        {isMobile && (
          <div className="mobile-tab-content pb-20">
            {mobileTab === "pending" && (
              <TaskColumn
                id="pending"
                label="Pending"
                tasks={pendingTasks}
                onTaskClick={setModalTask}
                onComplete={handleCompleteTask}
                onArchive={handleArchive}
                onDelete={handleDelete}
                isDropTarget={dragOverColumn === "pending"}
              />
            )}
            {mobileTab === "completed" && (
              <TaskColumn
                id="completed"
                label="Completed today"
                tasks={completedTasks}
                onTaskClick={setModalTask}
                isDropTarget={dragOverColumn === "completed"}
              />
            )}
            {mobileTab === "history" && (
              <div className="mt-2">
                <HistoryView tasks={tasks} onClose={() => setMobileTab("pending")} />
              </div>
            )}
          </div>
        )}

        <DragOverlay>
          {activeTask ? (
            <div className="task-drag-overlay border border-blue-500/50 rounded-lg p-3 bg-zinc-900 shadow-xl opacity-90">
              <p className="text-sm text-zinc-200">{activeTask.title}</p>
              {activeTask.tag && (
                <span className="text-xs text-zinc-600 mt-1 inline-block">{activeTask.tag}</span>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Mobile FAB ── */}
      {isMobile && mobileTab === "pending" && !focusMode && (
        <button
          onClick={() => setShowMobileAdd(true)}
          className="mobile-fab"
          aria-label="Add task"
        >
          +
        </button>
      )}

      {/* ── Mobile Bottom Nav ── */}
      {isMobile && !focusMode && (
        <MobileBottomNav
          activeTab={mobileTab}
          pendingCount={pendingTasks.length}
          completedCount={completedTasks.length}
          onTabChange={setMobileTab}
        />
      )}

      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onSaveNote={handleSaveNote}
          onEdit={handleEdit}
          onArchive={handleArchive}
        />
      )}

      {/* ── Command Palette (⌘K / Ctrl+K) ── */}
      <CommandPalette
        tasks={tasks}
        onAddTask={() => setShowMobileAdd(true)}
        onOpenFocusMode={toggleFocusMode}
        onTaskClick={setModalTask}
      />
    </>
  )
}
