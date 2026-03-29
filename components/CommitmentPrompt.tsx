"use client"

import { useState } from "react"

type Props = {
  currentValue: number | undefined
  onSet: (value: number) => void
}

export default function CommitmentPrompt({ currentValue, onSet }: Props) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState(String(currentValue ?? ""))

  const isUnset = currentValue === undefined

  function handleSubmit() {
    const n = parseInt(inputVal, 10)
    if (!n || n < 1 || n > 50) return
    onSet(n)
    setEditing(false)
  }

  // No commitment set for today — show prominent ask
  if (isUnset && !editing) {
    return (
      <div className="commitment-ask flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900/50">
        <span className="text-xs text-zinc-400">
          How many tasks will you complete today?
        </span>
        <input
          type="number"
          min={1}
          max={50}
          placeholder="5"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit()
          }}
          autoFocus
          className="commitment-input w-12 text-center text-xs bg-transparent border border-zinc-600 rounded px-1 py-0.5 text-zinc-200 focus:border-zinc-400 focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          className="text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-600 hover:border-zinc-400 px-2 py-0.5 rounded transition-colors"
        >
          Set
        </button>
      </div>
    )
  }

  // Value exists — show compact badge, click to edit
  if (!editing) {
    return (
      <button
        onClick={() => { setEditing(true); setInputVal(String(currentValue)) }}
        className="commitment-badge text-[10px] md:text-xs text-zinc-500 hover:text-zinc-300 transition-colors tabular-nums"
        title="Edit daily commitment"
      >
        Goal: {currentValue}
      </button>
    )
  }

  // Editing existing value
  return (
    <div className="commitment-prompt flex items-center gap-2">
      <span className="text-[10px] md:text-xs text-zinc-500">Goal:</span>
      <input
        type="number"
        min={1}
        max={50}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit()
          if (e.key === "Escape") {
            setEditing(false)
            setInputVal(String(currentValue))
          }
        }}
        autoFocus
        className="commitment-input w-12 text-center text-xs bg-transparent border border-zinc-700 rounded px-1 py-0.5 text-zinc-200 focus:border-zinc-500 focus:outline-none"
      />
      <button
        onClick={handleSubmit}
        className="text-[10px] md:text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        Set
      </button>
    </div>
  )
}
