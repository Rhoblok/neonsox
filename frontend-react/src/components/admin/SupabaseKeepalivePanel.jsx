import { useCallback, useEffect, useState } from "react"
import Card from "../Card"
import NeonButton from "../NeonButton"
import { useTheme } from "../../context/ThemeContext"
import { pingSupabaseKeepalive } from "../../lib/adminApi"

const LAST_FED_KEY = "neonsox-supabase-last-fed"

function readLastFed() {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(LAST_FED_KEY)
  } catch {
    return null
  }
}

/**
 * Admin: feed the Supabase free-tier "inactivity" pause detector.
 * Auto-runs on Admin open; manual button anytime.
 */
export default function SupabaseKeepalivePanel() {
  const { colors } = useTheme()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [lastFed, setLastFed] = useState(readLastFed)
  const [error, setError] = useState("")

  const feed = useCallback(async () => {
    setBusy(true)
    setError("")
    try {
      const body = await pingSupabaseKeepalive()
      setResult(body)
      if (body?.fedAt) {
        window.localStorage.setItem(LAST_FED_KEY, body.fedAt)
        setLastFed(body.fedAt)
      }
    } catch (err) {
      setError(err.message || "Ping failed")
      setResult(null)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    feed()
  }, [feed])

  const ok = result?.ok

  return (
    <Card>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1 1 240px" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.15rem", color: colors.text }}>
            Supa-Pulse
          </h2>
          <p style={{ margin: "0 0 8px", fontSize: "0.82rem", color: colors.textFaint, lineHeight: 1.5 }}>
            Feeds the free-tier inactivity detector (REST + Auth + profiles). Runs when you open Admin —
            and again whenever you sign in as admin.
          </p>
          <p style={{ margin: 0, fontSize: "0.78rem", color: colors.textMuted }}>
            Last fed:{" "}
            <strong style={{ color: ok === false ? "#ff8a8a" : colors.accent }}>
              {lastFed ? new Date(lastFed).toLocaleString() : "not yet"}
            </strong>
            {result?.projectRef ? ` · ${result.projectRef}` : ""}
            {result?.latencyMs != null ? ` · ${result.latencyMs}ms` : ""}
          </p>
          {result?.message && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: ok ? "#34d399" : "#ff8a8a",
              }}
            >
              {result.message}
            </p>
          )}
          {error && (
            <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#ff8a8a", fontWeight: 700 }}>
              {error}
            </p>
          )}
          {Array.isArray(result?.checks) && (
            <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px", fontSize: "0.72rem", color: colors.textFaint }}>
              {result.checks.map((c) => (
                <li key={c.name} style={{ color: c.ok ? colors.textMuted : "#ff8a8a" }}>
                  {c.ok ? "✓" : "✕"} {c.name}
                  {c.detail ? ` — ${c.detail}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        <NeonButton size="sm" onClick={feed} disabled={busy}>
          {busy ? "Pinging…" : "Ping"}
        </NeonButton>
      </div>
    </Card>
  )
}
