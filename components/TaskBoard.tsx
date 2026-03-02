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
import TaskColumn from "./TaskColumn"
import TaskModal from "./TaskModal"
import AddTaskForm from "./AddTaskForm"
import MigrationModal from "./MigrationModal"
import AnalyticsPanel from "./AnalyticsPanel"

// ── Priority sort weight ──────────────────────────────────────────────────────
const P_WEIGHT: Record<string, number> = { high: 0, medium: 1, low: 2 }

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pa = P_WEIGHT[a.priority ?? "medium"]
    const pb = P_WEIGHT[b.priority ?? "medium"]
    if (pa !== pb) return pa - pb
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
  // Only create if no pending recurring copy already exists
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
}: {
  tasks: Task[]
  onExit: () => void
  onTaskClick: (t: Task) => void
}) {
  const { theme } = useTheme()
  const isJarvis = theme === "jarvis"

  return (
    <div className="focus-overlay">
      {/* Exit + title bar */}
      <div className="relative z-10 w-full max-w-lg mb-8 flex items-center justify-between">
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

      <p className="relative z-10 mt-10 text-xs text-zinc-700 tracking-widest uppercase">
        ESC to exit
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TaskBoard() {
  const { user } = useAuth()
  const { focusMode, toggleFocusMode } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [modalTask, setModalTask] = useState<Task | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showMigration, setShowMigration] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  )

  function persist(updated: Task[]) {
    setTasks(updated)
    if (!user) saveTasks(updated)
  }

  function handleAdd(task: Task) {
    const now = new Date().toISOString()
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

  // ── Recurring helper — called after a task is confirmed completed ──────────
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
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeTaskItem = tasks.find((t) => t.id === activeId)
    if (!activeTaskItem) return

    const isOverColumn = overId === "pending" || overId === "completed"
    if (isOverColumn && activeTaskItem.status !== overId) {
      const todayStr = today()
      const updatedAt = new Date().toISOString()
      let updated = tasks.map((t) => {
        if (t.id !== activeId) return t
        if (overId === "completed") {
          return {
            ...t,
            status: "completed" as const,
            completionHistory: [...t.completionHistory, { date: todayStr }],
            updatedAt,
          }
        }
        return { ...t, status: "pending" as const, updatedAt }
      })

      if (overId === "completed") {
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
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTaskItem = tasks.find((t) => t.id === activeId)
    const overTask = tasks.find((t) => t.id === overId)
    if (!activeTaskItem) return

    // Same-column reorder
    if (overTask && activeTaskItem.status === overTask.status) {
      const sameColumn = tasks.filter((t) => t.status === activeTaskItem.status)
      const otherColumn = tasks.filter((t) => t.status !== activeTaskItem.status)
      const oldIndex = sameColumn.findIndex((t) => t.id === activeId)
      const newIndex = sameColumn.findIndex((t) => t.id === overId)
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(sameColumn, oldIndex, newIndex)
        const all =
          activeTaskItem.status === "pending"
            ? [...reordered, ...otherColumn]
            : [...otherColumn, ...reordered]
        setTasks(all)
        if (!user) saveTasks(all)
      }
      return
    }

    // Cross-column drop — handle if dragOver didn't already
    const isOverColumn = overId === "pending" || overId === "completed"
    if (isOverColumn && activeTaskItem.status !== overId) {
      const todayStr = today()
      const updatedAt = new Date().toISOString()
      let updated = tasks.map((t) => {
        if (t.id !== activeId) return t
        if (overId === "completed") {
          return {
            ...t,
            status: "completed" as const,
            completionHistory: [...t.completionHistory, { date: todayStr }],
            updatedAt,
          }
        }
        return { ...t, status: "pending" as const, updatedAt }
      })

      if (overId === "completed") {
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

  if (!mounted) return null

  const activeTasks = tasks.filter((t) => !(t.archived ?? false))
  const pendingTasks = sortByPriority(activeTasks.filter((t) => t.status === "pending"))
  const completedTasks = activeTasks.filter((t) => t.status === "completed")

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
        />
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFocusMode}
            className="cyber-outline-btn text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors"
          >
            {focusMode ? "Exit focus" : "Focus mode"}
          </button>
          <button
            onClick={() => setShowAnalytics((v) => !v)}
            className="cyber-outline-btn text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors"
          >
            {showAnalytics ? "Hide analytics" : "Analytics"}
          </button>
        </div>
        <span className="text-xs text-zinc-700 tabular-nums">
          {pendingTasks.length} pending · {completedTasks.length} done
        </span>
      </div>

      {/* Analytics panel */}
      {showAnalytics && (
        <div className="mb-8">
          <AnalyticsPanel tasks={tasks} onClose={() => setShowAnalytics(false)} />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TaskColumn
            id="pending"
            label="Pending"
            tasks={pendingTasks}
            onTaskClick={setModalTask}
            footer={<AddTaskForm onAdd={handleAdd} />}
          />
          <TaskColumn
            id="completed"
            label="Completed today"
            tasks={completedTasks}
            onTaskClick={setModalTask}
          />
        </div>

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

      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onSaveNote={handleSaveNote}
          onEdit={handleEdit}
          onArchive={handleArchive}
        />
      )}
    </>
  )
}
