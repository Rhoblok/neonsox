import { useMemo } from "react"
import { Link } from "react-router-dom"
import { AD_THEMES, AD_TONES, THEME_SETTINGS } from "../../lib/adCreativeOptions"
import { INDUSTRY_GROUPS } from "../../lib/industries"
import { formatMarketSummary } from "../../lib/marketCountries"
import { fixSpelling, fixSpellingList } from "../../lib/spellFix"
import { useTheme } from "../../context/ThemeContext"
import { STEP_LABELS } from "../../lib/studioSteps"
import { promptLengthLabel } from "../../lib/runwayPromptEstimate.js"
import BriefBrandStrip from "./BriefBrandStrip"
import StepGuideLabel from "./StepGuideLabel"

function BriefField({ label, children }) {
  const { colors } = useTheme()
  return (
    <div style={{ marginBottom: "8px" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: colors.textFaint,
          marginBottom: "4px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const fieldStyle = (colors) => ({
  width: "100%",
  padding: "8px 10px",
  background: colors.bg,
  border: `1px solid ${colors.border}`,
  borderRadius: "6px",
  color: colors.text,
  fontSize: "0.82rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
})

function spellBlur(field, value, patch, isList = false) {
  const fixed = isList ? fixSpellingList(value) : fixSpelling(value)
  if (fixed !== value) patch({ [field]: fixed })
}

export default function CampaignBriefPanel({ state, patch, disabled, step1Complete, step1Active, campaignSetup }) {
  const { colors } = useTheme()
  const inp = fieldStyle(colors)

  const useCustomIndustry = state.industryMode === "custom"

  const industryOptions = useMemo(
    () =>
      INDUSTRY_GROUPS.map((g) => (
        <optgroup key={g.id} label={g.label}>
          {g.industries.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </optgroup>
      )),
    []
  )

  const promptLength = useMemo(() => promptLengthLabel(state), [state])

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        padding: "14px 16px",
        background: colors.surfaceAlt,
        height: "100%",
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: colors.accent,
          marginBottom: "14px",
        }}
      >
        Campaign brief
      </div>

      <StepGuideLabel complete={step1Complete} active={step1Active} colors={colors} compact>
        {STEP_LABELS[1]}
      </StepGuideLabel>

      <BriefField label="Company Name">
        <input
          style={inp}
          placeholder="e.g. Clever Clean"
          value={state.companyName}
          disabled={disabled}
          spellCheck
          onChange={(e) => patch({ companyName: e.target.value })}
          onBlur={(e) => spellBlur("companyName", e.target.value, patch)}
        />
      </BriefField>

      <BriefField label="Industry">
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => patch({ industryMode: "list", industryCustom: "" })}
            style={{
              flex: 1,
              padding: "6px 8px",
              fontSize: "0.72rem",
              fontWeight: 700,
              borderRadius: "6px",
              border: `1px solid ${!useCustomIndustry ? colors.accent : colors.border}`,
              background: !useCustomIndustry ? colors.accentSoft : colors.bg,
              color: !useCustomIndustry ? colors.accent : colors.textMuted,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            Pick from list
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => patch({ industryMode: "custom", industry: "" })}
            style={{
              flex: 1,
              padding: "6px 8px",
              fontSize: "0.72rem",
              fontWeight: 700,
              borderRadius: "6px",
              border: `1px solid ${useCustomIndustry ? colors.accent : colors.border}`,
              background: useCustomIndustry ? colors.accentSoft : colors.bg,
              color: useCustomIndustry ? colors.accent : colors.textMuted,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            Type my own
          </button>
        </div>
        {useCustomIndustry ? (
          <input
            style={inp}
            placeholder="e.g. Janitorial Services"
            value={state.industryCustom}
            disabled={disabled}
            spellCheck
            onChange={(e) => patch({ industryCustom: e.target.value })}
            onBlur={(e) => spellBlur("industryCustom", e.target.value, patch)}
          />
        ) : (
          <select
            style={inp}
            value={state.industry}
            disabled={disabled}
            onChange={(e) => patch({ industry: e.target.value })}
          >
            <option value="">Select industry…</option>
            {industryOptions}
          </select>
        )}
      </BriefField>

      <BriefField label="Audience">
        <input
          style={inp}
          placeholder="e.g. corporate offices, shopping malls, restaurants"
          value={state.targetAudience}
          disabled={disabled}
          spellCheck
          onChange={(e) => patch({ targetAudience: e.target.value })}
          onBlur={(e) => spellBlur("targetAudience", e.target.value, patch, true)}
        />
      </BriefField>

      <BriefField label="Markets">
        <Link
          to="/markets"
          style={{
            display: "block",
            padding: "8px 10px",
            borderRadius: "6px",
            border: `1px solid ${colors.accent}`,
            background: colors.accentSoft,
            color: colors.accent,
            fontWeight: 700,
            fontSize: "0.82rem",
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          Choose markets on map →
        </Link>
        <p style={{ margin: "6px 0 0", fontSize: "0.72rem", color: colors.textFaint, lineHeight: 1.4 }}>
          {campaignSetup ? formatMarketSummary(campaignSetup) : "No markets selected yet"}
        </p>
      </BriefField>

      <BriefField label="Offer / deadline">
        <input
          style={inp}
          placeholder="e.g. Save 15% off by Aug 1st"
          value={state.deadlineOffer}
          disabled={disabled}
          spellCheck
          onChange={(e) => patch({ deadlineOffer: e.target.value })}
          onBlur={(e) => spellBlur("deadlineOffer", e.target.value, patch)}
        />
      </BriefField>

      <BriefField label="Goal">
        <input
          style={inp}
          placeholder="e.g. more traffic and job bookings"
          value={state.desiredOutcome}
          disabled={disabled}
          spellCheck
          onChange={(e) => patch({ desiredOutcome: e.target.value })}
          onBlur={(e) => spellBlur("desiredOutcome", e.target.value, patch)}
        />
      </BriefField>

      <BriefField label={state.adThemeMode === "custom" ? "My story" : "Ad theme"}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => patch({ adThemeMode: "list" })}
            style={{
              flex: 1,
              padding: "6px 8px",
              fontSize: "0.72rem",
              fontWeight: 700,
              borderRadius: "6px",
              border: `1px solid ${state.adThemeMode !== "custom" ? colors.accent : colors.border}`,
              background: state.adThemeMode !== "custom" ? colors.accentSoft : colors.bg,
              color: state.adThemeMode !== "custom" ? colors.accent : colors.textMuted,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            Pick from list
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => patch({ adThemeMode: "custom" })}
            style={{
              flex: 1,
              padding: "6px 8px",
              fontSize: "0.72rem",
              fontWeight: 700,
              borderRadius: "6px",
              border: `1px solid ${state.adThemeMode === "custom" ? colors.accent : colors.border}`,
              background: state.adThemeMode === "custom" ? colors.accentSoft : colors.bg,
              color: state.adThemeMode === "custom" ? colors.accent : colors.textMuted,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            Type my own
          </button>
        </div>
        {state.adThemeMode === "custom" ? (
          <textarea
            style={{ ...inp, minHeight: "120px", resize: "vertical", lineHeight: 1.45 }}
            placeholder="Describe your ad story — scenes, camera, mood (e.g. designer walks to subway, POV on neon socks…)"
            value={state.adThemeCustom}
            spellCheck
            onChange={(e) => patch({ adThemeCustom: e.target.value, adThemeMode: "custom" })}
            onBlur={(e) => spellBlur("adThemeCustom", e.target.value, patch)}
          />
        ) : (
          <select
            style={inp}
            value={state.adTheme}
            disabled={disabled}
            onChange={(e) => patch({ adTheme: e.target.value })}
          >
            <option value="">Choose theme…</option>
            {AD_THEMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "0.68rem",
            lineHeight: 1.35,
            color: colors.textFaint,
          }}
        >
          Your story: {promptLength.storyChars} characters
          {state.adThemeMode === "custom"
            ? ` · opening ~${promptLength.storySlice} chars used for video`
            : ""}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "0.68rem",
            lineHeight: 1.35,
            color: colors.textFaint,
            fontWeight: 500,
          }}
        >
          {promptLength.autoTrim
            ? `Video engine: auto-trims to ${promptLength.max} on generate — keep editing your full story here`
            : `Video engine: ${promptLength.sentLen} / ${promptLength.max} characters — within limit`}
        </p>
      </BriefField>

      <BriefField label="Tone">
        <select
          style={inp}
          value={state.adTone}
          disabled={disabled}
          onChange={(e) => patch({ adTone: e.target.value })}
        >
          <option value="">Choose tone…</option>
          {AD_TONES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </BriefField>

      <BriefField label="Setting">
        <select
          style={inp}
          value={state.themeSetting}
          disabled={disabled}
          onChange={(e) => patch({ themeSetting: e.target.value })}
        >
          <option value="">Choose setting…</option>
          {THEME_SETTINGS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </BriefField>

      <BriefBrandStrip state={state} patch={patch} disabled={disabled} />
    </div>
  )
}
