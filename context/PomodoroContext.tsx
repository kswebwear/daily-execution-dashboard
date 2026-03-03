"use client"

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from "react"
import type { User } from "firebase/auth"
import { useAuth } from "@/context/AuthContext"
import { appendPomodoroSession } from "@/lib/firestore"
import { loadTasks, saveTasks } from "@/lib/storage"
import type { PomodoroSession } from "@/lib/types"

// ── State machine types ───────────────────────────────────────────────────────
export type PomodoroPhase =
  | "idle"        // nothing running
  | "focusing"    // focus timer counting down
  | "focus-done"  // focus complete, awaiting break decision
  | "breaking"    // break timer counting down
  | "break-done"  // break complete, awaiting next session decision

type State = {
  phase: PomodoroPhase
  timeLeft: number       // seconds remaining in current phase
  totalTime: number      // total seconds for current phase (for progress calc)
  running: boolean
  taskId: string | null
  sessionStartedAt: string | null
  customDurationMinutes: number
}

type Action =
  | { type: "START_FOCUS"; taskId: string; startedAt: string; durationMinutes: number }
  | { type: "TICK" }
  | { type: "PHASE_COMPLETE" }
  | { type: "PAUSE_RESUME" }
  | { type: "RESET" }
  | { type: "STOP" }
  | { type: "START_BREAK" }
  | { type: "SKIP_BREAK_OR_DISMISS" }
  | { type: "SET_DURATION"; minutes: number }

const BREAK_DURATION = 5 * 60 // 5 minutes, fixed

function idle(customDurationMinutes: number): State {
  return {
    phase: "idle",
    timeLeft: customDurationMinutes * 60,
    totalTime: customDurationMinutes * 60,
    running: false,
    taskId: null,
    sessionStartedAt: null,
    customDurationMinutes,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_FOCUS":
      return {
        phase: "focusing",
        timeLeft: action.durationMinutes * 60,
        totalTime: action.durationMinutes * 60,
        running: true,
        taskId: action.taskId,
        sessionStartedAt: action.startedAt,
        customDurationMinutes: action.durationMinutes,
      }
    case "TICK": {
      if (!state.running) return state
      const next = state.timeLeft - 1
      if (next <= 0) {
        // Phase complete — transition immediately so the effect can fire
        if (state.phase === "focusing") {
          return { ...state, timeLeft: 0, running: false, phase: "focus-done" }
        }
        if (state.phase === "breaking") {
          return { ...state, timeLeft: 0, running: false, phase: "break-done" }
        }
      }
      return { ...state, timeLeft: next }
    }
    case "PAUSE_RESUME":
      if (state.phase !== "focusing" && state.phase !== "breaking") return state
      return { ...state, running: !state.running }
    case "RESET": {
      const resetTime =
        state.phase === "focusing" || state.phase === "focus-done"
          ? state.customDurationMinutes * 60
          : BREAK_DURATION
      return { ...state, timeLeft: resetTime, totalTime: resetTime, running: false }
    }
    case "START_BREAK":
      return {
        ...state,
        phase: "breaking",
        timeLeft: BREAK_DURATION,
        totalTime: BREAK_DURATION,
        running: true,
      }
    case "STOP":
    case "SKIP_BREAK_OR_DISMISS":
      return idle(state.customDurationMinutes)
    case "SET_DURATION": {
      const mins = Math.max(1, Math.min(120, action.minutes))
      if (state.phase !== "idle") return { ...state, customDurationMinutes: mins }
      return { ...state, customDurationMinutes: mins, timeLeft: mins * 60, totalTime: mins * 60 }
    }
    default:
      return state
  }
}

// ── Context API ───────────────────────────────────────────────────────────────
export type PomodoroContextType = {
  state: State
  startFocus: (taskId: string) => void
  pauseResume: () => void
  reset: () => void
  stop: () => void
  startBreak: () => void
  skipBreak: () => void
  setCustomDuration: (minutes: number) => void
  formatTime: (seconds: number) => string
  progressPct: number
}

