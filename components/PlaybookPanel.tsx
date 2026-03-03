"use client"

import { useState } from "react"
import { usePomodoro } from "@/context/PomodoroContext"
import type { Task } from "@/lib/types"

type Technique = {
  id: string
  name: string
  tagline: string
  explanation: string
  whenToUse: string
  noteTemplate: string
  suggestPriority?: "high" | "medium" | "low"
  offerPomodoro: boolean
}

const TECHNIQUES: Technique[] = [
  {
    id: "five-min",
    name: "5 Minute Rule",
    tagline: "Just start for five minutes.",
    explanation:
      "Commit to working on a task for only 5 minutes. Once started, momentum usually carries you forward. The hardest part is beginning.",
    whenToUse:
      "When you're procrastinating, feeling overwhelmed, or unsure where to start.",
    noteTemplate: "Applying 5 Minute Rule — starting for at least 5 minutes.",
    offerPomodoro: true,
  },
  {
    id: "kaizen",
    name: "Kaizen",
    tagline: "1% better every day.",
    explanation:
      "Focus on small, continuous improvement. Don't try to do everything perfectly — just make it slightly better than yesterday.",
    whenToUse:
      "When perfection paralysis sets in, or a task feels too large to complete in one go.",
    noteTemplate: "Kaizen applied — focusing on one small improvement today.",
    offerPomodoro: false,
  },
  {
    id: "eat-frog",
    name: "Eat The Frog",
    tagline: "Do the worst task first.",
    explanation:
      "Identify your most dreaded task and do it first thing. Everything else will feel easier after.",
    whenToUse:
      "When you keep pushing a specific task off. That task is your frog.",
    noteTemplate: "Eating the frog — prioritized this as the first task to complete.",
    suggestPriority: "high",
    offerPomodoro: true,
  },
  {
    id: "mit",
    name: "MIT — Most Important Task",
    tagline: "One task that must get done today.",
    explanation:
      "Choose the single most important task. If you complete only one thing today, this is it. Everything else is secondary.",
    whenToUse:
      "When you have too many tasks competing for attention and need to cut through noise.",
    noteTemplate: "Marked as MIT — the one task that must be completed today.",
    suggestPriority: "high",
    offerPomodoro: true,
  },
  {
    id: "timeboxing",
    name: "Time Boxing",
    tagline: "Fixed time. Fixed scope.",
    explanation:
      "Allocate a fixed block of time to a task and stop when the box ends. Prevents scope creep and creates urgency.",
    whenToUse:
      "When tasks expand to fill available time, or you need to avoid perfectionism.",
    noteTemplate: "Time-boxed — working within a defined time block, then moving on.",
    offerPomodoro: true,
  },
  {
    id: "ikigai",
    name: "Ikigai Alignment",
    tagline: "Does this matter to you?",
    explanation:
      "Ask: Is this task aligned with what you love, what you're good at, what the world needs, and what sustains you? Tasks aligned with your Ikigai get done with energy.",
    whenToUse:
      "When motivation is low or you're questioning why a task matters.",
    noteTemplate: "Ikigai check — reconnected with why this task matters.",
    offerPomodoro: false,
  },
]

type Props = {
  pendingTasks: Task[]
  onClose: () => void
  onApplyTechnique: (
    taskId: string,
    note: string,
    priority?: "low" | "medium" | "high"
  ) => void
}

export default function PlaybookPanel({ pendingTasks, onClose, onApplyTechnique }: Props) {
  const { startFocus } = usePomodoro()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    pendingTasks[0]?.id ?? ""
  )
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const [offerPomoFor, setOfferPomoFor] = useState<string | null>(null) // technique id

  function handleApply(technique: Technique) {
    if (!selectedTaskId) return
    onApplyTechnique(
      selectedTaskId,
      technique.noteTemplate,
      technique.suggestPriority
    )
    setAppliedId(technique.id)
    if (technique.offerPomodoro) {
      setOfferPomoFor(technique.id)
    }
    setTimeout(() => setAppliedId(null), 2000)
  }

  function handleStartPomo() {
    if (!selectedTaskId) return
    startFocus(selectedTaskId)
    setOfferPomoFor(null)
  }

  return (
    <div className="playbook-panel cyber-panel">
      {/* Header */}
      <div className="playbook-header">
        <div>
          <h2 className="playbook-title">Execution Playbook</h2>
          <p className="playbook-subtitle">Apply a technique to a task</p>
        </div>
        <button className="playbook-close" onClick={onClose}>×</button>
      </div>

      {/* Task selector */}
      {pendingTasks.length > 0 ? (
        <div className="playbook-task-select">
          <label className="playbook-section-label">Apply to task</label>
          <select
            value={selectedTaskId}
            onChange={(e) => {
              setSelectedTaskId(e.target.value)
              setOfferPomoFor(null)
            }}
            className="playbook-select"
          >
            {pendingTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title.slice(0, 50)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="playbook-empty">No pending tasks.</p>
      )}

      {/* Pomodoro offer banner */}
      {offerPomoFor && (
        <div className="playbook-pomo-offer">
          <span className="playbook-pomo-offer-text">Start a Pomodoro for this task?</span>
          <div className="pomo-btn-row">
            <button className="pomo-btn pomo-btn-primary" onClick={handleStartPomo}>
              Start (25m)
            </button>
            <button className="pomo-btn pomo-btn-ghost" onClick={() => setOfferPomoFor(null)}>
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Techniques list */}
      <div className="playbook-list">
        {TECHNIQUES.map((t) => {
          const isOpen = expanded === t.id
          const isApplied = appliedId === t.id

          return (
            <div key={t.id} className={`playbook-item ${isOpen ? "playbook-item-open" : ""}`}>
              {/* Technique header — click to expand */}
              <button
                className="playbook-item-header"
                onClick={() => setExpanded(isOpen ? null : t.id)}
              >
                <div className="playbook-item-title-group">
                  <span className="playbook-item-name">{t.name}</span>
                  <span className="playbook-item-tagline">{t.tagline}</span>
                </div>
                <span className="playbook-chevron">{isOpen ? "▲" : "▼"}</span>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div className="playbook-item-body">
                  <p className="playbook-item-explanation">{t.explanation}</p>
                  <div className="playbook-when">
                    <span className="playbook-when-label">When to use:</span>
                    <span className="playbook-when-text">{t.whenToUse}</span>
                  </div>
                  {t.suggestPriority && (
                    <p className="playbook-priority-note">
                      Applying this will set task priority to{" "}
                      <strong>{t.suggestPriority}</strong>.
                    </p>
                  )}
                  <button
                    className={`playbook-apply-btn ${isApplied ? "playbook-apply-done" : ""}`}
                    onClick={() => handleApply(t)}
                    disabled={!selectedTaskId}
                  >
                    {isApplied ? "Applied ✓" : "Apply to Task"}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
