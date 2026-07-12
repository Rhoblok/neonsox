import NeonButton from "../NeonButton"
import { useTheme } from "../../context/ThemeContext"
import { OVERLAY_FONT_STYLES } from "../../lib/overlayFontStyles"
import {
  OVERLAY_COLORS,
  OVERLAY_FLASH_FOR,
  OVERLAY_POSITIONS,
  OVERLAY_PULSE,
  OVERLAY_SIZES,
  resolveOverlayStyle,
} from "../../lib/overlayPresets"
import { publicOverlayError } from "../../lib/publicErrors"
import { STEP_LABELS } from "../../lib/studioSteps"
import StepGuideLabel from "./StepGuideLabel"

function overlayStyleChanged(generation, style, companyName) {
  const applied = generation.appliedOverlayStyle
  if (!applied) return false
  const textChanged = (generation.appliedCompanyName || "") !== (companyName || "").trim()
  if (textChanged) return true
  return (
    applied.overlayColor !== style.color ||
    applied.overlaySize !== style.size ||
    applied.overlayPosition !== style.position ||
    applied.overlayPulse !== style.pulse ||
    applied.overlayFontStyle !== style.fontStyle ||
    applied.overlayFlashAt !== style.flashSeconds
  )
}

function Pill({ active, onClick, children, colors, disabled, accentColor }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "7px 12px",
        borderRadius: "999px",
        border: `1px solid ${active ? colors.accent : colors.border}`,
        background: active ? colors.accentSoft : colors.bg,
        color: active ? accentColor || colors.accent : colors.textMuted,
        fontWeight: 700,
        fontSize: "0.78rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        outline: "none",
        boxShadow: active ? `0 0 0 1px ${colors.accent}` : "none",
      }}
    >
      {children}
    </button>
  )
}

function ToolGroup({ label, children, colors }) {
  return (
    <div style={{ width: "100%", marginBottom: "8px", textAlign: "left" }}>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: colors.textFaint,
          marginBottom: "5px",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-start" }}>
        {children}
      </div>
    </div>
  )
}

function ControlRow({ label, children, colors }) {
  return (
    <div style={{ marginBottom: "10px", width: "100%", textAlign: "left" }}>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: colors?.textFaint || "inherit",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <div style={{ width: "100%", textAlign: "left" }}>{children}</div>
    </div>
  )
}

