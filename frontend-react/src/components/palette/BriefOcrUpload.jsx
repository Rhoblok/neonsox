import { useRef, useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { extractTextFromImage, mergeOcrIntoBrief, parseBriefFromOcr } from "../../lib/briefOcr"

const MAX_OCR_MB = 8

export default function BriefOcrUpload({ state, patch, disabled }) {
  const { colors } = useTheme()
  const fileRef = useRef(null)
  const [rawText, setRawText] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const [expanded, setExpanded] = useState(false)

  const onFile = async (file) => {
    if (!file) return
    setError("")
    if (!file.type.startsWith("image/")) {
      setError("Upload a photo or screenshot (PNG, JPG, WebP).")
      return
    }
    if (file.size > MAX_OCR_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_OCR_MB} MB.`)
      return
    }

    setLoading(true)
    setProgress(0)
    setFileName(file.name)
    setExpanded(true)

    try {
      const text = await extractTextFromImage(file, setProgress)
      if (!text) {
        setError("No text found — try a clearer photo with larger text.")
        setRawText("")
      } else {
        setRawText(text)
      }
    } catch (err) {
      setError(err.message || "Could not read text from that image.")
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const applyToBrief = (replace) => {
    if (!rawText.trim()) return
    const parsed = parseBriefFromOcr(rawText)
    const updates = mergeOcrIntoBrief(state, parsed, { replace })
    if (!Object.keys(updates).length) {
      setError("Nothing matched — edit the text below or fill fields manually.")
      return
    }
    patch(updates)
    setError("")
  }

  return (
    <div
      style={{
        marginBottom: "16px",
        padding: "12px 14px",
        borderRadius: "10px",
        border: `1px dashed ${colors.accent}`,
        background: colors.bg,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={disabled || loading}
          style={{ display: "none" }}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => fileRef.current?.click()}
          style={{
            padding: "8px 14px",
            fontSize: "0.8rem",
            fontWeight: 700,
            borderRadius: "8px",
            border: `1px solid ${colors.accent}`,
            background: colors.accentSoft,
            color: colors.accent,
            cursor: disabled || loading ? "not-allowed" : "pointer",
            opacity: disabled || loading ? 0.6 : 1,
          }}
        >
          {loading ? `Reading text… ${progress}%` : "Upload brief / flyer (OCR)"}
        </button>
        {fileName && !loading && (
          <span style={{ fontSize: "0.72rem", color: colors.textFaint }}>{fileName}</span>
        )}
      </div>

      <p style={{ margin: 0, fontSize: "0.72rem", color: colors.textFaint, lineHeight: 1.45 }}>
        Snap a flyer, screenshot, or typed brief — we pull text into the fields below. First scan may take 15–30 seconds.
      </p>

      {error && (
        <p style={{ margin: "8px 0 0", fontSize: "0.72rem", color: "#ff8a8a" }}>{error}</p>
      )}

      {rawText && (
        <div style={{ marginTop: "12px" }}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: 0,
              border: "none",
              background: "none",
              color: colors.accent,
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: expanded ? "8px" : 0,
            }}
          >
            {expanded ? "Hide extracted text" : "Show extracted text"}
          </button>

          {expanded && (
            <>
              <textarea
                value={rawText}
                disabled={disabled}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: colors.surfaceAlt,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  color: colors.text,
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical",
                  marginBottom: "10px",
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => applyToBrief(false)}
                  style={{
                    padding: "7px 12px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    borderRadius: "7px",
                    border: "none",
                    background: colors.accent,
                    color: "#fff",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  Fill empty fields
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => applyToBrief(true)}
                  style={{
                    padding: "7px 12px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    borderRadius: "7px",
                    border: `1px solid ${colors.border}`,
                    background: "transparent",
                    color: colors.textMuted,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  Replace all matched fields
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
