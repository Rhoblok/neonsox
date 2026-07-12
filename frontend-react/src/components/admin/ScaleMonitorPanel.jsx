import { useCallback, useEffect, useState } from "react"
import Card from "../Card"
import NeonButton from "../NeonButton"
import { useTheme } from "../../context/ThemeContext"
import { fetchScaleMonitor } from "../../lib/adminApi"
import {
  confirmUpgrade,
  getConfirmedAt,
  getStepsDoneMap,
  setStepDone,
} from "../../lib/scaleMonitorStorage"

const LEVEL_META = {
  ok: { label: "Under threshold", dot: "#3dd68c", blink: false },
  watch: { label: "Time to plan", dot: "#f0b429", blink: true },
  overdue: { label: "Upgrade NOW", dot: "#ff6b6b", blink: true },
}

function displayLevel(service, confirmedAt) {
  if (confirmedAt) return "ok"
  return service.level
}

function levelStyle(level) {
  switch (level) {
    case "overdue":
      return { border: "#ff6b6b", bg: "rgba(255,107,107,0.12)", text: "#ff8a8a", blink: true }
    case "watch":
      return { border: "#f0b429", bg: "rgba(240,180,41,0.12)", text: "#f0c14b", blink: true }
    default:
      return { border: "#3dd68c", bg: "rgba(61,214,140,0.08)", text: "#3dd68c", blink: false }
  }
}

function StatusDot({ level, confirmedAt, blink }) {
  const meta = LEVEL_META[level] || LEVEL_META.ok
  const color = confirmedAt ? "#3dd68c" : meta.dot
  const shouldBlink = !confirmedAt && (blink || meta.blink)

  return (
    <span
      title={confirmedAt ? "Upgrade confirmed" : meta.label}
      style={{
        display: "inline-block",
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        boxShadow: shouldBlink ? `0 0 8px ${color}` : "none",
        animation: shouldBlink ? "scale-monitor-blink 1.1s ease-in-out infinite" : "none",
      }}
    />
  )
}

function StatPill({ label, value, colors, accent }) {
  return (
    <div
      style={{
        flex: "1 1 120px",
        padding: "12px 14px",
        borderRadius: "10px",
        border: `1px solid ${accent ? colors.accent : colors.border}`,
        background: accent ? colors.accentSoft : colors.surfaceAlt,
      }}
    >
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.textFaint, marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.45rem", fontWeight: 800, color: accent ? colors.accent : colors.text }}>
        {value}
      </div>
    </div>
  )
}

function PlaybookStep({ step, done, active, colors, onToggle }) {
  const shouldBlink = active && !done

  return (
    <button
      type="button"
      onClick={() => onToggle(step.number, !done)}
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: "8px",
        border: `1px solid ${shouldBlink ? colors.accent : done ? "#3dd68c" : colors.border}`,
        background: shouldBlink ? colors.accentSoft : done ? "rgba(61,214,140,0.08)" : colors.bg,
        cursor: "pointer",
        animation: shouldBlink ? "scale-monitor-blink 1.1s ease-in-out infinite" : "none",
      }}
    >
      <span
        style={{
          fontSize: "0.72rem",
          fontWeight: 800,
          color: done ? "#3dd68c" : shouldBlink ? colors.accent : colors.textFaint,
          minWidth: "72px",
          flexShrink: 0,
        }}
      >
        {done ? "✓ DONE" : `STEP ${step.number}`}
      </span>
      <span style={{ fontSize: "0.82rem", color: colors.text, lineHeight: 1.45 }}>{step.text}</span>
    </button>
  )
}

