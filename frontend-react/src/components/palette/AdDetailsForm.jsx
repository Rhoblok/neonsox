import { useRef, useState } from "react"
import { useTheme } from "../../context/ThemeContext"

function Field({ label, id, children }) {
  const { colors } = useTheme()
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", flex: "1 1 180px", minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: "0.78rem", fontWeight: 600, color: colors.textFaint, whiteSpace: "nowrap" }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = (colors) => ({
  flex: 1,
  minWidth: 0,
  padding: "8px 10px",
  background: colors.bg,
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  color: colors.text,
  fontSize: "0.85rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
})

const MAX_LOGO_MB = 4

export default function AdDetailsForm({ state, patch, disabled }) {
  const { colors } = useTheme()
  const inp = inputStyle(colors)
  const fileRef = useRef(null)
  const [uploadError, setUploadError] = useState("")

  const isUploadedLogo = state.logoUrl?.startsWith("data:image/")
  const previewSrc = state.logoUrl?.startsWith("http") || isUploadedLogo ? state.logoUrl : null

  const onLogoFile = (file) => {
    if (!file) return
    setUploadError("")
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload a PNG, JPG, or WebP image.")
      return
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      setUploadError(`Image must be under ${MAX_LOGO_MB} MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      patch({
        logoUrl: reader.result,
        logoSource: "upload",
        logoFileName: file.name,
      })
    }
    reader.onerror = () => setUploadError("Could not read that file. Try another image.")
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.accent, marginBottom: "10px" }}>
          Brand
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", marginBottom: "12px" }}>
          <Field label="Brand Colors" id="brand-colors">
            <input
              id="brand-colors"
              style={inp}
              placeholder="#111111, #FFFFFF"
              value={state.brandColors}
              disabled={disabled}
              onChange={(e) => patch({ brandColors: e.target.value })}
            />
          </Field>
        </div>

        <div
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: "10px",
            padding: "12px 14px",
            background: colors.bg,
          }}
        >
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: colors.textFaint, marginBottom: "8px" }}>
            Logo — upload or URL (optional)
          </div>
          <p style={{ margin: "0 0 10px", fontSize: "0.72rem", color: colors.textFaint, lineHeight: 1.45 }}>
            Adding a logo can unlock sharper brand animation. Leave blank for text-only ads.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={disabled}
              style={{ display: "none" }}
              onChange={(e) => onLogoFile(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileRef.current?.click()}
              style={{
                padding: "8px 14px",
                fontSize: "0.8rem",
                fontWeight: 700,
                borderRadius: "8px",
                border: `1px solid ${colors.accent}`,
                background: colors.accentSoft,
                color: colors.accent,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              Upload logo
            </button>
            {isUploadedLogo && state.logoFileName && (
              <span style={{ fontSize: "0.75rem", color: colors.textMuted }}>{state.logoFileName}</span>
            )}
            {isUploadedLogo && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => patch({ logoUrl: "", logoSource: "", logoFileName: "" })}
                style={{
                  padding: "6px 10px",
                  fontSize: "0.72rem",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  background: "transparent",
                  color: colors.textMuted,
                  cursor: "pointer",
                }}
              >
                Remove upload
              </button>
            )}
          </div>

          {uploadError && (
            <p style={{ margin: "0 0 8px", fontSize: "0.72rem", color: "#ff8a8a" }}>{uploadError}</p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <label htmlFor="logo-url" style={{ fontSize: "0.78rem", fontWeight: 600, color: colors.textFaint, whiteSpace: "nowrap" }}>
              Or Logo URL
            </label>
            <input
              id="logo-url"
              style={{ ...inp, flex: "1 1 220px" }}
              placeholder="https://yoursite.com/logo.png"
              value={isUploadedLogo ? "" : state.logoUrl}
              disabled={disabled || isUploadedLogo}
              onChange={(e) =>
                patch({
                  logoUrl: e.target.value,
                  logoSource: "url",
                  logoFileName: "",
                })
              }
            />
          </div>

          {previewSrc && (
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                src={previewSrc}
                alt="Logo preview"
                style={{
                  width: "56px",
                  height: "56px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surfaceAlt,
                }}
              />
              <span style={{ fontSize: "0.72rem", color: colors.textFaint }}>
                {isUploadedLogo ? "Logo uploaded — ready for your ad" : "Logo preview"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.accent, marginBottom: "10px" }}>
          Output options
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px" }}>
          <span
            style={{
              fontSize: "0.78rem",
              color: colors.textMuted,
              padding: "6px 10px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: colors.bg,
            }}
          >
            10 sec · 16:9 · silent clip
          </span>
          <span style={{ fontSize: "0.75rem", color: colors.textFaint, maxWidth: "320px", lineHeight: 1.4 }}>
            Voice & music are added in Step 2 after you pick your ad.
          </span>
        </div>
      </div>
    </div>
  )
}
