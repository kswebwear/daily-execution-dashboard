import TaskBoard from "@/components/TaskBoard"
import AuthButton from "@/components/AuthButton"
import Link from "next/link"

function getDateLabel(): string {
  return new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Australia/Sydney",
  })
}

export default function Home() {
  const dateLabel = getDateLabel()

  return (
    <main className="min-h-screen bg-[#111111] px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">{dateLabel}</p>
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
              Daily Execution
            </h1>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <Link
              href="/archive"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Archive
            </Link>
            <AuthButton />
          </div>
        </header>

        {/* Board */}
        <TaskBoard />
      </div>
    </main>
  )
}