const PomodoroContext = createContext<PomodoroContextType | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const [state, dispatch] = useReducer(reducer, idle(25))

  // Stable ref for user — safe to read inside callbacks/effects
  const userRef = useRef<User | null>(null)
  useEffect(() => { userRef.current = user }, [user])

  // Stable ref for state values needed at stop-time (avoids stale closures)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // ── Tick ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.running) return
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000)
    return () => clearInterval(id)
  }, [state.running])

  // ── Persist on phase completion ───────────────────────────────────────────
  const prevPhaseRef = useRef<PomodoroPhase>("idle")
  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = state.phase

    // focus session just completed naturally
    if (
      prev === "focusing" &&
      state.phase === "focus-done" &&
      state.taskId &&
      state.sessionStartedAt
    ) {
      persistSession(state.taskId, {
        startedAt: state.sessionStartedAt,
        duration: state.customDurationMinutes,
        type: "focus",
        completed: true,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // ── Persist helper (uses refs — no stale closure risk) ───────────────────
  const persistSession = useCallback(async (taskId: string, session: PomodoroSession) => {
    const u = userRef.current
    if (u) {
      try {
        await appendPomodoroSession(u.uid, taskId, session)
      } catch (err) {
        console.error("[Pomodoro] Firestore append failed:", err)
      }
    } else {
      // localStorage fallback
      try {
        const tasks = loadTasks()
        const updated = tasks.map((t) =>
          t.id !== taskId
            ? t
            : { ...t, pomodoroSessions: [...(t.pomodoroSessions ?? []), session] }
        )
        saveTasks(updated)
      } catch (err) {
        console.error("[Pomodoro] localStorage append failed:", err)
      }
    }
  }, [])

  // ── Public API ────────────────────────────────────────────────────────────
  const startFocus = useCallback(
    (taskId: string) => {
      const s = stateRef.current
      // If currently focusing on a *different* task, log it as incomplete first
      if (s.phase === "focusing" && s.taskId && s.taskId !== taskId && s.sessionStartedAt) {
        const elapsed = Math.max(1, Math.round((s.totalTime - s.timeLeft) / 60))
        persistSession(s.taskId, {
          startedAt: s.sessionStartedAt,
          duration: elapsed,
          type: "focus",
          completed: false,
        })
      }
      dispatch({
        type: "START_FOCUS",
        taskId,
        startedAt: new Date().toISOString(),
        durationMinutes: s.customDurationMinutes,
      })
    },
    [persistSession]
  )

  const stop = useCallback(() => {
    const s = stateRef.current
    if (s.phase === "focusing" && s.taskId && s.sessionStartedAt) {
      const elapsed = Math.max(1, Math.round((s.totalTime - s.timeLeft) / 60))
      persistSession(s.taskId, {
        startedAt: s.sessionStartedAt,
        duration: elapsed,
        type: "focus",
        completed: false,
      })
    }
    dispatch({ type: "STOP" })
  }, [persistSession])

  const pauseResume = useCallback(() => dispatch({ type: "PAUSE_RESUME" }), [])
  const reset = useCallback(() => dispatch({ type: "RESET" }), [])
  const startBreak = useCallback(() => dispatch({ type: "START_BREAK" }), [])
  const skipBreak = useCallback(() => dispatch({ type: "SKIP_BREAK_OR_DISMISS" }), [])
  const setCustomDuration = useCallback(
    (minutes: number) => dispatch({ type: "SET_DURATION", minutes }),
    []
  )

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60)
    const s = Math.max(0, seconds) % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }, [])

  const progressPct =
    state.totalTime > 0
      ? Math.round(((state.totalTime - state.timeLeft) / state.totalTime) * 100)
      : 0

  return (
    <PomodoroContext.Provider
      value={{
        state,
        startFocus,
        pauseResume,
        reset,
        stop,
        startBreak,
        skipBreak,
        setCustomDuration,
        formatTime,
        progressPct,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoro(): PomodoroContextType {
  const ctx = useContext(PomodoroContext)
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider")
  return ctx
}
