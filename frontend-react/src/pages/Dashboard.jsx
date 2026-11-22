import { useState, useEffect, useCallback } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { loadCampaignSetup, saveCampaignSetup } from "../lib/campaignSetupStorage"
import { loadCampaignSetupFromSupabase, saveCampaignSetupToSupabase, probeCampaignCloud } from "../lib/campaignSetupSync"
import { formatMarketSummary } from "../lib/marketCountries"
import ThemeToggle from "../components/ThemeToggle"
import Wordmark from "../components/Wordmark"
import PaletteGenerationStudio from "../components/palette/PaletteGenerationStudio"
import EditorTrayPanel from "../components/palette/EditorTrayPanel"
import GoogleTrendsPanel from "../components/palette/GoogleTrendsPanel"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { SOCIAL_PLATFORMS } from "../lib/socialPlatforms"
import { studioKeyFromSetup } from "../lib/paletteStudioStorage"
import { loadActivityLog, pushActivity } from "../lib/activityLogStorage"
import { fetchSocialStatus } from "../lib/socialApi"

const WIZARD_KEY = "neonsox-wizard"

const TIERS = {
  tier1: { label: "Tier 1 — $99 (60 days)", platforms: 2 },
  tier2: { label: "Tier 2 — $149 (60 days)", platforms: 3 },
  tier3: { label: "Tier 3 — $199 (60 days)", platforms: 4 },
}

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
  const [activeTab, setActiveTab] = useState("dashboard") // 'dashboard' | 'palette' | 'editor'
  const [feedType, setFeedType] = useState("personal")

  const [campaign, setCampaignState] = useState(() => loadCampaignSetup())
  const [campaignReady, setCampaignReady] = useState(() => !user?.id)
  const [campaignCloudMissing, setCampaignCloudMissing] = useState(false)
  const [activity, setActivity] = useState(() => loadActivityLog("global"))
  const [socialConfigured, setSocialConfigured] = useState({})

  const campaignKey = studioKeyFromSetup(campaign)

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
    function refreshActivity() {
      setActivity(loadActivityLog(campaignKey).length ? loadActivityLog(campaignKey) : loadActivityLog("global"))
    }
    refreshActivity()
    window.addEventListener("neonsox-activity-updated", refreshActivity)
    return () => window.removeEventListener("neonsox-activity-updated", refreshActivity)
  }, [campaignKey])

  useEffect(() => {
    fetchSocialStatus()
      .then((data) => setSocialConfigured(data?.configured || {}))
      .catch(() => setSocialConfigured({}))
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setCampaignReady(true)
      setCampaignCloudMissing(false)
      return
    }
    let cancelled = false
    setCampaignReady(false)
    probeCampaignCloud(user.id).then((probe) => {
      if (!cancelled) setCampaignCloudMissing(!!probe.missingTable)
    })
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

  const setTier = (tier) => {
    setCampaign((c) => ({ ...c, tier, platforms: c.platforms.slice(0, TIERS[tier].platforms) }))
    pushActivity(campaignKey, { type: "campaign", message: `Package tier set to ${TIERS[tier].label}.` })
  }

  const togglePlatform = (id) => {
    setCampaign((c) => {
      const removing = c.platforms.includes(id)
      if (removing) {
        pushActivity(campaignKey, {
          type: "social",
          message: `Removed ${id} from campaign platforms.`,
        })
        return { ...c, platforms: c.platforms.filter((p) => p !== id) }
      }
      if (c.platforms.length >= TIERS[c.tier].platforms) return c
      pushActivity(campaignKey, {
        type: "social",
        message: `Added ${id} to campaign platforms.`,
      })
      return { ...c, platforms: [...c.platforms, id] }
    })
  }

  const onStartDate = (val) => {
    setCampaign((c) => {
      let end = c.endDate
      if (val && !c.endDate) {
        const d = new Date(val)
        d.setDate(d.getDate() + 60)
        end = d.toISOString().slice(0, 10)
      }
      return { ...c, startDate: val, endDate: end }
    })
    if (val) {
      pushActivity(campaignKey, { type: "campaign", message: `Campaign start date set to ${val}.` })
    }
  }

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

  // ── STEP 2: MAIN DASHBOARD (file folder, 3 tabs) ──────────
  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "palette", label: "Palette Schema", locked: profileReady && !hasCampaign },
    { key: "editor", label: "Editing Bay", locked: profileReady && !hasCampaign },
  ]

  return (
    <div style={styles.dashboardContainer}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>
            <Wordmark size="1.45rem" />
          </h1>
          <p style={styles.statusSubtitle} title="Chosen during first-time setup. Curated = sample modules filled in for a guided tour. Blank = empty dashboard you fill yourself. Use Re-run setup to switch.">
            {isCurated
              ? "Setup: Guided walkthrough on (sample modules filled in)"
              : "Setup: Blank canvas (empty modules — fill as you go)"}
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

      {campaignCloudMissing && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,107,107,0.45)",
            background: "rgba(255,107,107,0.08)",
            color: colors.text,
            fontSize: "0.82rem",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#ff8a8a" }}>Campaign cloud backup not set up.</strong> Run{" "}
          <code style={{ fontSize: "0.78rem" }}>docs/supabase-campaigns.sql</code> in Supabase SQL
          Editor so tier, platforms, and markets sync across devices.
        </div>
      )}

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
              style={{
                ...styles.tab,
                ...(active ? styles.tabActive : styles.tabInactive),
                fontWeight: 900,
                ...(tab.key === "editor"
                  ? {
                      color: active ? "#06121c" : "#ffd640",
                      textShadow: active
                        ? "none"
                        : "0 0 8px rgba(255, 214, 64, 0.85), 0 0 18px rgba(255, 200, 0, 0.45)",
                      ...(active
                        ? {
                            background: "#ffd640",
                            boxShadow: "0 0 18px rgba(255, 214, 64, 0.7), 0 0 32px rgba(255, 200, 0, 0.35)",
                          }
                        : {
                            borderColor: "rgba(255, 214, 64, 0.55)",
                            boxShadow: "0 0 12px rgba(255, 214, 64, 0.25)",
                          }),
                    }
                  : active
                    ? {
                        textShadow: "0 0 10px rgba(255, 235, 59, 0.55)",
                        boxShadow: "0 0 16px rgba(255, 235, 59, 0.55), 0 -2px 14px rgba(255, 235, 59, 0.35)",
                      }
                    : {
                        color: colors.accent,
                        textShadow: `0 0 10px ${colors.glow}, 0 0 18px rgba(56, 189, 248, 0.35)`,
                        borderColor: "rgba(56, 189, 248, 0.35)",
                        boxShadow: "0 0 10px rgba(56, 189, 248, 0.15)",
                      }),
              }}
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
            <div style={styles.card}>
              <h3 style={{ ...styles.cardTitle, textAlign: "center" }}>Campaign Feed</h3>
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
              <h3 style={{ ...styles.cardTitle, textAlign: "center", margin: "0 0 6px" }}>Engagement Analytics</h3>
              <div style={{ ...styles.cardBody, display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ ...styles.metricRow, marginBottom: 0, flexShrink: 0 }}>
                  <div>
                    <div style={{ ...styles.metricBig, fontSize: "1.35rem" }}>84.2k</div>
                    <p style={styles.cardLabel}>Impressions</p>
                  </div>
                  <div>
                    <div style={{ ...styles.metricBig, fontSize: "1.35rem" }}>3.1k</div>
                    <p style={styles.cardLabel}>Clicks</p>
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: 0, width: "100%" }}>
                  <Sparkline colors={colors} />
                </div>
                <p style={{ ...styles.cardFootnote, margin: "2px 0 0", flexShrink: 0 }}>
                  Last 15 hours · cyan = impressions · amber = clicks
                </p>
              </div>
            </div>

            {/* Industry Speedometer */}
            <div style={styles.card}>
              <h3 style={{ ...styles.cardTitle, textAlign: "center" }}>Industry Speedometer</h3>
              <div style={styles.cardBody}>
                <Speedometer colors={colors} value={75} />
                <p style={styles.cardFootnote}>Driven by sentiment analysis</p>
              </div>
            </div>

            {/* Messages */}
            <div style={styles.card}>
              <h3 style={{ ...styles.cardTitle, textAlign: "center" }}>Messages</h3>
              <div style={styles.cardBody}>
                {activity.length === 0 ? (
                  <p style={{ margin: 0, color: colors.textFaint, fontSize: "0.82rem" }}>
                    No activity yet — save campaign setup, stitch, or export to see updates here.
                  </p>
                ) : (
                  activity.slice(0, 8).map((item) => (
                    <div key={item.id} style={styles.listItem}>
                      <span style={{ color: colors.textMuted }}>{item.message}</span>
                      <div style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: "2px" }}>
                        {new Date(item.at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Campaign Calendar */}
            <div style={styles.card}>
              <h3 style={{ ...styles.cardTitle, textAlign: "center" }}>Campaign Calendar</h3>
              <div style={styles.cardBody}>
                <MiniCalendar colors={colors} startDate={campaign.startDate} endDate={campaign.endDate} />
              </div>
            </div>

            {/* Google Trends */}
            <div style={styles.card}>
              <h3 style={{ ...styles.cardTitle, textAlign: "center" }}>Google Trends</h3>
              <div style={styles.cardBody}>
                <GoogleTrendsPanel />
              </div>
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
                <h3 style={{ ...styles.cardTitle, margin: "0 0 6px" }}>Campaign Design Framework</h3>
                <p style={{ color: colors.textFaint, margin: "0 0 10px", fontSize: "0.85rem" }}>
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
                          const connected = !!socialConfigured[p.id]
                          return (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => togglePlatform(p.id)}
                              disabled={atCap}
                              title={
                                on
                                  ? connected
                                    ? `${p.label} selected · connected`
                                    : `${p.label} selected · needs setup`
                                  : p.label
                              }
                              style={{
                                ...styles.platformChip,
                                ...(on ? styles.platformChipActive : {}),
                                ...(atCap ? styles.platformChipDisabled : {}),
                              }}
                            >
                              {on ? "✓ " : ""}
                              {p.label}
                              {on && (
                                <span
                                  style={{
                                    marginLeft: "4px",
                                    fontSize: "0.62rem",
                                    fontWeight: 800,
                                    color: connected ? "#34d399" : "#e8a04a",
                                  }}
                                >
                                  {connected ? "· connected" : "· needs setup"}
                                </span>
                              )}
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
        ) : activeTab === "editor" ? (
          <div style={styles.lockedState}>
              <div style={styles.lockIconBig}>🔒</div>
              <h3 style={styles.cardTitle}>Editing Bay is locked</h3>
              <p style={{ color: colors.textMuted, maxWidth: "420px", margin: "0 auto 20px", lineHeight: 1.6 }}>
                Purchase a campaign tier to stitch clips in the Cut Room, upload your own media, and export edits to the Socials Tray.
              </p>
              <button style={styles.checkoutSubmitBtn} onClick={() => navigate("/pricing")}>
                View Campaign Tiers
              </button>
            </div>
        ) : null}

        {/* TAB 3: EDITOR TRAY */}
        {hasCampaign && (
          <div
            style={{
              ...styles.paletteFormCard,
              display: activeTab === "editor" ? "block" : "none",
            }}
            role="tabpanel"
            id="dashboard-panel-editor"
            aria-labelledby="dashboard-tab-editor"
            hidden={activeTab !== "editor"}
          >
            <h3
              style={{
                ...styles.cardTitle,
                fontWeight: 900,
                fontSize: "0.95rem",
                letterSpacing: "0.04em",
                margin: "0 0 4px",
                color: "#ffd640",
                textShadow:
                  "0 0 8px rgba(255, 214, 64, 0.95), 0 0 18px rgba(255, 200, 0, 0.7)",
              }}
            >
              Editing Bay
            </h3>
            {campaignReady ? (
              <EditorTrayPanel campaignSetup={campaign} />
            ) : (
              <p style={{ color: colors.textMuted, margin: 0 }}>Loading editor…</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Small presentational widgets ────────────────────────────
function Sparkline({ colors }) {
  // Hourly sample — shorter window, more jumps so the line reads as live.
  const impressions = [12, 28, 18, 42, 22, 55, 31, 48, 19, 62, 35, 71, 40, 58, 26, 66]
  const clicks = [4, 9, 6, 14, 7, 18, 10, 16, 5, 21, 11, 24, 13, 19, 8, 22]
  const xLabels = ["0h", "3h", "6h", "9h", "12h", "15h"]
  const yTicks = [0, 25, 50, 75]

  const pad = { top: 8, right: 6, bottom: 24, left: 30 }
  const w = 320
  const h = 220
  const plotW = w - pad.left - pad.right
  const plotH = h - pad.top - pad.bottom
  const maxY = 75
  const n = impressions.length
  const barGap = 2
  const barW = Math.max(4, plotW / n - barGap)

  const xAt = (i) => pad.left + (i / (n - 1)) * plotW
  const yAt = (v) => pad.top + plotH - (v / maxY) * plotH

  const linePath = (pts) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p).toFixed(1)}`).join(" ")

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="none"
      role="img"
      aria-label="Engagement over the last 15 hours"
    >
      {/* Subtle grid */}
      {yTicks.map((t) => (
        <line
          key={`g-${t}`}
          x1={pad.left}
          y1={yAt(t)}
          x2={w - pad.right}
          y2={yAt(t)}
          stroke={colors.border}
          strokeWidth="1"
          opacity="0.45"
        />
      ))}

      {/* Soft background bars (impressions) */}
      {impressions.map((v, i) => {
        const x = pad.left + (i / n) * plotW + barGap / 2
        const barH = (v / maxY) * plotH
        return (
          <rect
            key={`bar-${i}`}
            x={x}
            y={yAt(v)}
            width={barW}
            height={Math.max(1, barH)}
            rx="1.5"
            fill={colors.accent}
            opacity="0.14"
          />
        )
      })}

      {/* Y axis */}
      <line
        x1={pad.left}
        y1={pad.top}
        x2={pad.left}
        y2={pad.top + plotH}
        stroke={colors.textFaint}
        strokeWidth="1.25"
      />
      {yTicks.map((t) => (
        <g key={`y-${t}`}>
          <line
            x1={pad.left - 3}
            y1={yAt(t)}
            x2={pad.left}
            y2={yAt(t)}
            stroke={colors.textFaint}
            strokeWidth="1"
          />
          <text
            x={pad.left - 6}
            y={yAt(t) + 3}
            textAnchor="end"
            fill={colors.textFaint}
            fontSize="9"
            fontFamily="inherit"
          >
            {t}
          </text>
        </g>
      ))}

      {/* X axis */}
      <line
        x1={pad.left}
        y1={pad.top + plotH}
        x2={w - pad.right}
        y2={pad.top + plotH}
        stroke={colors.textFaint}
        strokeWidth="1.25"
      />
      {xLabels.map((label, i) => {
        const idx = Math.round((i / (xLabels.length - 1)) * (n - 1))
        return (
          <g key={`x-${label}`}>
            <line
              x1={xAt(idx)}
              y1={pad.top + plotH}
              x2={xAt(idx)}
              y2={pad.top + plotH + 3}
              stroke={colors.textFaint}
              strokeWidth="1"
            />
            <text
              x={xAt(idx)}
              y={h - 6}
              textAnchor="middle"
              fill={colors.textFaint}
              fontSize="9"
              fontFamily="inherit"
            >
              {label}
            </text>
          </g>
        )
      })}

      {/* Clicks line (secondary, quieter) */}
      <path
        d={linePath(clicks)}
        fill="none"
        stroke="#e8a04a"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Impressions line */}
      <path
        d={linePath(impressions)}
        fill="none"
        stroke={colors.accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function MiniCalendar({ colors, startDate, endDate }) {
  const start = startDate ? new Date(`${startDate}T12:00:00`) : null
  const end = endDate ? new Date(`${endDate}T12:00:00`) : null
  const hasRange =
    start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start

  const initial = hasRange
    ? { y: start.getFullYear(), m: start.getMonth() }
    : { y: new Date().getFullYear(), m: new Date().getMonth() }

  const [view, setView] = useState(initial)

  // When campaign dates change, jump the view to the start month
  useEffect(() => {
    if (!hasRange) return
    setView({ y: start.getFullYear(), m: start.getMonth() })
  }, [startDate, endDate]) // eslint-disable-line react-hooks/exhaustive-deps -- intentional: jump on date string change

  const year = view.y
  const month = view.m
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay() // 0 = Sun
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function inRange(day) {
    if (!hasRange || day == null) return false
    const d = new Date(year, month, day, 12)
    const a = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12)
    const b = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12)
    return d >= a && d <= b
  }

  const daysThisMonth = cells.filter((d) => d != null && inRange(d)).length
  const totalCampaignDays = hasRange
    ? Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
    : 0
  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  })

  function shiftMonth(delta) {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "6px",
          marginBottom: "6px",
        }}
      >
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          style={calNavBtn(colors)}
        >
          ‹
        </button>
        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: colors.textFaint }}>
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          style={calNavBtn(colors)}
        >
          ›
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            style={{ textAlign: "center", fontSize: "0.62rem", color: colors.textFaint, fontWeight: 700 }}
          >
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const on = inRange(d)
          return (
            <div
              key={`${year}-${month}-${i}`}
              style={{
                textAlign: "center",
                fontSize: "0.68rem",
                padding: "3px 0",
                borderRadius: "4px",
                color: d == null ? "transparent" : on ? "#06121c" : colors.textMuted,
                background: on ? colors.accent : "transparent",
                fontWeight: on ? 700 : 400,
                minHeight: "18px",
              }}
            >
              {d ?? ""}
            </div>
          )
        })}
      </div>
      <p style={{ color: colors.textFaint, fontSize: "0.74rem", margin: "10px 0 0", lineHeight: 1.4 }}>
        {hasRange ? (
          <>
            Campaign window: <strong style={{ color: colors.textMuted }}>{startDate}</strong>
            {" → "}
            <strong style={{ color: colors.textMuted }}>{endDate}</strong>
            {" · "}
            {totalCampaignDays} days total
            {daysThisMonth > 0
              ? ` · ${daysThisMonth} shown this month`
              : " · use ‹ › to open Aug / Sep / Oct"}
          </>
        ) : (
          "Set start & end dates in Palette Schema to light up the calendar."
        )}
      </p>
    </div>
  )
}

function calNavBtn(colors) {
  return {
    width: "24px",
    height: "24px",
    padding: 0,
    borderRadius: "6px",
    border: `1px solid ${colors.border}`,
    background: colors.surfaceAlt || colors.bg,
    color: colors.accent,
    fontWeight: 900,
    fontSize: "1rem",
    lineHeight: "22px",
    cursor: "pointer",
  }
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
      boxShadow: "0 0 16px rgba(255, 235, 59, 0.55), 0 -2px 14px rgba(255, 235, 59, 0.4)",
      fontWeight: 900,
    },
    tabInactive: {
      background: colors.surfaceAlt,
      color: colors.accent,
      fontWeight: 800,
    },
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

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gridAutoRows: "400px",
      gap: "14px",
      alignItems: "stretch",
    },
    card: {
      background: colors.bg,
      border: `1px solid rgba(56, 189, 248, 0.22)`,
      borderRadius: "12px",
      padding: "16px",
      boxShadow: `0 0 14px rgba(56, 189, 248, 0.14), 0 0 28px rgba(56, 189, 248, 0.06)`,
      height: "400px",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      overflow: "hidden",
    },
    cardBody: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
    },
    feedHeader: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      marginBottom: "12px",
    },
    cardTitle: {
      margin: "0 0 12px",
      fontSize: "1.05rem",
      fontWeight: 900,
      letterSpacing: "0.03em",
      color: colors.text,
      textAlign: "center",
      textShadow: `0 0 12px ${colors.glow}, 0 0 24px rgba(56, 189, 248, 0.35)`,
    },
    feedToggleGroup: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: "6px",
      marginBottom: "12px",
    },
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
    activeFeedBtn: {
      background: colors.accent,
      color: "#06121c",
      boxShadow: `0 0 10px ${colors.glow}`,
    },
    feedContent: {
      flex: 1,
      padding: "14px",
      background: colors.surfaceAlt,
      borderRadius: "8px",
      boxShadow: `0 0 12px rgba(56, 189, 248, 0.12)`,
    },
    metricRow: { display: "flex", gap: "24px", marginBottom: "6px", justifyContent: "center" },
    metricBig: {
      fontSize: "1.8rem",
      fontWeight: 900,
      color: colors.accent,
      textShadow: `0 0 12px ${colors.glow}`,
    },
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
      border: `1px solid rgba(56, 189, 248, 0.28)`,
      borderRadius: "12px",
      padding: "10px 12px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      width: "fit-content",
      maxWidth: "100%",
      marginBottom: "4px",
      boxShadow: `0 0 12px rgba(56, 189, 248, 0.18), 0 0 28px rgba(56, 189, 248, 0.08)`,
    },
    paletteRow: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "8px 12px",
    },
    compactField: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      flex: "0 1 auto",
    },
    compactLabel: {
      fontSize: "0.78rem",
      color: colors.textFaint,
      fontWeight: 600,
      whiteSpace: "nowrap",
    },
    compactInput: {
      padding: "7px 9px",
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: "8px",
      color: colors.text,
      fontSize: "0.82rem",
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
