import { useTheme } from "../../context/ThemeContext"
import { STEP_LABELS } from "../../lib/studioSteps"
import { isPromptLengthErrorMessage, isInternalGlitchError } from "../../lib/runwayPromptEstimate.js"
import HoverTip from "./HoverTip"
import StepGuideLabel from "./StepGuideLabel"

function ClipSlot({ slotNumber, generation, isSelected, onOpen, onDeselect, colors }) {
  const empty = !generation

  if (empty) {
    return (
      <HoverTip tip="Empty slot — click Generate Video above to create a clip here.">
        <div
          style={{
            flex: "1 1 0",
            minWidth: "72px",
            maxWidth: "96px",
            aspectRatio: "16 / 10",
            borderRadius: "10px",
            border: `2px dashed ${colors.border}`,
            background: colors.surfaceAlt,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            color: colors.textFaint,
            fontSize: "0.72rem",
          }}
        >
          <span style={{ fontWeight: 700 }}>Try {slotNumber}</span>
          <span>empty</span>
        </div>
      </HoverTip>
    )
  }

  const isPending = generation.status === "pending"
  const isReady = generation.status === "succeeded"
  const isFailed = generation.status === "failed"
  const isRefunded = isFailed && generation.refunded

  const tip = isReady
    ? "Click to watch. If a prop vanishes mid-clip, try another generation. Tap “This is my ad” when you like one."
    : isPending
      ? "Creating your video…"
      : isRefunded
        ? `${generation.error || "Try failed — no try was used."} This slot will open again shortly.`
        : generation.error || "This try failed — generate again to retry."

  return (
    <div style={{ flex: "1 1 0", minWidth: "72px", maxWidth: "96px", display: "flex", flexDirection: "column", gap: "4px" }}>
    <HoverTip tip={tip}>
      <button
        type="button"
        onClick={isReady ? () => onOpen(generation) : undefined}
        disabled={!isReady}
        style={{
          flex: "1 1 0",
          minWidth: "72px",
          maxWidth: "96px",
          padding: 0,
          border: isSelected ? `3px solid ${colors.accent}` : `1px solid ${colors.border}`,
          borderRadius: "10px",
          background: colors.bg,
          cursor: isReady ? "pointer" : "default",
          overflow: "hidden",
          position: "relative",
          boxShadow: isSelected ? colors.glowShadow : "none",
          opacity: isPending ? 0.75 : 1,
        }}
      >
        {isSelected && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "4px 6px",
              background: colors.accent,
              color: "#06121c",
              fontSize: "0.62rem",
              fontWeight: 800,
              textAlign: "center",
              letterSpacing: "0.04em",
              zIndex: 2,
            }}
          >
            YOUR AD
          </div>
        )}
        <div
          style={{
            aspectRatio: "16 / 10",
            background: isFailed ? "rgba(255,107,107,0.15)" : colors.surfaceAlt,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            fontSize: isReady ? "1.5rem" : "0.65rem",
            fontWeight: 700,
            color: isFailed ? "#ff8a8a" : colors.textMuted,
            paddingTop: isSelected ? "18px" : 0,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {isPending && "⏳"}
          {isReady && (generation.finalOutputUrl ? "🔊" : "▶")}
          {isFailed && (
            <>
              <span style={{ fontSize: "0.85rem" }}>✕</span>
              <span>Try Failed</span>
              {isRefunded && (
                <span style={{ fontSize: "0.58rem", fontWeight: 600, color: colors.accent }}>
                  No try used
                </span>
              )}
            </>
          )}
        </div>
        <div style={{ padding: "6px 8px", fontSize: "0.68rem", color: colors.textFaint, textAlign: "center" }}>
          Try {slotNumber}
        </div>
      </button>
    </HoverTip>
    {isSelected && onDeselect && (
      <button
        type="button"
        onClick={onDeselect}
        style={{
          padding: "4px 6px",
          borderRadius: "6px",
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          color: colors.textMuted,
          fontSize: "0.62rem",
          fontWeight: 700,
          cursor: "pointer",
          width: "100%",
        }}
      >
        Change pick
      </button>
    )}
    </div>
  )
}

export default function ClipNest({
  triesAllowed,
  generations = [],
  selectedGenerationId,
  generating,
  onOpen,
  onDeselect,
  step4Complete,
  step4Active,
}) {
  const { colors } = useTheme()

  const slots = Array.from({ length: triesAllowed }, (_, i) => {
    const slotNumber = i + 1
    const gen = generations.find((g) => g.retryIndex === slotNumber) || null
    return { slotNumber, gen }
  })

  const latestFailure = generations.find(
    (g) =>
      g.status === "failed" &&
      g.error &&
      !isPromptLengthErrorMessage(g.error) &&
      !isInternalGlitchError(g.error)
  )

  return (
    <section
      style={{
        marginTop: "8px",
        padding: "10px 12px",
        borderRadius: "8px",
        border: `1px solid ${colors.border}`,
        background: colors.surfaceAlt,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "flex-start",
        }}
      >
        {slots.map(({ slotNumber, gen }) => (
          <ClipSlot
            key={slotNumber}
            slotNumber={slotNumber}
            generation={gen}
            isSelected={gen && gen.id === selectedGenerationId}
            onOpen={onOpen}
            onDeselect={onDeselect}
            colors={colors}
          />
        ))}
      </div>

      {generating && (
        <p style={{ margin: "8px 0 0", fontSize: "0.72rem", color: colors.textMuted }}>
          Rendering… 2–5 min. Keep this tab open.
        </p>
      )}

      {!generating && latestFailure && (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "0.72rem",
            color: "#ff8a8a",
            lineHeight: 1.45,
            fontWeight: 600,
          }}
        >
          {latestFailure.error}
          {latestFailure.refunded ? " Your try was restored." : ""}
        </p>
      )}

      <StepGuideLabel complete={step4Complete} active={step4Active} colors={colors} compact>
        {STEP_LABELS[4]}
      </StepGuideLabel>
    </section>
  )
}
