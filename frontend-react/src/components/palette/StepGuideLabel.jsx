/** Bold step guide — blinks while `active`, shows ✓ when `complete`. */
export default function StepGuideLabel({ children, complete, active, colors, compact = false }) {
  const shouldBlink = active && !complete

  return (
    <p
      style={{
        marginTop: "8px",
        fontWeight: 900,
        fontSize: compact ? "0.78rem" : "0.88rem",
        lineHeight: compact ? 1.35 : 1.5,
        whiteSpace: compact ? "nowrap" : "normal",
        overflow: compact ? "hidden" : "visible",
        textOverflow: compact ? "ellipsis" : "clip",
        letterSpacing: "0.02em",
        color: complete ? colors.textMuted : shouldBlink ? colors.accent : colors.text,
        textShadow: shouldBlink
          ? `0 0 10px ${colors.glow}, 0 0 20px rgba(56, 189, 248, 0.45)`
          : complete
            ? "none"
            : `0 0 8px rgba(56, 189, 248, 0.2)`,
        animation: shouldBlink ? "step-guide-blink 1.15s ease-in-out infinite" : "none",
      }}
    >
      {complete ? "✓ " : null}
      {children}
      {shouldBlink && (
        <style>{`
          @keyframes step-guide-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      )}
    </p>
  )
}
