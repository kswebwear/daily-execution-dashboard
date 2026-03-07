"use client"

import { useEffect, useState } from "react"

export default function CommandPaletteHint() {
  const [shortcut, setShortcut] = useState("⌘K")

  useEffect(() => {
    // Detect non-Mac so we can show Ctrl+K instead
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
    if (!isMac) setShortcut("Ctrl+K")
  }, [])

  function openPalette() {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true, cancelable: true })
    )
  }

  return (
    <button
      onClick={openPalette}
      title="Open command palette"
      className="cmd-hint-btn hidden md:flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 border border-zinc-800 hover:border-zinc-600 rounded-md px-2.5 py-1.5 transition-colors"
    >
      <span className="opacity-60">Commands</span>
      <kbd className="font-mono bg-zinc-800/60 border border-zinc-700/60 rounded px-1.5 py-0.5 text-[10px] text-zinc-500">
        {shortcut}
      </kbd>
    </button>
  )
}