export default function TextOverlayPanel({
  selectedGeneration,
  state,
  patch,
  applyingOverlay,
  canApplyOverlay,
  canSkipOverlay,
  onApplyOverlay,
  onSkipOverlay,
  step6Complete,
  step6Active,
}) {
  const { colors } = useTheme()

  if (!selectedGeneration) {
    return (
      <section
        style={{
          padding: "12px 14px",
          borderRadius: "10px",
          border: `1px solid ${step6Active ? colors.accent : colors.border}`,
          background: step6Active ? colors.accentSoft : colors.surfaceAlt,
          opacity: 0.85,
        }}
      >
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: 800,
            color: colors.accent,
            letterSpacing: "0.02em",
            marginBottom: "8px",
          }}
        >
          Palette Editor
        </div>
        <StepGuideLabel complete={step6Complete} active={step6Active} colors={colors} compact>
          {STEP_LABELS[6]}
        </StepGuideLabel>
        <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: colors.textMuted, lineHeight: 1.45 }}>
          Pick your ad in Step 4 first, then add on-screen text here (or skip).
        </p>
      </section>
    )
  }

  const isSkipped = selectedGeneration.textOverlaySkipped === true
  const hasBranded =
    !isSkipped &&
    selectedGeneration.textOverlayStatus === "succeeded" &&
    selectedGeneration.brandedOutputUrl
  const isApplying = applyingOverlay || selectedGeneration.textOverlayStatus === "pending"
  const displayName = state.companyName.trim()
  const flashFor = [2, 4, 6].includes(Number(state.overlayFlashAt)) ? Number(state.overlayFlashAt) : 4

  const overlayStyle = {
    color: state.overlayColor,
    size: state.overlaySize,
    position: state.overlayPosition,
    pulse: state.overlayPulse,
    fontStyle: state.overlayFontStyle,
    flashSeconds: flashFor,
  }
  const resolved = resolveOverlayStyle(overlayStyle)
  const pulseAnim =
    resolved.pulse.hz > 0 ? `overlay-pulse ${1.1 / resolved.pulse.hz}s ease-in-out infinite` : "none"

  return (
    <section
      style={{
        padding: "12px 14px",
        borderRadius: "10px",
        border: `1px solid ${step6Active ? colors.accent : colors.border}`,
        background: step6Active ? colors.accentSoft : colors.surfaceAlt,
        boxShadow: step6Active ? colors.glowShadow : "none",
        color: colors.text,
        textAlign: "left",
      }}
    >
      <div
        style={{
          fontSize: "0.85rem",
          fontWeight: 800,
          color: colors.accent,
          letterSpacing: "0.02em",
          marginBottom: "10px",
        }}
      >
        Palette Editor
      </div>

      <ControlRow label="Font" colors={colors}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))",
            gap: "6px",
            maxHeight: "200px",
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          {OVERLAY_FONT_STYLES.map((font) => {
            const active = state.overlayFontStyle === font.id
            return (
              <button
                key={font.id}
                type="button"
                disabled={isApplying}
                onClick={() => patch({ overlayFontStyle: font.id })}
                style={{
                  padding: "8px 6px",
                  borderRadius: "8px",
                  border: `1px solid ${active ? colors.accent : colors.border}`,
                  background: active ? colors.accentSoft : colors.bg,
                  cursor: isApplying ? "not-allowed" : "pointer",
                  opacity: isApplying ? 0.5 : 1,
                  textAlign: "center",
                  outline: "none",
                }}
              >
                <div
                  style={{
                    fontFamily: font.previewFamily,
                    fontWeight: font.previewWeight || 400,
                    fontSize: "1.1rem",
                    color: active ? colors.accent : colors.text,
                    lineHeight: 1.1,
                    marginBottom: "4px",
                  }}
                >
                  Aa
                </div>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: colors.textMuted, lineHeight: 1.2 }}>
                  {font.label}
                </div>
              </button>
            )
          })}
        </div>
      </ControlRow>

      <ControlRow label="Color" colors={colors}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {OVERLAY_COLORS.map((c) => (
            <Pill
              key={c.id}
              active={state.overlayColor === c.id}
              disabled={isApplying}
              colors={colors}
              accentColor={c.hex}
              onClick={() => patch({ overlayColor: c.id })}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: c.hex,
                  marginRight: "6px",
                  verticalAlign: "middle",
                  border: "1px solid rgba(0,0,0,0.25)",
                }}
              />
              {c.label}
            </Pill>
          ))}
        </div>
      </ControlRow>

      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "10px",
          textAlign: "left",
        }}
      >
        <ToolGroup label="Size" colors={colors}>
          {OVERLAY_SIZES.map((s) => (
            <Pill
              key={s.id}
              active={state.overlaySize === s.id}
              disabled={isApplying}
              colors={colors}
              onClick={() => patch({ overlaySize: s.id })}
            >
              {s.label === "S" ? "Small" : s.label === "M" ? "Medium" : "Large"}
            </Pill>
          ))}
        </ToolGroup>

        <ToolGroup label="Position" colors={colors}>
          {OVERLAY_POSITIONS.map((p) => (
            <Pill
              key={p.id}
              active={state.overlayPosition === p.id}
              disabled={isApplying}
              colors={colors}
              onClick={() => patch({ overlayPosition: p.id })}
            >
              {p.label}
            </Pill>
          ))}
        </ToolGroup>

        <ToolGroup label="Pulse" colors={colors}>
          {OVERLAY_PULSE.map((p) => (
            <Pill
              key={p.id}
              active={state.overlayPulse === p.id}
              disabled={isApplying}
              colors={colors}
              onClick={() => patch({ overlayPulse: p.id })}
            >
              {p.label}
            </Pill>
          ))}
        </ToolGroup>
      </div>

      <ControlRow label="Flash for" colors={colors}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          {OVERLAY_FLASH_FOR.map((f) => (
            <Pill
              key={f.id}
              active={flashFor === f.id}
              disabled={isApplying}
              colors={colors}
              onClick={() => patch({ overlayFlashAt: f.id })}
            >
              {f.label}
            </Pill>
          ))}
          <span style={{ fontSize: "0.68rem", color: colors.textMuted, lineHeight: 1.4 }}>
            On screen exactly that long — sweeps in once, then disappears. Tap Update.
          </span>
        </div>
      </ControlRow>

      <ControlRow label="Company Name" colors={colors}>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "8px",
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            textAlign: "center",
            minHeight: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <input
            type="text"
            value={state.companyName}
            disabled={isApplying}
            placeholder="Tap to edit (optional)"
            onChange={(e) => patch({ companyName: e.target.value, brandName: e.target.value })}
            style={{
              width: "100%",
              maxWidth: "100%",
              fontFamily: resolved.fontStyle.previewFamily,
              fontWeight: resolved.fontStyle.previewWeight || 400,
              fontSize: resolved.size.previewRem,
              color: displayName ? resolved.color.hex : colors.textMuted,
              WebkitTextStroke: displayName ? "2px #000" : "none",
              paintOrder: "stroke fill",
              animation: displayName ? pulseAnim : "none",
              textAlign: "center",
              border: "none",
              background: "transparent",
              outline: "none",
              padding: 0,
            }}
          />
          {resolved.pulse.hz > 0 && displayName && (
            <style>{`
              @keyframes overlay-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.35; }
              }
            `}</style>
          )}
        </div>
      </ControlRow>

      {hasBranded && overlayStyleChanged(selectedGeneration, overlayStyle, displayName) && (
        <p style={{ margin: "0 0 8px", fontSize: "0.68rem", color: colors.accent }}>
          Tap Update to apply changes.
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
        <NeonButton size="sm" disabled={!canApplyOverlay || isApplying || !displayName} onClick={onApplyOverlay}>
          {isApplying ? "Applying…" : hasBranded ? "Update" : "Apply"}
        </NeonButton>
        <NeonButton
          size="sm"
          variant="ghost"
          disabled={!canSkipOverlay || isApplying}
          onClick={onSkipOverlay}
        >
          Skip (optional)
        </NeonButton>
      </div>

      <StepGuideLabel complete={step6Complete} active={step6Active} colors={colors} compact>
        {STEP_LABELS[6]}
      </StepGuideLabel>

      {selectedGeneration.textOverlayError && (
        <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "#ff8a8a", lineHeight: 1.4 }}>
          {publicOverlayError(selectedGeneration.textOverlayError)}
        </p>
      )}

      {isSkipped && (
        <p style={{ margin: "6px 0 0", fontSize: "0.68rem", color: colors.accent, fontWeight: 600 }}>
          ✓ Skipped — no on-screen text
        </p>
      )}

      {hasBranded && (
        <p style={{ margin: "6px 0 0", fontSize: "0.68rem", color: colors.accent, fontWeight: 600 }}>
          ✓ Text applied
        </p>
      )}
    </section>
  )
}
