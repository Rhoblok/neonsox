/** Bold step guide — blinks while `active`, shows ✓ when `complete`. */
export default function StepGuideLabel({ children, complete, active, colors, compact = false }) {
  const shouldBlink = active && !complete

  return (
    <p
      style={{
        marginTop: "8px",
        fontWeight: 700,
        fontSize: compact ? "0.78rem" : "0.88rem",
        lineHeight: compact ? 1.35 : 1.5,
        whiteSpace: compact ? "nowrap" : "normal",
        overflow: compact ? "hidden" : "visible",
        textOverflow: compact ? "ellipsis" : "clip",
        color: complete ? colors.textMuted : shouldBlink ? colors.accent : colors.textFaint,
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
