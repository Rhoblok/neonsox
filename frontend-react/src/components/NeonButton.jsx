import { useState } from "react"
import { useTheme } from "../context/ThemeContext"

// Reusable NeonSox button. Variants: "primary" (filled), "secondary" (outline), "ghost".
export default function NeonButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  style = {},
  ...rest
}) {
  const { colors, tokens } = useTheme()
  const [hovered, setHovered] = useState(false)
  const isHovered = hovered && !disabled

  const sizes = {
    sm: { padding: "8px 16px", fontSize: "0.8rem" },
    md: { padding: "12px 26px", fontSize: "0.95rem" },
    lg: { padding: "16px 36px", fontSize: "1.05rem" },
  }

  const variants = {
    primary: {
      base: {
        background: colors.accent,
        color: "#06121c",
        border: "none",
        boxShadow: isHovered ? colors.glowShadow : "none",
      },
      hover: { transform: "translateY(-1px)" },
    },
    secondary: {
      base: {
        background: "transparent",
        color: colors.accent,
        border: `1px solid ${colors.accent}`,
        boxShadow: isHovered ? colors.glowShadow : "none",
      },
      hover: { background: colors.accentSoft },
    },
    ghost: {
      base: {
        background: colors.surface,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      },
      hover: { borderColor: colors.accent, color: colors.accent },
    },
  }

  const v = variants[variant] || variants.primary

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...sizes[size],
        ...v.base,
        ...(isHovered ? v.hover : {}),
        fontFamily: tokens.font.sans,
        fontWeight: 700,
        borderRadius: tokens.radius.sm,
        cursor: disabled ? "not-allowed" : "pointer",
        width: fullWidth ? "100%" : "auto",
        opacity: disabled ? 0.45 : 1,
        transition: "all 0.2s ease",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
