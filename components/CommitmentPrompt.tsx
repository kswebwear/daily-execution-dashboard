"use client"

import { useState } from "react"
import { DEFAULT_COMMITMENT } from "@/lib/commitment"

type Props = {
  currentValue: number | undefined
  onSet: (value: number) => void
}

export default function CommitmentPrompt({ currentValue, onSet }: Props) {
  const [editing, setEditing] = useState(currentValue === undefined)
  const [inputVal, setInputVal] = useState(
    String(currentValue ?? DEFAULT_COMMITMENT)
  )

  function handleSubmit() {
    const n = parseInt(inputVal, 10)
    if (!n || n < 1 || n > 50) return
    onSet(n)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="commitment-badge text-[10px] md:text-xs text-zinc-500 hover:text-zinc-300 transition-colors tabular-nums"
        title="Edit daily commitment"
      >
        Goal: {currentValue ?? DEFAULT_COMMITMENT}
      </button>
    )
  }

  return (
    <div className="commitment-prompt flex items-center gap-2">
      <span className="text-[10px] md:text-xs text-zinc-500">
        {currentValue === undefined ? "Today's goal:" : "Goal:"}
      </span>
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
            setInputVal(String(currentValue ?? DEFAULT_COMMITMENT))
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
