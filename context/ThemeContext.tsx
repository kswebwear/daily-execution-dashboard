"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { type Theme, THEME_KEY } from "@/lib/theme"

type ThemeContextType = {
  theme: Theme
  cycleTheme: () => void
  focusMode: boolean
  toggleFocusMode: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "minimal",
  cycleTheme: () => {},
  focusMode: false,
  toggleFocusMode: () => {},
})

const THEME_ORDER: Theme[] = ["minimal", "cyber", "jarvis", "aurora"]
const THEME_CLASSES = ["cyber", "jarvis", "aurora"] as const

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("minimal")
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === "cyber" || saved === "jarvis" || saved === "aurora") {
      setTheme(saved)
    }
  }, [])

  function cycleTheme() {
    setTheme((prev) => {
      const idx = THEME_ORDER.indexOf(prev)
      const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length]
      localStorage.setItem(THEME_KEY, next)
      THEME_CLASSES.forEach((cls) => document.documentElement.classList.remove(cls))
      if (next !== "minimal") document.documentElement.classList.add(next)
      return next
    })
  }

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add("focus-mode")
      } else {
        document.documentElement.classList.remove("focus-mode")
      }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme, focusMode, toggleFocusMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
