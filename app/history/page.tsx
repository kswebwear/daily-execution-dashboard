"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Task } from "@/lib/types"
import { useAuth } from "@/context/AuthContext"
import { subscribeToTasks } from "@/lib/firestore"
import { loadTasks } from "@/lib/storage"
import HistoryView from "@/components/HistoryView"

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      setTasks(loadTasks())
      setMounted(true)
      return
    }

    const unsub = subscribeToTasks(user.uid, (allTasks) => {
      setTasks(allTasks)
      setMounted(true)
    })
    return () => unsub()
  }, [user, loading])

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="task-column-header text-xs text-zinc-600 uppercase tracking-widest mb-1">History</p>
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
              Completion history
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
          >
            ← Back
          </Link>
        </header>

        {mounted && <HistoryView tasks={tasks} />}
      </div>
    </main>
  )
}
