import { useTheme } from "../../context/ThemeContext"
import { getStylePreset } from "../../lib/stylePresets"

const STATUS_LABEL = {
  pending: "Generating…",
  succeeded: "Ready",
  failed: "Try Failed",
}

export default function GenerationCard({ generation, stylePresetId, onOpen }) {
  const { colors } = useTheme()
  const preset = getStylePreset(stylePresetId)
  const thumbBg = preset?.gradient || `linear-gradient(135deg, ${colors.surfaceAlt}, ${colors.bg})`

  const statusColor =
    generation.status === "succeeded"
      ? colors.accent
      : generation.status === "failed"
        ? "#ff8a8a"
        : colors.textFaint

  const clickable = generation.status === "succeeded"

  return (
    <button
      type="button"
      onClick={clickable ? () => onOpen(generation) : undefined}
      disabled={!clickable}
      style={{
        textAlign: "left",
        padding: 0,
        border: `1px solid ${colors.border}`,
        borderRadius: "10px",
        background: colors.bg,
        cursor: clickable ? "pointer" : "default",
        overflow: "hidden",
        width: "100%",
        opacity: generation.status === "pending" ? 0.85 : 1,
      }}
    >
      <div
        style={{
          height: "100px",
          background: thumbBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {generation.status === "pending" ? "…" : generation.status === "succeeded" ? "▶ Preview" : "✕"}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: statusColor }}>
            {STATUS_LABEL[generation.status] || generation.status}
          </span>
          <span style={{ fontSize: "0.72rem", color: colors.textFaint }}>Try #{generation.retryIndex}</span>
        </div>
        {generation.refunded && (
          <p style={{ margin: "0 0 6px", fontSize: "0.72rem", fontWeight: 600, color: colors.accent }}>
            No try used
          </p>
        )}
        {generation.costUSD != null && generation.costUSD > 0 && (
          <div style={{ fontSize: "0.72rem", color: colors.textMuted }}>
            ${generation.costUSD.toFixed(2)} · {generation.costCredits} credits
            {generation.audioEnabled ? " · audio" : " · no audio"}
          </div>
        )}
        {generation.status === "failed" && generation.error && !generation.refunded && (
          <p style={{ margin: "8px 0 0", fontSize: "0.72rem", color: "#ff8a8a", lineHeight: 1.4 }}>
            {generation.error}
          </p>
        )}
        {generation.status === "failed" && generation.refunded && (
          <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: colors.textMuted, lineHeight: 1.4 }}>
            Your try was restored — generate again.
          </p>
        )}
        <div style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: "6px" }}>
          {new Date(generation.createdAt).toLocaleString()}
        </div>
      </div>
    </button>
  )
}
