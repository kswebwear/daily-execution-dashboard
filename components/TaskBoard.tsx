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
import TaskColumn from "./TaskColumn"
import TaskModal from "./TaskModal"
import AddTaskForm from "./AddTaskForm"

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [modalTask, setModalTask] = useState<Task | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount, apply carry-forward
  useEffect(() => {
    const loaded = loadTasks()
    const carried = applyCarryForward(loaded)
    setTasks(carried)
    if (loaded !== carried) saveTasks(carried)
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  )

  function persist(updated: Task[]) {
    setTasks(updated)
    saveTasks(updated)
  }

  function handleAdd(task: Task) {
    persist([...tasks, task])
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

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Dropped over a column droppable
    const isOverColumn = overId === "pending" || overId === "completed"
    if (isOverColumn && activeTask.status !== overId) {
      const todayStr = today()
      const updated = tasks.map((t) => {
        if (t.id !== activeId) return t
        if (overId === "completed") {
          return {
            ...t,
            status: "completed" as const,
            completionHistory: [...t.completionHistory, { date: todayStr }],
          }
        }
        return { ...t, status: "pending" as const }
      })
      persist(updated)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    const overTask = tasks.find((t) => t.id === overId)
    if (!activeTask) return

    // If dropped over another task in the same column — reorder
    if (overTask && activeTask.status === overTask.status) {
      const sameColumn = tasks.filter((t) => t.status === activeTask.status)
      const otherColumn = tasks.filter((t) => t.status !== activeTask.status)
      const oldIndex = sameColumn.findIndex((t) => t.id === activeId)
      const newIndex = sameColumn.findIndex((t) => t.id === overId)
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(sameColumn, oldIndex, newIndex)
        persist(
          activeTask.status === "pending"
            ? [...reordered, ...otherColumn]
            : [...otherColumn, ...reordered]
        )
      }
      return
    }

    // If dropped over a column header — already handled in dragOver
    const isOverColumn = overId === "pending" || overId === "completed"
    if (isOverColumn) {
      const todayStr = today()
      const alreadyUpdated = tasks.find((t) => t.id === activeId)
      if (alreadyUpdated?.status !== overId) {
        const updated = tasks.map((t) => {
          if (t.id !== activeId) return t
          if (overId === "completed") {
            return {
              ...t,
              status: "completed" as const,
              completionHistory: [...t.completionHistory, { date: todayStr }],
            }
          }
          return { ...t, status: "pending" as const }
        })
        persist(updated)
      }
    }
  }

  function handleSaveNote(taskId: string, noteText: string) {
    const todayStr = today()
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
      return { ...t, dailyNotes: notes }
    })
    persist(updated)
    // Update modal task if open
    const refreshed = updated.find((t) => t.id === taskId)
    if (refreshed) setModalTask(refreshed)
  }

  if (!mounted) return null

  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  return (
    <>
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
        />
      )}
    </>
  )
}
