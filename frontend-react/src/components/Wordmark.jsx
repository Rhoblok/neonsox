import { useTheme } from "../context/ThemeContext"

// The NEONSOX brand wordmark. Always renders in the Orbitron display font with the
// signature orange letters + blue neon glow. Pass `withTM` for the small ™ on large
// signs. Use this ONLY for the standalone bold logo — for "NeonSox" inside a sentence,
// just write the text normally (no glow).
export default function Wordmark({ size = "1.4rem", withTM = false, glow = true, style = {} }) {
  const { colors, tokens } = useTheme()

  return (
    <span
      style={{
        fontFamily: tokens.font.display,
        fontWeight: 800,
        letterSpacing: "1.5px",
        lineHeight: 1,
        fontSize: size,
        color: colors.peach,
        display: "inline-flex",
        alignItems: "flex-start",
        textShadow: glow
          ? `0 0 6px ${colors.glow}, 0 0 16px ${colors.glow}, 0 0 30px ${colors.accent}, 0 0 3px ${colors.peach}`
          : "none",
        ...style,
      }}
    >
      NEONSOX
      {withTM && (
        <sup
          style={{
            fontSize: "0.34em",
            marginLeft: "3px",
            marginTop: "0.25em",
            fontWeight: 700,
            letterSpacing: 0,
            color: colors.accent,
            textShadow: "none",
          }}
        >
          ™
        </sup>
      )}
    </span>
  )
}
