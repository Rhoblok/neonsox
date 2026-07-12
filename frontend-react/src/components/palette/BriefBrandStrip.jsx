import { useRef, useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { extractTextFromImage, mergeOcrIntoBrief, parseBriefFromOcr } from "../../lib/briefOcr"
import HoverTip from "./HoverTip"

const MAX_OCR_MB = 8
const MAX_LOGO_MB = 4

const COLOR_PRESETS = [
  { label: "B&W", value: "#111111, #FFFFFF" },
  { label: "Navy/Gold", value: "#1a3a5c, #ffd700" },
  { label: "Purple/Pink", value: "#2d1b4e, #ff6b9d" },
  { label: "Green/White", value: "#0d4f3c, #ffffff" },
]

const miniInp = (colors) => ({
  width: "100%",
  padding: "6px 8px",
  background: colors.bg,
  border: `1px solid ${colors.border}`,
  borderRadius: "6px",
  color: colors.text,
  fontSize: "0.78rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
})

function Col({ title, children, colors }) {
  return (
    <div style={{ flex: "1 1 140px", minWidth: 0 }}>
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: colors.accent,
          marginBottom: "6px",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

export default function BriefBrandStrip({ state, patch, disabled }) {
  const { colors } = useTheme()
  const inp = miniInp(colors)
  const ocrRef = useRef(null)
  const logoRef = useRef(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [logoError, setLogoError] = useState("")

  const isUploadedLogo = state.logoUrl?.startsWith("data:image/")
  const previewSrc = state.logoUrl?.startsWith("http") || isUploadedLogo ? state.logoUrl : null

  const onOcrFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return
    if (file.size > MAX_OCR_MB * 1024 * 1024) return
    setOcrLoading(true)
    try {
      const text = await extractTextFromImage(file)
      if (text) {
        const parsed = parseBriefFromOcr(text)
        const updates = mergeOcrIntoBrief(state, parsed, { replace: false })
        if (Object.keys(updates).length) patch(updates)
      }
    } finally {
      setOcrLoading(false)
    }
  }

  const onLogoFile = (file) => {
    if (!file) return
    setLogoError("")
    if (!file.type.startsWith("image/")) {
      setLogoError("Image only")
      return
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      setLogoError(`Max ${MAX_LOGO_MB}MB`)
      return
    }
    const reader = new FileReader()
    reader.onload = () =>
      patch({ logoUrl: reader.result, logoSource: "upload", logoFileName: file.name })
    reader.readAsDataURL(file)
  }

  const btn = {
    padding: "6px 10px",
    fontSize: "0.72rem",
    fontWeight: 700,
    borderRadius: "6px",
    border: `1px solid ${colors.accent}`,
    background: colors.accentSoft,
    color: colors.accent,
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
  }

  return (
    <div
      style={{
        marginTop: "10px",
        paddingTop: "10px",
        borderTop: `1px solid ${colors.border}`,
        display: "flex",
        flexWrap: "wrap",
        gap: "10px 12px",
      }}
    >
      <Col title="Flyer OCR" colors={colors}>
        <HoverTip tip="Upload a photo of a flyer or brief — text auto-fills the fields above.">
          <input
          ref={ocrRef}
          type="file"
          accept="image/*"
          disabled={disabled || ocrLoading}
          style={{ display: "none" }}
          onChange={(e) => onOcrFile(e.target.files?.[0])}
        />
        <button type="button" disabled={disabled || ocrLoading} style={btn} onClick={() => ocrRef.current?.click()}>
          {ocrLoading ? "Reading…" : "Upload flyer"}
        </button>
        </HoverTip>
      </Col>

      <Col title="Color theme" colors={colors}>
        <input
          style={inp}
          placeholder="#111, #fff"
          value={state.brandColors}
          disabled={disabled}
          onChange={(e) => patch({ brandColors: e.target.value })}
        />
        <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "nowrap" }}>
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              title={p.value}
              disabled={disabled}
              onClick={() => patch({ brandColors: p.value })}
              style={{
                ...btn,
                padding: "3px 6px",
                fontSize: "0.62rem",
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.textMuted,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Col>

      <Col title="Logo" colors={colors}>
        <input
          ref={logoRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          style={{ display: "none" }}
          onChange={(e) => onLogoFile(e.target.files?.[0])}
        />
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <button type="button" disabled={disabled} style={btn} onClick={() => logoRef.current?.click()}>
            Upload
          </button>
          <input
            style={{ ...inp, flex: 1, minWidth: 0 }}
            placeholder="or URL"
            value={isUploadedLogo ? "" : state.logoUrl}
            disabled={disabled || isUploadedLogo}
            onChange={(e) => patch({ logoUrl: e.target.value, logoSource: "url", logoFileName: "" })}
          />
          {previewSrc && (
            <img
              src={previewSrc}
              alt=""
              style={{ width: "28px", height: "28px", objectFit: "contain", borderRadius: "4px", border: `1px solid ${colors.border}` }}
            />
          )}
        </div>
        {logoError && <span style={{ fontSize: "0.65rem", color: "#ff8a8a" }}>{logoError}</span>}
      </Col>
    </div>
  )
}
