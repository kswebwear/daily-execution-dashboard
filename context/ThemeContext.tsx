"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { type Theme, THEME_KEY } from "@/lib/theme"

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "minimal",
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("minimal")

  useEffect(() => {
    // Sync React state with the class already applied by the anti-flicker script
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved === "cyber") setTheme("cyber")
  }, [])

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === "minimal" ? "cyber" : "minimal"
      localStorage.setItem(THEME_KEY, next)
      if (next === "cyber") {
        document.documentElement.classList.add("cyber")
      } else {
        document.documentElement.classList.remove("cyber")
      }
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
