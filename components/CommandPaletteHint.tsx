"use client"

import { useEffect, useState } from "react"

function openPalette() {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true, cancelable: true })
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function CommandPaletteHint() {
  const [shortcut, setShortcut] = useState("⌘K")

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
    if (!isMac) setShortcut("Ctrl+K")
  }, [])

  return (
    <>
      {/* Mobile: icon-only search button */}
      <button
        onClick={openPalette}
        aria-label="Search & commands"
        title="Search & commands"
        className="cmd-hint-btn md:hidden flex items-center justify-center w-8 h-8 text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded-md transition-colors"
      >
        <SearchIcon />
      </button>

      {/* Desktop: "Commands ⌘K" badge */}
      <button
        onClick={openPalette}
        title="Open command palette"
        className="cmd-hint-btn hidden md:flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 border border-zinc-800 hover:border-zinc-600 rounded-md px-2.5 py-1.5 transition-colors"
      >
        <SearchIcon />
        <span className="opacity-60">Commands</span>
        <kbd className="font-mono bg-zinc-800/60 border border-zinc-700/60 rounded px-1.5 py-0.5 text-[10px] text-zinc-500">
          {shortcut}
        </kbd>
      </button>
    </>
  )
}
