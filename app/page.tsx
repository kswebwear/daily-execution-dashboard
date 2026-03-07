import TaskBoard from "@/components/TaskBoard"
import AuthButton from "@/components/AuthButton"
import ThemeToggle from "@/components/ThemeToggle"
import LiveClock from "@/components/LiveClock"
import CommandPaletteHint from "@/components/CommandPaletteHint"
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
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="relative mb-6 md:mb-10 flex items-start justify-between gap-2 md:gap-4">
          {/* Left: date + title */}
          <div className="min-w-0 flex-1">
            {/* JARVIS system status — hidden in other themes via CSS */}
            <div aria-hidden="true" className="jarvis-sys-status mb-2" />
            <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1 truncate">{dateLabel}</p>
            <h1 className="text-xl md:text-2xl font-semibold text-zinc-100 tracking-tight">
              Daily Execution
            </h1>
          </div>

          {/* Right: controls — clock + archive hidden on mobile */}
          <div className="flex flex-col items-end gap-2 pt-1 shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Clock: desktop only */}
              <div className="hidden md:block">
                <LiveClock />
              </div>
              {/* Archive: desktop only */}
              <Link
                href="/archive"
                className="hidden md:block text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Archive
              </Link>
              <Link
                href="/history"
                className="hidden md:block text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                History
              </Link>
              <CommandPaletteHint />
              <ThemeToggle />
            </div>
            <AuthButton />
          </div>
        </header>

        {/* Board */}
        <TaskBoard />
      </div>
    </main>
  )
}
