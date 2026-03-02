"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Task } from "@/lib/types"
import { useAuth } from "@/context/AuthContext"
import { subscribeToTasks, updateTask, permanentDeleteTask } from "@/lib/firestore"
import { loadTasks, saveTasks } from "@/lib/storage"

export default function ArchivePage() {
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      const localTasks = loadTasks()
      setTasks(localTasks.filter((t) => t.archived ?? false))
      setMounted(true)
      return
    }

    const unsub = subscribeToTasks(user.uid, (allTasks) => {
      setTasks(allTasks.filter((t) => t.archived ?? false))
      setMounted(true)
    })
    return () => unsub()
  }, [user, loading])

  function handleRestore(taskId: string) {
    const updatedAt = new Date().toISOString()
    if (user) {
      updateTask(user.uid, taskId, { archived: false, status: "pending", updatedAt })
    } else {
      const all = loadTasks()
      const updated = all.map((t) =>
        t.id === taskId ? { ...t, archived: false, status: "pending" as const, updatedAt } : t
      )
      saveTasks(updated)
      setTasks(updated.filter((t) => t.archived ?? false))
    }
  }

  function handlePermanentDelete(taskId: string) {
    if (user) {
      permanentDeleteTask(user.uid, taskId)
    } else {
      const all = loadTasks()
      saveTasks(all.filter((t) => t.id !== taskId))
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    }
  }

  return (
    <main className="min-h-screen bg-[#111111] px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Archive</p>
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
              Archived tasks
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
          >
            ← Back
          </Link>
        </header>

        {!mounted ? null : tasks.length === 0 ? (
          <p className="text-sm text-zinc-600 italic">No archived tasks.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 leading-snug break-words">{task.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {task.tag && (
                      <span className="text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">
                        {task.tag}
                      </span>
                    )}
                    <span className="text-xs text-zinc-600 font-mono">
                      Created {task.createdAt}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRestore(task.id)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-2.5 py-1 rounded transition-colors"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(task.id)}
                    className="text-xs text-zinc-600 hover:text-red-500 border border-zinc-800 hover:border-red-900 px-2.5 py-1 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
