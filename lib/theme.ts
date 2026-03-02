export type Theme = "minimal" | "cyber" | "jarvis"

export const THEME_KEY = "ded_theme"

// Well-known tag → neon color
const KNOWN_TAG_COLORS: Record<string, string> = {
  work: "#00bfff",
  personal: "#ff00ff",
  study: "#39ff14",
  health: "#ff6b35",
  finance: "#ffd700",
  fitness: "#ff6b35",
  home: "#a78bfa",
}

const NEON_PALETTE = [
  "#00e5ff",
  "#ff00ff",
  "#39ff14",
  "#ff6b35",
  "#ffd700",
  "#7b2fff",
  "#ff073a",
  "#00ff9f",
]

/** Returns a deterministic neon color for a given tag string. */
export function getTagNeonColor(tag: string): string {
  const lower = tag.toLowerCase()
  if (KNOWN_TAG_COLORS[lower]) return KNOWN_TAG_COLORS[lower]
  let hash = 0
  for (let i = 0; i < lower.length; i++) {
    hash = (hash * 31 + lower.charCodeAt(i)) & 0xffffffff
  }
  return NEON_PALETTE[Math.abs(hash) % NEON_PALETTE.length]
}

/** Inline style object for a neon tag badge in cyber mode. */
export function getNeonTagStyle(tag: string): React.CSSProperties {
  const color = getTagNeonColor(tag)
  return {
    color,
    borderColor: color + "50",
    backgroundColor: color + "18",
    textShadow: `0 0 6px ${color}60`,
  }
}
