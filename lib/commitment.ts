const STORAGE_KEY = "ded_daily_commitments"

const DEFAULT_COMMITMENT = 5

export type CommitmentMap = Record<string, number> // { "2026-03-30": 5 }

export function loadCommitments(): CommitmentMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveCommitments(map: CommitmentMap): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getCommitment(map: CommitmentMap, date: string): number {
  return map[date] ?? DEFAULT_COMMITMENT
}

export { DEFAULT_COMMITMENT }
