import { Link } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"

const CONTACT_EMAIL = "ceo@neonsox.com"

/**
 * Self-serve creator uploads are paused.
 * Subscribers use the NEONSOX library; custom beds are handled by email + admin.
 */
export default function CreatorMusicPanel() {
  const { colors } = useTheme()

  return (
    <div
      style={{
        marginTop: "28px",
        padding: "18px 16px",
        borderRadius: "12px",
        border: `1px solid ${colors.border}`,
        background: colors.surfaceAlt || colors.surface,
      }}
    >
      <h2 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 900, color: colors.text }}>
        Music for your ads
      </h2>
      <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: colors.textMuted, lineHeight: 1.55 }}>
        NEONSOX is built for non-creator businesses first. In Editing Bay, music comes from the{" "}
        <strong style={{ color: colors.text }}>licensed NEONSOX library</strong> so your ads stay clear for
        publishing.
      </p>
      <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: colors.textMuted, lineHeight: 1.55 }}>
        Want your own original bed in <em>your</em> library? Email us — we’ll review and approve it for your
        account. Self-serve uploads are paused for now.
      </p>
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("NEONSOX — custom music bed request")}`}
        style={{
          display: "inline-block",
          padding: "8px 14px",
          borderRadius: "8px",
          border: `1px solid ${colors.accent}`,
          background: colors.accentSoft,
          color: colors.accent,
          fontWeight: 800,
          fontSize: "0.82rem",
          textDecoration: "none",
        }}
      >
        Email {CONTACT_EMAIL}
      </a>
      <p style={{ margin: "12px 0 0", fontSize: "0.72rem", color: colors.textFaint, lineHeight: 1.4 }}>
        Or post/export with music on the platform you already use. See{" "}
        <Link to="/terms" style={{ color: colors.accent, fontWeight: 700 }}>
          Terms
        </Link>{" "}
        · Creator Music notes for later.
      </p>
    </div>
  )
}
