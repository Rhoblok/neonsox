import { useState, useEffect, useCallback } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { loadCampaignSetup, saveCampaignSetup } from "../lib/campaignSetupStorage"
import { loadCampaignSetupFromSupabase, saveCampaignSetupToSupabase } from "../lib/campaignSetupSync"
import { formatMarketSummary } from "../lib/marketCountries"
import ThemeToggle from "../components/ThemeToggle"
import Wordmark from "../components/Wordmark"
import PaletteGenerationStudio from "../components/palette/PaletteGenerationStudio"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"

const WIZARD_KEY = "neonsox-wizard"

const TIERS = {
  tier1: { label: "Tier 1 — $99 (60 days)", platforms: 2 },
  tier2: { label: "Tier 2 — $149 (60 days)", platforms: 3 },
  tier3: { label: "Tier 3 — $199 (60 days)", platforms: 4 },
}

import { SOCIAL_PLATFORMS } from "../lib/socialPlatforms"

const PLATFORMS = SOCIAL_PLATFORMS

const GOALS = ["Awareness", "Traffic", "Engagement", "Conversions"]

function readWizard() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(WIZARD_KEY)
}

export default function Dashboard() {
  const { colors } = useTheme()
  const { hasCampaign, isAuthenticated, loading, isAdmin, signOut, user, profileReady } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const styles = getStyles(colors)

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login")
  }, [loading, isAuthenticated, navigate])

  // Wizard is remembered: once completed it won't show again until "Re-run setup".
  const [currentStep, setCurrentStep] = useState(() => (readWizard() ? "dashboard" : "wizard"))
  const [isCurated, setIsCurated] = useState(() => readWizard() === "curated")
  const [activeTab, setActiveTab] = useState("dashboard") // 'dashboard' | 'palette'
  const [feedType, setFeedType] = useState("personal")

  const [campaign, setCampaignState] = useState(() => loadCampaignSetup())
  const [campaignReady, setCampaignReady] = useState(() => !user?.id)

  const setCampaign = useCallback(
    (next) => {
      setCampaignState((prev) => {
        const updated = typeof next === "function" ? next(prev) : next
        if (user?.id) {
          saveCampaignSetupToSupabase(user.id, updated)
        } else {
          saveCampaignSetup(updated)
        }
        return updated
      })
    },
    [user?.id]
  )

  useEffect(() => {
    if (!user?.id) {
      setCampaignReady(true)
      return
    }
    let cancelled = false
    setCampaignReady(false)
    loadCampaignSetupFromSupabase(user.id).then((setup) => {
      if (!cancelled) {
        setCampaignState(setup)
        setCampaignReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (location.state?.activeTab) setActiveTab(location.state.activeTab)
    if (location.state?.scrollTo) {
      requestAnimationFrame(() => {
        document.getElementById(location.state.scrollTo)?.scrollIntoView({ behavior: "smooth" })
      })
    }
  }, [location.state])

  const completeWizard = (curated) => {
    setIsCurated(curated)
    window.localStorage.setItem(WIZARD_KEY, curated ? "curated" : "blank")
    setCurrentStep("dashboard")
  }

  const rerunWizard = () => {
    window.localStorage.removeItem(WIZARD_KEY)
    setCurrentStep("wizard")
  }

  // ── Campaign builder helpers ──────────────────────────────
  const allowance = TIERS[campaign.tier].platforms

  const setTier = (tier) =>
    setCampaign((c) => ({ ...c, tier, platforms: c.platforms.slice(0, TIERS[tier].platforms) }))

  const togglePlatform = (id) =>
    setCampaign((c) => {
      if (c.platforms.includes(id)) return { ...c, platforms: c.platforms.filter((p) => p !== id) }
      if (c.platforms.length >= TIERS[c.tier].platforms) return c
      return { ...c, platforms: [...c.platforms, id] }
    })

  const onStartDate = (val) =>
    setCampaign((c) => {
      let end = c.endDate
      if (val && !c.endDate) {
        const d = new Date(val)
        d.setDate(d.getDate() + 60)
        end = d.toISOString().slice(0, 10)
      }
      return { ...c, startDate: val, endDate: end }
    })

  if (loading || !isAuthenticated) {
    return (
      <div style={styles.fullscreenContainer}>
        <div style={{ color: colors.textMuted }}>Loading…</div>
      </div>
    )
  }

  // ── STEP 1: ONBOARDING WIZARD ─────────────────────────────
  if (currentStep === "wizard") {
    return (
      <div style={styles.fullscreenContainer}>
        <div style={{ position: "fixed", top: "20px", right: "20px" }}>
          <ThemeToggle />
        </div>
        <div style={styles.wizardCard}>
          <h2 style={styles.wizardTitle}>NeonSox Onboarding</h2>
          <p style={styles.wizardText}>
            Would you like to auto-curate your dashboard data modules and display a campaign walkthrough?
          </p>
          <div style={styles.wizardButtonGroup}>
            <button
              onClick={() => completeWizard(true)}
              style={{ ...styles.wizardButton, background: colors.accent, color: "#06121c" }}
            >
              YES
            </button>
            <button
              onClick={() => completeWizard(false)}
              style={{ ...styles.wizardButton, background: colors.surfaceAlt, color: colors.text }}
            >
              NO
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: MAIN DASHBOARD (file folder, 2 tabs) ──────────
  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "palette", label: "Palette Schema", locked: profileReady && !hasCampaign },
  ]

  return (
    <div style={styles.dashboardContainer}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>
            <Wordmark size="1.45rem" />
            <span style={styles.brandPlatform}> PLATFORM</span>
          </h1>
          <p style={styles.statusSubtitle}>
            Mode: {isCurated ? "✨ Curated Walkthrough Active" : "📁 Blank Canvas Dashboard"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link to="/member" style={styles.navLink}>Home</Link>
          <Link to="/profile" style={styles.navLink}>Profile</Link>
          <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
          <Link to="/pricing" style={styles.navLink}>Pricing</Link>
          {isAdmin && <Link to="/admin" style={styles.navLink}>Admin</Link>}
          <button style={styles.rerunBtn} onClick={rerunWizard}>↻ Re-run setup</button>
          <button
            style={styles.rerunBtn}
            onClick={async () => { await signOut(); navigate("/") }}
          >
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* File-folder tabs */}
      <div style={styles.tabRow} role="tablist" aria-label="Dashboard sections">
        {tabs.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`dashboard-tab-${tab.key}`}
              aria-selected={active}
              aria-controls={`dashboard-panel-${tab.key}`}
              aria-disabled={tab.locked || undefined}
              onClick={() => !tab.locked && setActiveTab(tab.key)}
              style={{ ...styles.tab, ...(active ? styles.tabActive : styles.tabInactive) }}
            >
              {tab.label}
              {tab.locked && <span style={styles.lockPill} aria-hidden="true">🔒</span>}
              {tab.locked && <span className="sr-only"> (locked)</span>}
            </button>
          )
        })}
      </div>

      {/* Folder body */}
      <div style={styles.folderBody}>
        {/* TAB 1: DASHBOARD */}
        <div
          style={{ ...styles.grid, display: activeTab === "dashboard" ? "grid" : "none" }}
          role="tabpanel"
          id="dashboard-panel-dashboard"
          aria-labelledby="dashboard-tab-dashboard"
          hidden={activeTab !== "dashboard"}
        >
            {/* Campaign Feed */}
            <div style={{ ...styles.card, gridColumn: "span 2" }}>
              <div style={styles.feedHeader}>
                <h3 style={styles.cardTitle}>Campaign Feed</h3>
                <div style={styles.feedToggleGroup}>
                  {["personal", "industry", "trending"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFeedType(type)}
                      style={{ ...styles.feedToggleBtn, ...(feedType === type ? styles.activeFeedBtn : {}) }}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.feedContent}>
                <p style={{ color: colors.textMuted, margin: 0 }}>
                  {hasCampaign ? (
                    <>Streaming your <strong>{feedType}</strong> campaign feed.</>
                  ) : (
                    "No active campaign yet — start one to populate your feed."
                  )}
                </p>
              </div>
            </div>

            {/* Engagement Analytics */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Engagement Analytics</h3>
              <div style={styles.metricRow}>
                <div>
                  <div style={styles.metricBig}>84.2k</div>
                  <p style={styles.cardLabel}>Impressions</p>
                </div>
                <div>
                  <div style={styles.metricBig}>3.1k</div>
                  <p style={styles.cardLabel}>Clicks</p>
                </div>
              </div>
              <Sparkline colors={colors} />
              <p style={styles.cardFootnote}>Current or last active campaign</p>
            </div>

            {/* Industry Speedometer */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Industry Speedometer</h3>
              <Speedometer colors={colors} value={75} />
              <p style={styles.cardFootnote}>Driven by sentiment analysis</p>
            </div>

            {/* Messages */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Messages</h3>
              <div style={styles.listItem}>📩 Tier update validation token generated.</div>
              <div style={styles.listItem}>📩 Stripe webhook subscription verified.</div>
            </div>

            {/* Campaign Calendar */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Campaign Calendar</h3>
              <MiniCalendar colors={colors} />
            </div>

            {/* Trends */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Trends</h3>
              <div style={styles.listItem}># NeonLaunch</div>
              <div style={styles.listItem}># CreatorEconomy</div>
              <div style={styles.listItem}># GlowUpMarketing</div>
            </div>
        </div>

        {/* TAB 2: PALETTE SCHEMA — stay mounted so brief text is not lost on tab switch */}
        {!profileReady && activeTab === "palette" ? (
          <div style={styles.lockedState}>
            <p style={{ color: colors.textMuted, margin: 0 }}>Loading palette…</p>
          </div>
        ) : hasCampaign ? (
          <div
            style={{
              ...styles.paletteFormCard,
              display: activeTab === "palette" ? "block" : "none",
            }}
            role="tabpanel"
            id="dashboard-panel-palette"
            aria-labelledby="dashboard-tab-palette"
            hidden={activeTab !== "palette"}
          >
                <h3 style={styles.cardTitle}>Campaign Design Framework</h3>
                <p style={{ color: colors.textFaint, margin: "0 0 20px" }}>
                  Configure your campaign, choose platforms, and lock in your run.
                </p>

                <div style={styles.paletteCondensedBlock}>
                  {/* Row 1: Campaign Name · Start Date · End Date */}
                  <div style={styles.paletteRow}>
                    <div style={styles.compactField}>
                      <label style={styles.compactLabel} htmlFor="campaign-name">
                        Campaign Name
                      </label>
                      <input
                        id="campaign-name"
                        type="text"
                        placeholder="e.g. Summer Neon Festival"
                        style={{ ...styles.compactInput, width: "168px" }}
                        value={campaign.name}
                        onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                      />
                    </div>
                    <div style={styles.compactField}>
                      <label style={styles.compactLabel} htmlFor="start-date">
                        Start Date
                      </label>
                      <input
                        id="start-date"
                        type="date"
                        style={{ ...styles.compactInput, width: "138px" }}
                        value={campaign.startDate}
                        onChange={(e) => onStartDate(e.target.value)}
                      />
                    </div>
                    <div style={styles.compactField}>
                      <label style={styles.compactLabel} htmlFor="end-date">
                        End Date
                      </label>
                      <input
                        id="end-date"
                        type="date"
                        style={{ ...styles.compactInput, width: "138px" }}
                        value={campaign.endDate}
                        onChange={(e) => setCampaign({ ...campaign, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Row 2: Package tier · Primary Goal · Platforms */}
                  <div style={styles.paletteRow}>
                    <div style={styles.compactField}>
                      <label style={styles.compactLabel} htmlFor="package-tier">
                        Package tier
                      </label>
                      <select
                        id="package-tier"
                        style={{ ...styles.compactInput, width: "172px" }}
                        value={campaign.tier}
                        onChange={(e) => setTier(e.target.value)}
                      >
                        {Object.entries(TIERS).map(([key, t]) => (
                          <option key={key} value={key}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.compactField}>
                      <label style={styles.compactLabel} htmlFor="primary-goal">
                        Primary Goal
                      </label>
                      <select
                        id="primary-goal"
                        style={{ ...styles.compactInput, width: "128px" }}
                        value={campaign.goal}
                        onChange={(e) => setCampaign({ ...campaign, goal: e.target.value })}
                      >
                        {GOALS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.compactLabel}>Markets & languages</span>
                      <Link
                        to="/markets"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          border: `1px solid ${colors.accent}`,
                          background: colors.accentSoft,
                          color: colors.accent,
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          textDecoration: "none",
                        }}
                      >
                        Open market map →
                      </Link>
                      <p style={{ margin: "6px 0 0", fontSize: "0.72rem", color: colors.textFaint, maxWidth: "220px" }}>
                        {formatMarketSummary(campaign)}
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Platforms */}
                  <div style={styles.paletteRow}>
                    <div style={styles.compactPlatforms}>
                      <span style={styles.compactLabel}>
                        Platforms ({campaign.platforms.length}/{allowance})
                      </span>
                      <div style={styles.platformGrid}>
                        {PLATFORMS.map((p) => {
                          const on = campaign.platforms.includes(p.id)
                          const atCap = !on && campaign.platforms.length >= allowance
                          return (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => togglePlatform(p.id)}
                              disabled={atCap}
                              style={{
                                ...styles.platformChip,
                                ...(on ? styles.platformChipActive : {}),
                                ...(atCap ? styles.platformChipDisabled : {}),
                              }}
                            >
                              {on ? "✓ " : ""}{p.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div id="palette-editor">
                  {campaignReady ? (
                    <PaletteGenerationStudio
                      campaignSetup={campaign}
                      onBuyNewCampaign={() => navigate("/pricing")}
                      platforms={campaign.platforms}
                      platformAllowance={allowance}
                      onTogglePlatform={togglePlatform}
                    />
                  ) : (
                    <p style={{ color: colors.textMuted, margin: "16px 0 0" }}>Loading studio…</p>
                  )}
                </div>
          </div>
        ) : activeTab === "palette" ? (
          <div style={styles.lockedState}>
              <div style={styles.lockIconBig}>🔒</div>
              <h3 style={styles.cardTitle}>Palette Schema is locked</h3>
              <p style={{ color: colors.textMuted, maxWidth: "420px", margin: "0 auto 20px", lineHeight: 1.6 }}>
                The campaign builder activates once you purchase a campaign tier. Pick a tier to
                start designing and launching your campaign.
              </p>
              <button style={styles.checkoutSubmitBtn} onClick={() => navigate("/pricing")}>
                View Campaign Tiers
              </button>
            </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Small presentational widgets ────────────────────────────
function Sparkline({ colors }) {
  const pts = [8, 12, 9, 16, 14, 22, 18, 26, 24, 30]
  const max = Math.max(...pts)
  const w = 220
  const h = 44
  const step = w / (pts.length - 1)
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "44px", marginTop: "6px" }} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Speedometer({ colors, value }) {
  // Semi-circular gauge, needle rotates from -90deg (0%) to +90deg (100%).
  const angle = -90 + (value / 100) * 180
  const r = 52
  const cx = 60
  const cy = 60
  return (
    <div style={{ textAlign: "center", margin: "8px 0 4px" }}>
      <svg viewBox="0 0 120 70" style={{ width: "100%", maxWidth: "180px", height: "auto" }}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx - r * 0.5} ${cy - r * 0.866}`} fill="none" stroke="#ff4444" strokeWidth="8" strokeLinecap="round" />
        <path d={`M ${cx - r * 0.5} ${cy - r * 0.866} A ${r} ${r} 0 0 1 ${cx + r * 0.5} ${cy - r * 0.866}`} fill="none" stroke="#c8a23a" strokeWidth="8" />
        <path d={`M ${cx + r * 0.5} ${cy - r * 0.866} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={colors.accent} strokeWidth="8" strokeLinecap="round" />
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r + 8}
          stroke={colors.text}
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${angle} ${cx} ${cy})`}
          style={{ transition: "transform 0.6s ease" }}
        />
        <circle cx={cx} cy={cy} r="4" fill={colors.text} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: colors.textFaint }}>
        <span>Negative</span>
        <span style={{ color: colors.accent, fontWeight: 700 }}>{value}%</span>
      </div>
    </div>
  )
}

function MiniCalendar({ colors }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  const active = [9, 10, 11, 18, 24, 25] // mock scheduled days
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: "0.62rem", color: colors.textFaint, fontWeight: 700 }}>{d}</div>
        ))}
        {days.map((d) => {
          const on = active.includes(d)
          return (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: "0.68rem",
                padding: "3px 0",
                borderRadius: "4px",
                color: on ? "#06121c" : colors.textMuted,
                background: on ? colors.accent : "transparent",
                fontWeight: on ? 700 : 400,
              }}
            >
              {d}
            </div>
          )
        })}
      </div>
      <p style={{ color: colors.textFaint, fontSize: "0.74rem", margin: "10px 0 0" }}>6 scheduled posts this month</p>
    </div>
  )
}

// Theme-aware style factory.
function getStyles(colors) {
  return {
    fullscreenContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: colors.bg,
      backgroundImage: colors.bgGradient,
      padding: "20px",
    },
    wizardCard: {
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      padding: "40px",
      maxWidth: "520px",
      width: "100%",
      textAlign: "center",
      boxShadow: colors.shadow,
    },
    wizardTitle: { color: colors.text, margin: "0 0 16px" },
    wizardText: { color: colors.textMuted, margin: "0 0 28px", lineHeight: 1.5 },
    wizardButtonGroup: { display: "flex", gap: "12px", justifyContent: "center" },
    wizardButton: {
      padding: "12px 32px",
      fontSize: "0.95rem",
      fontWeight: 700,
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    },
    dashboardContainer: {
      minHeight: "100vh",
      background: colors.bg,
      backgroundImage: colors.bgGradient,
      color: colors.text,
      padding: "24px",
      boxSizing: "border-box",
    },
    header: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "20px",
      marginBottom: "24px",
    },
    brandTitle: {
      margin: "0 0 8px",
      fontSize: "1.5rem",
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "2px",
    },
    brandPlatform: {
      fontFamily: "'Orbitron', 'Exo 2', sans-serif",
      fontWeight: 800,
      letterSpacing: "2px",
      fontSize: "1.1rem",
      color: colors.textMuted,
    },
    statusSubtitle: { margin: 0, color: colors.textFaint, fontSize: "0.9rem" },
    rerunBtn: {
      background: "transparent",
      border: `1px solid ${colors.border}`,
      color: colors.textMuted,
      borderRadius: "8px",
      padding: "8px 14px",
      fontSize: "0.82rem",
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
    },
    navLink: {
      color: colors.textMuted,
      fontSize: "0.82rem",
      fontWeight: 600,
      textDecoration: "none",
    },

    // File-folder tabs
    tabRow: { display: "flex", gap: "8px", paddingLeft: "10px", position: "relative", zIndex: 2 },
    tab: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "12px 26px",
      fontSize: "0.95rem",
      fontWeight: 700,
      border: `1px solid ${colors.border}`,
      borderBottom: "none",
      borderRadius: "12px 12px 0 0",
      cursor: "pointer",
      position: "relative",
      top: "1px",
    },
    tabActive: {
      background: "#FFEB3B",
      color: "#000000",
      borderColor: "#FFEB3B",
      boxShadow: "0 -2px 14px rgba(255, 235, 59, 0.45)",
    },
    tabInactive: { background: colors.surfaceAlt, color: colors.textMuted },
    lockPill: { fontSize: "0.8rem" },

    // Folder body
    folderBody: {
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: "0 18px 18px 18px",
      padding: "24px",
      boxShadow: colors.shadow,
      minHeight: "360px",
    },

    grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" },
    card: {
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      padding: "20px",
    },
    feedHeader: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
    },
    cardTitle: { margin: "0 0 12px", fontSize: "1rem", fontWeight: 700, color: colors.text },
    feedToggleGroup: { display: "flex", gap: "6px" },
    feedToggleBtn: {
      padding: "6px 12px",
      fontSize: "0.75rem",
      fontWeight: 700,
      background: colors.surfaceAlt,
      border: "none",
      borderRadius: "6px",
      color: colors.textMuted,
      cursor: "pointer",
    },
    activeFeedBtn: { background: colors.accent, color: "#06121c" },
    feedContent: { padding: "16px", background: colors.surfaceAlt, borderRadius: "8px" },
    metricRow: { display: "flex", gap: "24px", marginBottom: "6px" },
    metricBig: { fontSize: "1.8rem", fontWeight: 800, color: colors.accent },
    cardLabel: { margin: 0, color: colors.textFaint, fontSize: "0.8rem" },
    cardFootnote: { margin: "10px 0 0", color: colors.textFaint, fontSize: "0.78rem", fontStyle: "italic" },
    listItem: {
      padding: "10px 0",
      borderBottom: `1px solid ${colors.border}`,
      fontSize: "0.9rem",
      color: colors.textMuted,
    },

    // Locked state
    lockedState: { textAlign: "center", padding: "48px 24px" },
    lockIconBig: { fontSize: "2.4rem", marginBottom: "12px" },

    // Palette builder
    paletteFormCard: { padding: "4px" },
    paletteCondensedBlock: {
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    paletteRow: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "10px 14px",
    },
    compactField: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      flex: "0 1 auto",
    },
    compactLabel: {
      fontSize: "0.8rem",
      color: colors.textFaint,
      fontWeight: 600,
      whiteSpace: "nowrap",
    },
    compactInput: {
      padding: "8px 10px",
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: "8px",
      color: colors.text,
      fontSize: "0.85rem",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    compactPlatforms: {
      display: "inline-flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "8px 10px",
      flex: "1 1 240px",
      minWidth: 0,
    },
    formGroup: { marginBottom: "18px" },
    label: { display: "block", marginBottom: "8px", fontSize: "0.85rem", color: colors.textFaint, fontWeight: 600 },
    input: {
      width: "100%",
      padding: "12px",
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: "8px",
      color: colors.text,
      fontSize: "0.95rem",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    platformGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
    platformChip: {
      padding: "6px 11px",
      borderRadius: "999px",
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      color: colors.textMuted,
      fontSize: "0.78rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    platformChipActive: { background: colors.accentSoft, color: colors.accent, borderColor: colors.accent },
    platformChipDisabled: { opacity: 0.4, cursor: "not-allowed" },
    checkoutSubmitBtn: {
      padding: "14px 22px",
      background: colors.accent,
      border: "none",
      borderRadius: "8px",
      color: "#06121c",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "0.95rem",
    },
  }
}
