"use client"

import { useState } from "react"
import { usePomodoro } from "@/context/PomodoroContext"
import { useTheme } from "@/context/ThemeContext"
import type { Task } from "@/lib/types"

type Props = {
  task: Task
  compact?: boolean // compact mode for focus overlay
}

const PHASE_LABEL: Record<string, string> = {
  idle: "FOCUS",
  focusing: "FOCUS",
  "focus-done": "COMPLETE",
  breaking: "BREAK",
  "break-done": "BREAK DONE",
}

export default function PomodoroTimer({ task, compact = false }: Props) {
  const { state, startFocus, pauseResume, reset, stop, startBreak, skipBreak, setCustomDuration, formatTime, progressPct } =
    usePomodoro()
  const { theme } = useTheme()
  const isJarvis = theme === "jarvis"
  const isCyber = theme === "cyber"

  const [pendingConfirm, setPendingConfirm] = useState(false)
  const [localDuration, setLocalDuration] = useState(state.customDurationMinutes)

  const isOwner = state.taskId === task.id
  const isActive = isOwner && (state.phase === "focusing" || state.phase === "breaking")
  const isFocusDone = isOwner && state.phase === "focus-done"
  const isBreakDone = isOwner && state.phase === "break-done"
  const otherActive =
    state.phase === "focusing" &&
    state.taskId !== null &&
    state.taskId !== task.id

  // ── Handle Start click ───────────────────────────────────────────────────
  function handleStartClick() {
    if (otherActive) {
      setPendingConfirm(true)
      return
    }
    startFocus(task.id)
  }

  function handleConfirmSwitch() {
    setPendingConfirm(false)
    startFocus(task.id)
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const timerClass = [
    "pomo-timer",
    isJarvis ? "pomo-jarvis" : isCyber ? "pomo-cyber" : "pomo-minimal",
    compact ? "pomo-compact" : "",
  ]
    .filter(Boolean)
    .join(" ")

  // ── Confirm-switch prompt ────────────────────────────────────────────────
  if (pendingConfirm) {
    return (
      <div className={timerClass}>
        <p className="pomo-confirm-msg">Stop current session and start here?</p>
        <div className="pomo-btn-row">
          <button className="pomo-btn pomo-btn-primary" onClick={handleConfirmSwitch}>
            Yes, switch
          </button>
          <button className="pomo-btn pomo-btn-ghost" onClick={() => setPendingConfirm(false)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Focus-done prompt ────────────────────────────────────────────────────
  if (isFocusDone) {
    return (
      <div className={timerClass}>
        <p className="pomo-phase-label pomo-complete-label">Session complete</p>
        <p className="pomo-display">00:00</p>
        <div className="pomo-btn-row">
          <button className="pomo-btn pomo-btn-primary" onClick={startBreak}>
            Start break (5m)
          </button>
          <button className="pomo-btn pomo-btn-ghost" onClick={skipBreak}>
            Skip
          </button>
        </div>
      </div>
    )
  }

  // ── Break-done prompt ────────────────────────────────────────────────────
  if (isBreakDone) {
    return (
      <div className={timerClass}>
        <p className="pomo-phase-label">Break over</p>
        <p className="pomo-display">00:00</p>
        <div className="pomo-btn-row">
          <button className="pomo-btn pomo-btn-primary" onClick={() => startFocus(task.id)}>
            Next focus
          </button>
          <button className="pomo-btn pomo-btn-ghost" onClick={skipBreak}>
            Done
          </button>
        </div>
      </div>
    )
  }

  // ── Idle (no session for this task) ─────────────────────────────────────
  if (!isOwner || state.phase === "idle") {
    return (
      <div className={timerClass}>
        <div className="pomo-idle-row">
          <span className="pomo-phase-label">{PHASE_LABEL["idle"]}</span>
          <div className="pomo-duration-input">
            <input
              type="number"
              min={1}
              max={120}
              value={localDuration}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) {
                  const clamped = Math.max(1, Math.min(120, v))
                  setLocalDuration(clamped)
                  setCustomDuration(clamped)
                }
              }}
              className="pomo-duration-field"
              onPointerDown={(e) => e.stopPropagation()}
            />
            <span className="pomo-duration-unit">min</span>
          </div>
        </div>
        <button
          className="pomo-btn pomo-btn-primary pomo-start-btn"
          onClick={handleStartClick}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Start Pomodoro
        </button>
        {otherActive && (
          <p className="pomo-other-active">Another session is running</p>
        )}
      </div>
    )
  }

  // ── Active (focusing or breaking) ────────────────────────────────────────
  const timeDisplay =
    state.phase === "breaking"
      ? formatTime(state.timeLeft)
      : formatTime(state.timeLeft)

  return (
    <div className={timerClass}>
      <div className="pomo-header-row">
        <span className={`pomo-phase-label ${state.phase === "breaking" ? "pomo-break-label" : "pomo-focus-label"}`}>
          {PHASE_LABEL[state.phase]}
        </span>
        <span className="pomo-task-hint">{task.title.slice(0, 28)}{task.title.length > 28 ? "…" : ""}</span>
      </div>

      {/* Time display */}
      <p className="pomo-display">{timeDisplay}</p>

      {/* Progress bar */}
      <div className="pomo-progress-track">
        <div className="pomo-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Controls */}
      <div className="pomo-btn-row">
        <button
          className="pomo-btn pomo-btn-primary"
          onClick={pauseResume}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {state.running ? "Pause" : "Resume"}
        </button>
        <button
          className="pomo-btn pomo-btn-ghost"
          onClick={reset}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Reset
        </button>
        <button
          className="pomo-btn pomo-btn-danger"
          onClick={stop}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Stop
        </button>
      </div>
    </div>
  )
}

// ── Compact indicator for TaskCard ────────────────────────────────────────────
export function PomodoroIndicator({ taskId }: { taskId: string }) {
  const { state, formatTime } = usePomodoro()

  if (state.taskId !== taskId) return null
  if (state.phase === "idle") return null

  const label =
    state.phase === "focusing" || state.phase === "focus-done"
      ? "FOCUS"
      : state.phase === "breaking" || state.phase === "break-done"
      ? "BREAK"
      : null

  if (!label) return null

  const isCounting = state.phase === "focusing" || state.phase === "breaking"

  return (
    <span className="pomo-indicator">
      <span className={`pomo-indicator-dot ${state.running ? "pomo-dot-active" : "pomo-dot-paused"}`} />
      <span className="pomo-indicator-text">
        {label} {isCounting ? formatTime(state.timeLeft) : "done"}
      </span>
    </span>
  )
}
