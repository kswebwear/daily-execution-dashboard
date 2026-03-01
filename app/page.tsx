import TaskBoard from "@/components/TaskBoard"

function getDateLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export default function Home() {
  const dateLabel = getDateLabel()

  return (
    <main className="min-h-screen bg-[#111111] px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">{dateLabel}</p>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
            Daily Execution
          </h1>
        </header>

        {/* Board */}
        <TaskBoard />
      </div>
    </main>
  )
}
