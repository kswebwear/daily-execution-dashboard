"use client"

import { useEffect, useState } from "react"

export default function LiveClock() {
  const [time, setTime] = useState("")

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString("en-AU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Australia/Sydney",
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!time) return null

  return (
    <span className="live-clock font-mono tabular-nums text-xs text-zinc-700 transition-colors">
      {time}
    </span>
  )
}
