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

export default function TaskBoard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [modalTask, setModalTask] = useState<Task | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showMigration, setShowMigration] = useState(false)

  // Load tasks — from Firestore when logged in, localStorage when logged out
  useEffect(() => {
    if (!user) {
      const loaded = loadTasks()
      const carried = applyCarryForward(loaded)
      setTasks(carried)
      if (loaded !== carried) saveTasks(carried)
      setMounted(true)
      return
    }

    // Check if migration modal should appear
    const migrationKey = `ded_migrated_${user.uid}`
    if (localStorage.getItem(migrationKey) == null) {
      const localTasks = loadTasks()
      if (localTasks.length > 0) {
        setShowMigration(true)
      } else {
        localStorage.setItem(migrationKey, "done")
      }
    }

    // Subscribe to Firestore
    let firstLoad = true
    const unsub = subscribeToTasks(user.uid, (allTasks) => {
      if (firstLoad) {
        firstLoad = false
        const active = allTasks.filter((t) => !(t.archived ?? false))
        const carried = applyCarryForward(active)
        const archived = allTasks.filter((t) => t.archived ?? false)

        // Write carry-forward changes back to Firestore
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

  // persist — writes to localStorage only when logged out
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

  function handleEdit(taskId: string, updates: { title: string; tag: string }) {
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
      const updated = tasks.map((t) => {
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

    // Same-column reorder — local only, not synced to Firestore
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

    // Cross-column drop — already handled in dragOver for the most part
    const isOverColumn = overId === "pending" || overId === "completed"
    if (isOverColumn) {
      const todayStr = today()
      const alreadyUpdated = tasks.find((t) => t.id === activeId)
      if (alreadyUpdated?.status !== overId) {
        const updatedAt = new Date().toISOString()
        const updated = tasks.map((t) => {
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
  }

  if (!mounted) return null

  const activeTasks = tasks.filter((t) => !(t.archived ?? false))
  const pendingTasks = activeTasks.filter((t) => t.status === "pending")
  const completedTasks = activeTasks.filter((t) => t.status === "completed")

  return (
    <>
      {showMigration && (
        <MigrationModal onConfirm={handleMigrate} onSkip={handleSkipMigration} />
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
            <div className="border border-blue-500/50 rounded-lg p-3 bg-zinc-900 shadow-xl opacity-90">
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
