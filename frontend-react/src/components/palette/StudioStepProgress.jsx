import { STEP_LABELS, STEP_ORDER } from "../../lib/studioSteps"
import StepGuideLabel from "./StepGuideLabel"

/** Always-visible row of all 6 steps — current step blinks until done. */
export default function StudioStepProgress({ steps, colors }) {
  const activeStep = STEP_ORDER.find((n) => steps.active[n] && !steps.complete[n])

  return (
    <nav aria-label="Studio workflow steps" style={{ marginBottom: "12px" }}>
      <ol
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 10px",
          margin: 0,
          padding: "10px 12px",
          listStyle: "none",
          borderRadius: "10px",
          border: `1px solid ${colors.border}`,
          background: colors.surfaceAlt,
        }}
      >
        {STEP_ORDER.map((num) => {
          const complete = steps.complete[num]
          const active = steps.active[num]
          const shouldBlink = active && !complete
          return (
            <li
              key={num}
              aria-current={active ? "step" : undefined}
              className={shouldBlink ? "studio-step-blink" : undefined}
              style={{
                fontSize: "0.68rem",
                fontWeight: 900,
                letterSpacing: "0.03em",
                color: complete ? colors.textMuted : shouldBlink ? colors.accent : colors.text,
                whiteSpace: "nowrap",
                textShadow: shouldBlink
                  ? `0 0 10px ${colors.glow}, 0 0 18px rgba(56, 189, 248, 0.4)`
                  : complete
                    ? "none"
                    : "0 0 6px rgba(56, 189, 248, 0.15)",
              }}
            >
              <span className="sr-only">Step {num}: </span>
              {complete ? "✓ " : null}
              {STEP_LABELS[num]}
            </li>
          )
        })}
      </ol>
      {activeStep ? (
        <p className="sr-only" aria-live="polite">
          Current step: {STEP_LABELS[activeStep]}
        </p>
      ) : null}
      <style>{`
        .studio-step-blink {
          animation: step-guide-blink 1.15s ease-in-out infinite;
        }
        @keyframes step-guide-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @media (prefers-reduced-motion: reduce) {
          .studio-step-blink {
            animation: none;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
        }
      `}</style>
    </nav>
  )
}

export { StepGuideLabel }
