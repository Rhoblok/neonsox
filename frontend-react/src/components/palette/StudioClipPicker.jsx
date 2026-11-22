import { exportPlaybackUrl } from "../../lib/studioSteps"
import { setEditorDragPayload } from "./EditingBayTimeline"

function stageLabel(generation) {
  if (generation.brandedOutputUrl || generation.cloudBrandedOutputUrl) return "Done"
  if (generation.finalOutputUrl || generation.cloudFinalOutputUrl) return "V+M"
  return "Raw"
}

/**
 * Studio Try 1–5 picker — whole chip drags onto VIDEO timeline.
 * Also: + button / double-click to add; checkbox for multi-select.
 */
export default function StudioClipPicker({
  generations = [],
  selectedIds = [],
  onToggle,
  onToggleAll,
  onAddOne,
  alreadyQueuedIds = [],
  colors,
}) {
  const ready = generations
    .filter((g) => g.status === "succeeded" && exportPlaybackUrl(g))
    .sort((a, b) => (a.retryIndex || 0) - (b.retryIndex || 0))

  if (!ready.length) {
    return (
      <p style={{ margin: "0 0 2px", fontSize: "0.55rem", color: colors.textFaint }}>
        No studio clips — generate in Palette Step 3.
      </p>
    )
  }

  const allSelectable = ready.filter((g) => !alreadyQueuedIds.includes(g.id))
  const allSelected = allSelectable.length > 0 && allSelectable.every((g) => selectedIds.includes(g.id))

  return (
    <div style={{ marginBottom: "3px" }}>
      <style>{`
        @keyframes neonsoxSelectPulse {
          0%, 2% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); border-color: #34d399; }
          4% { box-shadow: 0 0 16px 3px rgba(52, 211, 153, 0.85); border-color: #6ee7b7; }
          8% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); border-color: #34d399; }
          100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); border-color: #34d399; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-neonsox-select-pulse] { animation: none !important; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", marginBottom: "2px" }}>
        <div style={{ fontSize: "0.52rem", color: colors.textFaint, fontWeight: 800, textTransform: "uppercase" }}>
          Studio tries · drag chip to VIDEO
        </div>
        {allSelectable.length > 1 && (
          <button type="button" onClick={() => onToggleAll(allSelectable.map((g) => g.id), !allSelected)} style={linkBtn(colors)}>
            {allSelected ? "Clear" : "All"}
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
        {ready.map((gen) => {
          const queued = alreadyQueuedIds.includes(gen.id)
          const checked = selectedIds.includes(gen.id)
          const slot = gen.retryIndex || "?"
          return (
            <div
              key={gen.id}
              draggable={!queued}
              onDragStart={(e) => {
                if (queued) {
                  e.preventDefault()
                  return
                }
                // Don't start a drag when interacting with controls inside the chip
                if (e.target?.closest?.("input, button")) {
                  e.preventDefault()
                  return
                }
                setEditorDragPayload(e.dataTransfer, { type: "studio", generationId: gen.id })
              }}
              onDoubleClick={(e) => {
                e.preventDefault()
                if (!queued) onAddOne?.(gen.id)
              }}
              title={
                queued
                  ? "Already on timeline"
                  : `Drag T${slot} onto the VIDEO lane under the monitor (${stageLabel(gen)})`
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "3px 6px",
                borderRadius: "5px",
                border: `1px solid ${checked ? "#34d399" : queued ? colors.border : "rgba(77, 163, 255, 0.55)"}`,
                background: checked ? "rgba(52, 211, 153, 0.12)" : queued ? colors.bg : "rgba(0,0,0,0.35)",
                opacity: queued ? 0.45 : 1,
                fontSize: "0.55rem",
                lineHeight: 1.2,
                userSelect: "none",
                cursor: queued ? "not-allowed" : "grab",
                boxShadow: queued ? "none" : "0 0 8px rgba(77, 163, 255, 0.25)",
                animation: checked && !queued ? "neonsoxSelectPulse 30s ease-in-out infinite" : "none",
              }}
              data-neonsox-select-pulse={checked && !queued ? "1" : undefined}
            >
              <span aria-hidden style={{ color: "#4da3ff", fontWeight: 900, pointerEvents: "none" }}>
                ⠿
              </span>
              <input
                type="checkbox"
                checked={checked}
                disabled={queued}
                onChange={() => onToggle(gen.id)}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  accentColor: colors.accent,
                  width: "10px",
                  height: "10px",
                  margin: 0,
                  cursor: queued ? "not-allowed" : "pointer",
                }}
              />
              <span style={{ color: colors.text, fontWeight: 800, pointerEvents: "none" }}>T{slot}</span>
              {!queued && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddOne?.(gen.id)
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: colors.accent,
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    cursor: "pointer",
                    padding: "0 2px",
                  }}
                >
                  +
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function linkBtn(colors) {
  return {
    border: "none",
    background: "transparent",
    color: colors.accent,
    fontSize: "0.52rem",
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
  }
}
