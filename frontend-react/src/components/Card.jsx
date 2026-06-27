import { useTheme } from "../context/ThemeContext"

// Reusable surface card with optional title and dashed-accent highlight.
export default function Card({ title, children, highlight = false, style = {}, ...rest }) {
  const { colors, tokens } = useTheme()

  return (
    <div
      style={{
        background: colors.surface,
        border: highlight ? `1px dashed ${colors.accent}` : `1px solid ${colors.border}`,
        borderRadius: tokens.radius.md,
        padding: "24px",
        boxShadow: colors.shadow,
        ...style,
      }}
      {...rest}
    >
      {title && (
        <h3 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700, color: colors.text }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
