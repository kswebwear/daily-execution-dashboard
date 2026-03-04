"use client"

export type MobileTab = "pending" | "completed" | "insights"

type Props = {
  activeTab: MobileTab
  pendingCount: number
  completedCount: number
  onTabChange: (tab: MobileTab) => void
}

export default function MobileBottomNav({ activeTab, pendingCount, completedCount, onTabChange }: Props) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      <button
        onClick={() => onTabChange("pending")}
        className={`mobile-nav-tab ${activeTab === "pending" ? "mobile-nav-tab-active" : ""}`}
        aria-current={activeTab === "pending" ? "page" : undefined}
      >
        <span className="mobile-nav-label">Pending</span>
        {pendingCount > 0 && (
          <span className="mobile-nav-badge">{pendingCount}</span>
        )}
      </button>

      <button
        onClick={() => onTabChange("completed")}
        className={`mobile-nav-tab ${activeTab === "completed" ? "mobile-nav-tab-active" : ""}`}
        aria-current={activeTab === "completed" ? "page" : undefined}
      >
        <span className="mobile-nav-label">Completed</span>
        {completedCount > 0 && (
          <span className="mobile-nav-badge">{completedCount}</span>
        )}
      </button>

      <button
        onClick={() => onTabChange("insights")}
        className={`mobile-nav-tab ${activeTab === "insights" ? "mobile-nav-tab-active" : ""}`}
        aria-current={activeTab === "insights" ? "page" : undefined}
      >
        <span className="mobile-nav-label">Insights</span>
      </button>
    </nav>
  )
}