function ServiceRow({ service, colors, onStorageChange }) {
  const [open, setOpen] = useState(false)
  const confirmedAt = getConfirmedAt(service)
  const level = displayLevel(service, confirmedAt)
  const lc = levelStyle(level)
  const meta = LEVEL_META[level] || LEVEL_META.ok
  const stepsDone = getStepsDoneMap(service)
  const steps = service.steps || []
  const firstOpenStep = steps.find((s) => !stepsDone[s.number])?.number ?? null

  const handleConfirm = () => {
    confirmUpgrade(service)
    onStorageChange()
  }

  const handleStepToggle = (num, done) => {
    setStepDone(service, num, done)
    onStorageChange()
  }

  return (
    <div
      style={{
        borderRadius: "10px",
        border: `1px solid ${lc.border}`,
        background: lc.bg,
        overflow: "hidden",
        animation: lc.blink && !confirmedAt ? "scale-monitor-blink 1.1s ease-in-out infinite" : "none",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <StatusDot level={service.level} confirmedAt={confirmedAt} blink={meta.blink} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: colors.textFaint, textTransform: "uppercase" }}>
            {service.category}
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: colors.text }}>{service.name}</div>
          <div style={{ fontSize: "0.78rem", color: colors.textMuted, marginTop: "2px" }}>
            {confirmedAt
              ? `✓ Upgrade confirmed ${new Date(confirmedAt).toLocaleDateString()}`
              : service.message}
          </div>
        </div>
        <span style={{ color: lc.text, fontWeight: 800, fontSize: "0.78rem", flexShrink: 0 }}>
          {confirmedAt ? "✓ Confirmed" : meta.label} {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: "0 16px 16px",
            borderTop: `1px solid ${colors.border}`,
            background: colors.bg,
          }}
        >
          <p
            style={{
              margin: "14px 0 12px",
              fontSize: "0.88rem",
              fontWeight: 700,
              color: colors.accent,
              lineHeight: 1.5,
            }}
          >
            {service.playbookSummary || "Follow these steps exactly:"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            {steps.map((step) => (
              <PlaybookStep
                key={step.number}
                step={step}
                done={!!stepsDone[step.number]}
                active={firstOpenStep === step.number && !confirmedAt && service.level !== "ok"}
                colors={colors}
                onToggle={handleStepToggle}
              />
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "0.75rem", color: colors.textFaint, marginBottom: "12px" }}>
            <span>
              Plan: <strong style={{ color: colors.text }}>{service.currentPlan}</strong>
            </span>
            {service.nextPlan && (
              <span>
                Next: <strong style={{ color: colors.text }}>{service.nextPlan}</strong>
              </span>
            )}
            {service.upgradeAtSubs != null && (
              <span>
                Threshold: <strong style={{ color: colors.text }}>{service.upgradeAtSubs.toLocaleString()} members</strong>
              </span>
            )}
            {service.spendThresholdUsd != null && (
              <span>
                Budget limit: <strong style={{ color: colors.text }}>${service.spendThresholdUsd}/mo</strong>
              </span>
            )}
          </div>

          {!confirmedAt && service.level !== "ok" && (
            <NeonButton size="sm" onClick={handleConfirm}>
              ✓ CONFIRM UPGRADE COMPLETE
            </NeonButton>
          )}

          {confirmedAt && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #3dd68c",
                background: "rgba(61,214,140,0.1)",
                color: "#3dd68c",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              ✓ Upgrade complete — confirmed {new Date(confirmedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ScaleMonitorPanel() {
  const { colors } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [storageTick, setStorageTick] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchScaleMonitor()
      setData(result)
    } catch (err) {
      setError(err.message || "Could not load Scale Monitor.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const needsAttention =
    data &&
    data.services.some((s) => {
      const level = displayLevel(s, getConfirmedAt(s))
      return level === "overdue" || level === "watch"
    })

  const unconfirmedAlerts = data
    ? data.services.filter((s) => !getConfirmedAt(s) && s.level !== "ok").length
    : 0

  return (
    <Card highlight={needsAttention} style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.25rem", color: colors.text }}>Scale Monitor</h2>
          <p style={{ margin: "0 0 8px", color: colors.textFaint, fontSize: "0.85rem", maxWidth: "620px", lineHeight: 1.5 }}>
            <span style={{ color: "#3dd68c" }}>● Green</span> = under threshold ·{" "}
            <span style={{ color: "#f0b429" }}>● Yellow blink</span> = 75%+ of next threshold, time to plan ·{" "}
            <span style={{ color: "#ff6b6b" }}>● Red blink</span> = at or past threshold, upgrade NOW
          </p>
          <p style={{ margin: 0, color: colors.textFaint, fontSize: "0.82rem" }}>
            Click any service for exact step-by-step instructions. Confirm when done — saved in this browser.
          </p>
        </div>
        <NeonButton variant="ghost" size="sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </NeonButton>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "8px",
            background: "rgba(255,107,107,0.12)",
            color: "#ff8a8a",
            fontSize: "0.85rem",
            marginBottom: "14px",
          }}
        >
          {error}
        </div>
      )}

      {loading && !data && !error && (
        <p style={{ color: colors.textMuted, fontSize: "0.85rem" }}>Loading subscriber counts…</p>
      )}

      {data && (
        <>
          {unconfirmedAlerts > 0 && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #ff6b6b",
                background: "rgba(255,107,107,0.12)",
                color: "#ff8a8a",
                fontWeight: 700,
                fontSize: "0.88rem",
                marginBottom: "16px",
                animation: "scale-monitor-blink 1.1s ease-in-out infinite",
              }}
            >
              {unconfirmedAlerts} service{unconfirmedAlerts === 1 ? "" : "s"} need your attention — open each one and
              follow the steps.
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <StatPill label="Paying members" value={data.counts.members.toLocaleString()} colors={colors} accent />
            <StatPill label="Campaign buyers" value={data.counts.campaignBuyers.toLocaleString()} colors={colors} />
            <StatPill label="Total sign-ups" value={data.counts.totalProfiles.toLocaleString()} colors={colors} />
            <StatPill
              label="Est. campaigns / mo"
              value={data.projections.effectiveCampaignsPerMonth.toLocaleString()}
              colors={colors}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.78rem",
                color: colors.textFaint,
                marginBottom: "6px",
              }}
            >
              <span>
                Milestone: {data.milestone.previous.toLocaleString()} → {data.milestone.next.toLocaleString()} members
              </span>
              <span>{data.milestone.progressPercent}%</span>
            </div>
            <div
              style={{
                height: "10px",
                borderRadius: "999px",
                background: colors.surfaceAlt,
                border: `1px solid ${colors.border}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${data.milestone.progressPercent}%`,
                  background: colors.accent,
                  borderRadius: "999px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
            {data.services.map((service) => (
              <ServiceRow
                key={`${service.id}-${storageTick}`}
                service={service}
                colors={colors}
                onStorageChange={() => setStorageTick((n) => n + 1)}
              />
            ))}
          </div>

          <p style={{ margin: 0, fontSize: "0.72rem", color: colors.textFaint, lineHeight: 1.5 }}>
            Projections use your cost model (35% campaign attach rate, ~3.5 video gens per campaign, ~100 posts per
            campaign). Confirmations persist in this browser until the next threshold. Last updated{" "}
            {new Date(data.generatedAt).toLocaleString()}.
          </p>
        </>
      )}

      <style>{`
        @keyframes scale-monitor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </Card>
  )
}
