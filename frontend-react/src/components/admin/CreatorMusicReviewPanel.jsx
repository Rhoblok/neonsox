import { useTheme } from "../../context/ThemeContext"

/**
 * Self-serve creator uploads paused — founder approves custom beds by email.
 * Review API remains for later; this panel explains the current policy.
 */
export default function CreatorMusicReviewPanel() {
  const { colors } = useTheme()

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "16px",
        borderRadius: "12px",
        border: `1px solid ${colors.border}`,
        background: colors.surfaceAlt || colors.bg,
      }}
    >
      <h2 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 900, color: colors.text }}>
        Creator Music Review
      </h2>
      <p style={{ margin: 0, fontSize: "0.82rem", color: colors.textMuted, lineHeight: 1.5 }}>
        Self-serve uploads are <strong style={{ color: colors.text }}>paused</strong>. Non-creators use the
        NEONSOX library only. If someone emails a custom bed request, approve it manually into their /
        the shared library (admin upload in Editing Bay still works for you).
      </p>
      <p style={{ margin: "8px 0 0", fontSize: "0.72rem", color: colors.textFaint }}>
        AudD fingerprint gating is on hold (trial ends soon). Re-enable self-serve + review queue when
        you’re ready for contributors.
      </p>
    </div>
  )
}
