import { useEffect, useState } from "react"
import { useTheme } from "../../context/ThemeContext"

function formatElapsed(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function waitMessage(seconds) {
  if (seconds < 30) return "Sending your ad details…"
  if (seconds < 90) return "Creating your video…"
  if (seconds < 180) return "Still working — this can take a few minutes."
  return "Almost there — thanks for waiting."
}

export default function GenerationStatusPanel({ generating, generateStartedAt, generations }) {
  const { colors } = useTheme()
  const pending = generations.some((g) => g.status === "pending")
  const isActive = generating || pending

  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isActive || !generateStartedAt) {
      setElapsed(0)
      return undefined
    }
    const tick = () => setElapsed(Math.floor((Date.now() - generateStartedAt) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isActive, generateStartedAt])

  const readyCount = generations.filter((g) => g.status === "succeeded").length

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        padding: "14px 16px",
        background: colors.bg,
        height: "100%",
        minHeight: "320px",
        display: "flex",
        flexDirection: "column",
        justifyContent: isActive ? "flex-start" : "center",
      }}
    >
      {isActive ? (
        <>
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: colors.accent,
              marginBottom: "6px",
              animation: "palette-pulse 1.4s ease infinite",
            }}
          >
            Making your clip…
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: colors.text,
              fontVariantNumeric: "tabular-nums",
              marginBottom: "8px",
            }}
          >
            {formatElapsed(elapsed)}
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: colors.textMuted, lineHeight: 1.5 }}>
            {waitMessage(elapsed)}
          </p>
          <p style={{ margin: "10px 0 0", fontSize: "0.75rem", color: colors.textFaint }}>
            Usually <strong style={{ color: colors.textMuted }}>2–5 minutes</strong>. Keep this tab open.
          </p>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "12px 8px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{readyCount > 0 ? "🎬" : "✨"}</div>
          <div style={{ fontWeight: 700, color: colors.text, marginBottom: "6px" }}>
            {readyCount > 0 ? `${readyCount} clip${readyCount === 1 ? "" : "s"} ready` : "Ready when you are"}
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: colors.textMuted, lineHeight: 1.5 }}>
            {readyCount > 0
              ? "Your clips are in the tray below — tap one to watch."
              : "Fill in the brief, pick a style, then hit Generate Video."}
          </p>
        </div>
      )}
      <style>{`@keyframes palette-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }`}</style>
    </div>
  )
}
