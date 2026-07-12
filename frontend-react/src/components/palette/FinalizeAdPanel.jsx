import { useEffect, useState } from "react"
import NeonButton from "../NeonButton"
import { useTheme } from "../../context/ThemeContext"
import { MUSIC_MOODS, VOICE_STYLES } from "../../lib/audioPresets"
import { toneStyleLabel } from "../../lib/industryVoiceScripts"
import { generationPlaybackUrl, sourcePlaybackUrl, STEP_LABELS } from "../../lib/studioSteps"
import ExportSocialsButton from "./ExportSocialsButton"
import HoverTip from "./HoverTip"
import StepGuideLabel from "./StepGuideLabel"

function Pill({ active, onClick, children, colors, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: "999px",
        border: `1px solid ${active ? colors.accent : colors.border}`,
        background: active ? colors.accentSoft : colors.bg,
        color: active ? colors.accent : colors.textMuted,
        fontWeight: 700,
        fontSize: "0.8rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

export default function FinalizeAdPanel({
  selectedGeneration,
  state,
  patch,
  mixingAudio,
  canMixAudio,
  onMixAudio,
  onSuggestScript,
  onNarrationChange,
  narrationHint,
  narrationPulseAt,
  scriptPickerOpen,
  scriptVariants,
  scriptVariantIndex,
  onPrevScript,
  onNextScript,
  onApplyScript,
  onCloseScriptPicker,
  step5Complete,
  step5Active,
  allStepsComplete,
  onExportToSocials,
}) {
  const { colors } = useTheme()
  const [scriptPulse, setScriptPulse] = useState(false)
  const [showSourceOnly, setShowSourceOnly] = useState(false)

  useEffect(() => {
    if (!narrationPulseAt) return undefined
    setScriptPulse(true)
    const timer = setTimeout(() => setScriptPulse(false), 1400)
    return () => clearTimeout(timer)
  }, [narrationPulseAt])

  if (!selectedGeneration) {
    return (
      <section
        style={{
          padding: "12px 14px",
          borderRadius: "10px",
          border: `1px solid ${step5Active ? colors.accent : colors.border}`,
          background: step5Active ? colors.accentSoft : colors.surfaceAlt,
          opacity: 0.85,
        }}
      >
        <StepGuideLabel complete={step5Complete} active={step5Active} colors={colors} compact>
          {STEP_LABELS[5]}
        </StepGuideLabel>
        <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: colors.textMuted, lineHeight: 1.45 }}>
          Pick your ad in Step 4 first, then add voice and music here.
        </p>
      </section>
    )
  }

  const hasBranded =
    selectedGeneration.textOverlayStatus === "succeeded" && selectedGeneration.brandedOutputUrl
  const sourceUrl = sourcePlaybackUrl(selectedGeneration)
  const playbackUrl =
    showSourceOnly && sourceUrl ? sourceUrl : generationPlaybackUrl(selectedGeneration)
  const hasFinal = selectedGeneration.audioMixStatus === "succeeded" && selectedGeneration.finalOutputUrl
  const isMixing = mixingAudio || selectedGeneration.audioMixStatus === "pending"
  const appliedMusicVolume = selectedGeneration.appliedMusicVolume
  const volumePending =
    hasFinal && appliedMusicVolume != null && appliedMusicVolume !== (state.musicVolume ?? 45)
  const appliedVoiceStyle = selectedGeneration.appliedVoiceStyle
  const voicePending = hasFinal && appliedVoiceStyle != null && appliedVoiceStyle !== state.voiceStyle
  const appliedVoiceGender = selectedGeneration.appliedVoiceGender
  const genderPending = hasFinal && appliedVoiceGender != null && appliedVoiceGender !== (state.voiceGender || "female")
  const settingsPending = genderPending || voicePending || volumePending
  const exportedToSocials = !!selectedGeneration.exportedToSocials
  const audioMixError = selectedGeneration.audioMixError
    ? publicAudioError(selectedGeneration.audioMixError)
    : null

  const activeVariant = scriptVariants[scriptVariantIndex] || null
  const variantTotal = scriptVariants.length
  const activeScript = (state.narrationScript || "").trim()
  const matchedVariantIndex = scriptVariants.findIndex(
    (v) => v.script.trim().toLowerCase() === activeScript.toLowerCase()
  )
  const previewDiffersFromActive =
    scriptPickerOpen &&
    activeVariant &&
    activeVariant.script.trim().toLowerCase() !== activeScript.toLowerCase()

  function scriptStatusBadge() {
    if (!activeScript) {
      return { label: "Add a script", tone: "muted" }
    }
    if (matchedVariantIndex >= 0) {
      return { label: `Idea ${matchedVariantIndex + 1} in use`, tone: "active" }
    }
    return { label: "Your custom script", tone: "active" }
  }

  const scriptBadge = scriptStatusBadge()

  function badgeStyle(tone) {
    const active = tone === "active"
    return {
      padding: "3px 10px",
      borderRadius: "999px",
      border: `1px solid ${active ? colors.accent : colors.border}`,
      background: active ? colors.accentSoft : colors.surfaceAlt,
      color: active ? colors.accent : colors.textMuted,
      fontSize: "0.65rem",
      fontWeight: 800,
      whiteSpace: "nowrap",
    }
  }

  function navBtnStyle(disabled) {
    return {
      padding: "6px 12px",
      borderRadius: "999px",
      border: `1px solid ${colors.border}`,
      background: colors.surfaceAlt,
      color: colors.text,
      fontSize: "0.72rem",
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
    }
  }

  return (
    <section
      style={{
        padding: "12px 14px",
        borderRadius: "10px",
        border: `1px solid ${colors.accent}`,
        background: colors.bg,
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: colors.textFaint, marginBottom: "4px" }}>
            Palette Editor
          </div>
          <div style={{ fontSize: "0.68rem", color: colors.textMuted, marginBottom: "8px" }}>
            {hasBranded ? "Finished ad" : hasFinal ? "With sound" : "Silent preview"}
          </div>
          {hasBranded && (
            <button
              type="button"
              onClick={() => setShowSourceOnly((v) => !v)}
              style={{
                marginBottom: "8px",
                padding: "4px 10px",
                borderRadius: "999px",
                border: `1px solid ${colors.border}`,
                background: colors.surfaceAlt,
                color: colors.accent,
                fontSize: "0.65rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {showSourceOnly ? "Show finished" : "No text overlay"}
            </button>
          )}
          <div
            style={{
              aspectRatio: "16 / 9",
              borderRadius: "10px",
              overflow: "hidden",
              border: `1px solid ${colors.border}`,
              background: colors.surfaceAlt,
            }}
          >
            {playbackUrl ? (
              <video
                key={playbackUrl}
                src={playbackUrl}
                controls
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.textFaint,
                  fontSize: "0.85rem",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                Your video will appear here once it's ready.
              </div>
            )}
          </div>
          <ExportSocialsButton
            ready={allStepsComplete}
            exported={exportedToSocials}
            onExport={onExportToSocials}
          />
        </div>

        <div style={{ textAlign: "left" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: colors.textFaint,
              }}
            >
              What should the voice say?
            </label>
            <button
              type="button"
              disabled={isMixing}
              onClick={onSuggestScript}
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                border: `1px solid ${colors.border}`,
                background: colors.surfaceAlt,
                color: colors.accent,
                fontSize: "0.68rem",
                fontWeight: 700,
                cursor: isMixing ? "not-allowed" : "pointer",
                opacity: isMixing ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
            >
              ↻ Browse script ideas
            </button>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: "0.68rem", color: colors.textMuted, lineHeight: 1.45 }}>
            The box below is what the voice will say. Type your own, or browse ideas and tap{" "}
            <strong style={{ color: colors.text }}>Select this idea</strong>.
          </p>

          {scriptPickerOpen && activeVariant && (
            <div
              style={{
                marginBottom: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                border: `1px solid ${colors.accent}`,
                background: colors.accentSoft,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.accent }}>
                  Idea {scriptVariantIndex + 1} of {variantTotal}
                  {activeVariant.style ? ` · ${toneStyleLabel(activeVariant.style)}` : ""}
                  {activeVariant.source === "story" ? " · your story" : ""}
                  {previewDiffersFromActive ? " · preview" : " · selected"}
                </span>
                <button
                  type="button"
                  disabled={isMixing}
                  onClick={onCloseScriptPicker}
                  style={{
                    padding: "2px 8px",
                    border: "none",
                    background: "transparent",
                    color: colors.textMuted,
                    fontSize: "0.68rem",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
              {previewDiffersFromActive && (
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "0.68rem",
                    color: colors.textMuted,
                    lineHeight: 1.4,
                  }}
                >
                  Not active yet — your voice still uses the script in the box below until you select this
                  idea.
                </p>
              )}
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  color: colors.text,
                }}
              >
                {activeVariant.script}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  disabled={isMixing || variantTotal < 2}
                  onClick={onPrevScript}
                  style={navBtnStyle(isMixing || variantTotal < 2)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={isMixing || !previewDiffersFromActive}
                  onClick={onApplyScript}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "999px",
                    border: `1px solid ${colors.accent}`,
                    background: previewDiffersFromActive ? colors.accent : colors.accentSoft,
                    color: previewDiffersFromActive ? colors.bg : colors.accent,
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    cursor: isMixing || !previewDiffersFromActive ? "not-allowed" : "pointer",
                    opacity: isMixing ? 0.5 : 1,
                  }}
                >
                  {previewDiffersFromActive ? "Select this idea" : "✓ Already selected"}
                </button>
                <button
                  type="button"
                  disabled={isMixing || variantTotal < 2}
                  onClick={onNextScript}
                  style={navBtnStyle(isMixing || variantTotal < 2)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: colors.text }}>
                Active script
              </span>
              <span style={badgeStyle(scriptBadge.tone)}>{scriptBadge.label}</span>
            </div>
            <textarea
              value={state.narrationScript}
              onChange={(e) => onNarrationChange(e.target.value)}
              disabled={isMixing}
              rows={4}
              placeholder="Type what the voice should say — or browse ideas above."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: "8px",
                border: `2px solid ${
                  scriptPulse || activeScript ? colors.accent : colors.border
                }`,
                background: scriptPulse ? colors.accentSoft : colors.surfaceAlt,
                color: colors.text,
                fontSize: "0.85rem",
                lineHeight: 1.5,
                resize: "vertical",
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}
            />
            {activeScript && (
              <p style={{ margin: "6px 0 0", fontSize: "0.65rem", color: colors.accent, fontWeight: 700 }}>
                ✓ Add voice &amp; music uses this text
              </p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: colors.textFaint, marginBottom: "8px" }}>
              Gender
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { id: "female", label: "Female" },
                { id: "male", label: "Male" },
              ].map((g) => (
                <Pill
                  key={g.id}
                  active={(state.voiceGender || "female") === g.id}
                  disabled={isMixing}
                  colors={colors}
                  onClick={() => patch({ voiceGender: g.id })}
                >
                  {g.label}
                </Pill>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: colors.textFaint, marginBottom: "6px" }}>
              Voice tone
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {VOICE_STYLES.map((v) => (
                <Pill
                  key={v.id}
                  active={state.voiceStyle === v.id}
                  disabled={isMixing}
                  colors={colors}
                  onClick={() => patch({ voiceStyle: v.id })}
                >
                  {v.label}
                </Pill>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "6px",
                gap: "8px",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: colors.textFaint }}>Music mood</div>
              <div style={{ fontSize: "0.68rem", color: colors.textMuted, fontWeight: 600 }}>
                {state.musicVolume ?? 45}%
              </div>
            </div>
            <input
              type="range"
              min={15}
              max={80}
              step={5}
              disabled={isMixing}
              value={state.musicVolume ?? 45}
              onChange={(e) => patch({ musicVolume: Number(e.target.value) })}
              style={{ width: "100%", marginBottom: "8px", accentColor: colors.accent }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {MUSIC_MOODS.map((m) => (
                <Pill
                  key={m.id}
                  active={state.musicMood === m.id}
                  disabled={isMixing}
                  colors={colors}
                  onClick={() => patch({ musicMood: m.id })}
                >
                  {m.emoji} {m.label}
                </Pill>
              ))}
            </div>
          </div>

          {settingsPending && (
            <p style={{ margin: "0 0 10px", fontSize: "0.68rem", color: colors.accent }}>
              Settings changed — tap Re-make below.
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <HoverTip block tip="Adds voice and background music to your clip.">
              <NeonButton size="sm" disabled={!canMixAudio || isMixing} onClick={onMixAudio}>
                {isMixing ? "Adding…" : hasFinal ? "Re-make voice & music" : "Add voice & music"}
              </NeonButton>
            </HoverTip>
          </div>

          <StepGuideLabel complete={step5Complete} active={step5Active} colors={colors} compact>
            {STEP_LABELS[5]}
          </StepGuideLabel>

          {audioMixError && (
            <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "#ff8a8a", lineHeight: 1.4 }}>
              {audioMixError}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
