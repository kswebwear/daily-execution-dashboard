"use client"

type Props = {
  onConfirm: () => Promise<void>
  onSkip: () => void
}

export default function MigrationModal({ onConfirm, onSkip }: Props) {
  async function handleConfirm() {
    await onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-zinc-100 font-medium text-base">Local data found</h2>
        <p className="text-sm text-zinc-400">
          You have tasks stored locally. Sync them to the cloud so they&apos;re available across
          all your devices?
        </p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
          >
            Sync to cloud
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
