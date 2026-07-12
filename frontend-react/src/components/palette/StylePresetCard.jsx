import { useEffect, useRef, useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { getStylePreset } from "../../lib/stylePresets"
import { getPresetPreview, getPresetShortLabel } from "../../lib/stylePresetPreviews"

function PresetPreview({ preset, selected, colors }) {
  const videoRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [imageOk, setImageOk] = useState(true)
  const [videoOk, setVideoOk] = useState(true)
  const preview = getPresetPreview(preset.id, preset.category)
  const showVideo = preview?.video && videoOk && imageOk && (selected || hovered)

  useEffect(() => {
    setImageOk(true)
    setVideoOk(true)
  }, [preset.id, preview?.image, preview?.video])

  const onEnter = () => {
    setHovered(true)
    const v = videoRef.current
    if (v) {
      v.play().catch(() => {})
    }
  }

  const onLeave = () => {
    setHovered(false)
    const v = videoRef.current
    if (v) {
      v.pause()
      v.currentTime = 0
    }
  }

  return (
    <div
      style={{
        position: "relative",
        height: "72px",
        background: preset.gradient,
        overflow: "hidden",
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-hidden
    >
      {preview?.image && imageOk ? (
        <img
          src={preview.image}
          alt=""
          loading="lazy"
          onError={() => setImageOk(false)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: showVideo ? "none" : "block",
          }}
        />
      ) : null}
      {preview?.video && videoOk ? (
        <video
          ref={videoRef}
          src={preview.video}
          poster={imageOk ? preview.image : undefined}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoOk(false)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: showVideo ? "block" : "none",
          }}
        />
      ) : null}
      {preview && (imageOk || videoOk) ? (
        <span
          style={{
            position: "absolute",
            left: "6px",
            bottom: "6px",
            right: preview.badge ? "6px" : undefined,
            fontSize: preview.badge ? "0.52rem" : "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.03em",
            textTransform: preview.badge ? "none" : "uppercase",
            color: "#fff",
            background: "rgba(0,0,0,0.72)",
            padding: preview.badge ? "3px 6px" : "2px 6px",
            borderRadius: "4px",
            lineHeight: 1.25,
          }}
        >
          {preview.badge || "Preview"}
        </span>
      ) : null}
      {selected ? (
        <span
          style={{
            position: "absolute",
            top: "6px",
            right: "6px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: colors.accent,
            color: "#06121c",
            fontSize: "0.65rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✓
        </span>
      ) : null}
    </div>
  )
}

export default function StylePresetCard({ preset, selected, onSelect }) {
  const { colors } = useTheme()
  const shortLabel = getPresetShortLabel(preset.id, preset.label)
  const preview = getPresetPreview(preset.id, preset.category)

  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      aria-pressed={selected}
      title={`${preset.label} — ${preset.description}${preview?.alt ? `. Preview: ${preview.alt}` : ""}`}
      style={{
        textAlign: "left",
        padding: 0,
        border: selected ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
        borderRadius: "10px",
        background: colors.bg,
        cursor: "pointer",
        overflow: "hidden",
        boxShadow: selected ? colors.glowShadow : "none",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        width: "100%",
      }}
    >
      <PresetPreview preset={preset} selected={selected} colors={colors} />
      <div style={{ padding: "8px 10px" }}>
        <div
          style={{
            fontSize: "0.74rem",
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {shortLabel}
        </div>
        <div
          style={{
            marginTop: "4px",
            fontSize: "0.58rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: colors.textFaint,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {preset.category}
        </div>
        <p
          style={{
            margin: "5px 0 0",
            fontSize: "0.68rem",
            color: colors.textMuted,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {preset.description}
        </p>
      </div>
    </button>
  )
}

export function SelectedStyleSummary({ presetId }) {
  const { colors } = useTheme()
  const [imageOk, setImageOk] = useState(true)
  const [videoOk, setVideoOk] = useState(true)
  const preset = getStylePreset(presetId)
  const preview = preset ? getPresetPreview(presetId, preset.category) : null

  useEffect(() => {
    setImageOk(true)
    setVideoOk(true)
  }, [presetId, preview?.image, preview?.video])

  if (!preset) return null

  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ fontSize: "0.8rem", color: colors.textMuted }}>
        Selected:{" "}
        <strong style={{ color: colors.accent }}>
          {preview?.badge || getPresetShortLabel(presetId, preset.label)}
        </strong>
      </div>
      {preview && (imageOk || videoOk) ? (
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            padding: "8px 10px",
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            background: colors.surfaceAlt,
          }}
        >
          {preview.video && videoOk ? (
            <video
              src={preview.video}
              poster={imageOk ? preview.image : undefined}
              muted
              loop
              playsInline
              autoPlay
              onError={() => setVideoOk(false)}
              style={{
                width: "120px",
                height: "68px",
                objectFit: "cover",
                borderRadius: "6px",
                flexShrink: 0,
              }}
            />
          ) : preview.image && imageOk ? (
            <img
              src={preview.image}
              alt={preview.alt || preset.label}
              onError={() => setImageOk(false)}
              style={{
                width: "120px",
                height: "68px",
                objectFit: "cover",
                borderRadius: "6px",
                flexShrink: 0,
              }}
            />
          ) : null}
          <div style={{ minWidth: 0 }}>
            {preview.badge ? (
              <div
                style={{
                  margin: "0 0 4px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: colors.text,
                  lineHeight: 1.3,
                }}
              >
                {preview.badge}
              </div>
            ) : null}
            <p style={{ margin: 0, fontSize: "0.72rem", color: colors.textMuted, lineHeight: 1.4 }}>
              {preview.sceneCaption || preview.alt || preset.description}
              {preview.video ? " Video plays when this look is selected." : null}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
