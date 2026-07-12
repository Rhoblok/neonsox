import { useTheme } from "../../context/ThemeContext"
import HoverTip from "./HoverTip"

export default function PreventAiMistakesToggle({ checked, onChange, disabled }) {
  const { colors } = useTheme()

  return (
    <HoverTip
      block
      tip="Sends extra strict instructions to the video engine: no signage, no letters, no writing, and eliminate handheld props."
    >
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginTop: "10px",
          marginBottom: "10px",
          padding: "10px 12px",
          borderRadius: "8px",
          border: `1px solid ${checked ? colors.accent : colors.border}`,
          background: checked ? colors.accentSoft : colors.surfaceAlt,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.65 : 1,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          style={{ marginTop: "2px", accentColor: colors.accent, flexShrink: 0 }}
        />
        <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: colors.text }}>
            Prevent AI mistakes
          </span>
          <span style={{ fontSize: "0.72rem", color: colors.textMuted, lineHeight: 1.4 }}>
            No signage or text anywhere — and eliminate props (empty hands, no bags or briefcases).
          </span>
        </span>
      </label>
    </HoverTip>
  )
}
