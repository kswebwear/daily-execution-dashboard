"use client"

import { useTheme } from "@/context/ThemeContext"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      title={theme === "minimal" ? "Switch to Cyberpunk mode" : "Switch to Minimal mode"}
      className="theme-toggle-btn text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-all"
    >
      {theme === "cyber" ? "MINIMAL" : "CYBER"}
    </button>
  )
}
