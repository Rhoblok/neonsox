import { useTheme } from "../../context/ThemeContext"

export default function RemainingTriesBadge({ remaining, total, locked, loading, highlight }) {
  const { colors } = useTheme()
  const tone = locked ? "#ff6b6b" : remaining <= 1 ? "#c8a23a" : colors.accent

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        borderRadius: "999px",
        border: `1px solid ${highlight ? colors.accent : locked ? "rgba(255,107,107,0.45)" : colors.border}`,
        background: highlight ? colors.accentSoft : locked ? "rgba(255,107,107,0.08)" : colors.surfaceAlt,
        fontSize: "0.78rem",
        fontWeight: 700,
        color: locked ? "#ff8a8a" : colors.text,
        transition: "border-color 0.3s, background 0.3s, box-shadow 0.3s",
        boxShadow: highlight ? `0 0 14px ${colors.accent}55` : "none",
        animation: highlight ? "triesRestoredPulse 0.9s ease 3" : "none",
        opacity: loading ? 0.72 : 1,
      }}
    >
      <style>{`
        @keyframes triesRestoredPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: highlight ? colors.accent : tone,
          boxShadow: locked && !highlight ? "none" : `0 0 8px ${highlight ? colors.accent : tone}`,
        }}
      />
      {loading ? "Loading…" : locked ? "No tries left" : `${remaining} of ${total} tries left`}
    </div>
  )
}
