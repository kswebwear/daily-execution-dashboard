"use client"

import { useTheme } from "@/context/ThemeContext"

const LABELS: Record<string, string> = {
  minimal: "CYBER",
  cyber: "JARVIS",
  jarvis: "MINIMAL",
}

const TITLES: Record<string, string> = {
  minimal: "Switch to Cyberpunk mode",
  cyber: "Switch to JARVIS mode",
  jarvis: "Switch to Minimal mode",
}

export default function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()

  return (
    <button
      onClick={cycleTheme}
      title={TITLES[theme]}
      className="theme-toggle-btn text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-all"
    >
      {LABELS[theme]}
    </button>
  )
}
