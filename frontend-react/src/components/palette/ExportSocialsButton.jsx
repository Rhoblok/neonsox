import { useTheme } from "../../context/ThemeContext"

const CYAN = "#00d4ff"

export default function ExportSocialsButton({ ready, exported, onExport }) {
  const { colors } = useTheme()
  const active = ready && !exported

  return (
    <div style={{ marginTop: "10px" }}>
      <button
        type="button"
        disabled={!active}
        onClick={onExport}
        style={{
          padding: "10px 16px",
          borderRadius: "8px",
          border: `2px solid ${active ? CYAN : exported ? colors.accent : colors.border}`,
          background: active ? "rgba(0,212,255,0.12)" : exported ? colors.accentSoft : colors.surfaceAlt,
          color: active ? CYAN : exported ? colors.accent : colors.textMuted,
          fontWeight: 800,
          fontSize: "0.75rem",
          letterSpacing: "0.03em",
          cursor: active ? "pointer" : "default",
          boxShadow: active ? "0 0 16px rgba(0,212,255,0.55), 0 0 32px rgba(0,212,255,0.2)" : "none",
          animation: active ? "export-socials-blink 1.15s ease-in-out infinite" : "none",
          opacity: ready || exported ? 1 : 0.55,
        }}
      >
        {exported ? "✓ IN SOCIALS TRAY" : "EXPORT TO SOCIALS TRAY"}
      </button>
      {!ready && !exported && (
        <p style={{ margin: "6px 0 0", fontSize: "0.65rem", color: colors.textMuted }}>
          Finish all 6 steps first.
        </p>
      )}
      {active && (
        <p style={{ margin: "8px 0 0", fontSize: "0.68rem", color: colors.textMuted, lineHeight: 1.45, maxWidth: "320px" }}>
          Fraud or abuse → ban.
        </p>
      )}
      {active && (
        <style>{`
          @keyframes export-socials-blink {
            0%, 100% { opacity: 1; box-shadow: 0 0 16px rgba(0,212,255,0.55), 0 0 32px rgba(0,212,255,0.2); }
            50% { opacity: 0.72; box-shadow: 0 0 8px rgba(0,212,255,0.35), 0 0 16px rgba(0,212,255,0.1); }
          }
        `}</style>
      )}
    </div>
  )
}
