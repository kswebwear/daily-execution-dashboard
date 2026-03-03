"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/context/ThemeContext"

export default function LiveClock() {
  const { theme } = useTheme()
  const [time, setTime] = useState("")
  const [ms, setMs] = useState("000")
  const [dateLine, setDateLine] = useState("")

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-AU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Australia/Sydney",
        })
      )
      setMs(String(now.getMilliseconds()).padStart(3, "0"))
      setDateLine(
        now.toLocaleDateString("en-AU", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: "Australia/Sydney",
          timeZoneName: "short",
        })
      )
    }
    tick()
    // 100ms interval — needed for smooth ms in JARVIS; negligible overhead otherwise
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [])

  if (!time) return null

  if (theme === "jarvis") {
    return (
      <span className="live-clock flex flex-col items-end gap-0.5" style={{ minWidth: "8rem" }}>
        <span className="font-mono tabular-nums text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>
          {time}
          <span className="live-clock-ms">.{ms}</span>
        </span>
        <span className="live-clock-date">{dateLine}</span>
      </span>
    )
  }

  return (
    <span
      className="live-clock font-mono tabular-nums text-xs text-zinc-700 transition-colors"
      style={{ display: "inline-block", minWidth: "4.5rem", textAlign: "right" }}
    >
      {time}
    </span>
  )
}
