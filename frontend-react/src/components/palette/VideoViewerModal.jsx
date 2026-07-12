import { useEffect } from "react"
import NeonButton from "../NeonButton"
import { useTheme } from "../../context/ThemeContext"
import { getStylePreset } from "../../lib/stylePresets"
import { generationPlaybackUrl } from "../../lib/studioSteps"
import HoverTip from "./HoverTip"

export default function VideoViewerModal({
  generation,
  stylePresetId,
  isSelected,
  onSelect,
  onDeselect,
  onClose,
}) {
  const { colors } = useTheme()
  const preset = getStylePreset(stylePresetId)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!generation) return null

  const canPick = generation.status === "succeeded"
  const playbackUrl = generationPlaybackUrl(generation)
  const hasSound = !!generation.finalOutputUrl
  const hasBranded = !!generation.brandedOutputUrl

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Watch your clip"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          background: colors.surface,
          borderRadius: "14px",
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
          boxShadow: colors.shadow,
        }}
      >
        <div
          style={{
            aspectRatio: "16 / 9",
            background: preset?.gradient || colors.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "8px",
            color: "#fff",
          }}
        >
          {playbackUrl ? (
            <video
              src={playbackUrl}
              controls
              autoPlay
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <>
              <span style={{ fontSize: "2rem" }}>▶</span>
              <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>Video loading…</span>
            </>
          )}
        </div>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontWeight: 700, color: colors.text, fontSize: "1rem" }}>
              Try #{generation.retryIndex}
            </div>
            <div style={{ fontSize: "0.8rem", color: colors.textMuted, marginTop: "2px" }}>
              {preset?.label || "Style preset"}
              {hasBranded ? " · with on-screen text" : ""}
              {hasSound ? " · with voice & music" : " · silent clip"}
            </div>
          </div>

          {canPick && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <HoverTip
                block
                tip="Locks this clip as your official ad. Unlocks voice & music and on-screen text steps."
              >
                <NeonButton
                  size="sm"
                  disabled={isSelected}
                  onClick={() => {
                    onSelect(generation.id)
                    onClose()
                  }}
                >
                  {isSelected ? "✓ This is your ad" : "This is my ad"}
                </NeonButton>
              </HoverTip>
              {isSelected && onDeselect && (
                <button
                  type="button"
                  onClick={() => {
                    onDeselect()
                    onClose()
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.textMuted,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  Change pick
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.textMuted,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
