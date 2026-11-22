import { useMemo } from "react"
import { buildCampaignSummary } from "../../lib/campaignSummaryBuilder"
import { STEP_LABELS } from "../../lib/studioSteps"
import { useTheme } from "../../context/ThemeContext"
import StepGuideLabel from "./StepGuideLabel"
import { marketFieldsFromSetup } from "../../lib/campaignSetupStorage"

export default function AiSummaryPanel({
  state,
  campaignSetup,
  step1Complete,
  step1Active,
  onPatch,
}) {
  const { colors } = useTheme()

  const built = useMemo(
    () => buildCampaignSummary({ ...state, ...marketFieldsFromSetup(campaignSetup) }),
    [state, campaignSetup]
  )

  const hasIndustry = !!(state.industryCustom || state.industry)
  const displaySummary = state.campaignSummaryEdited
    ? state.campaignSummary
    : built.summary

  const refreshSummary = () => {
    if (
      state.campaignSummaryEdited &&
      !window.confirm("Replace your edits with a fresh summary from the brief?")
    ) {
      return
    }
    onPatch({ campaignSummary: built.summary, campaignSummaryEdited: false })
  }

  const inp = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    fontSize: "0.78rem",
    lineHeight: 1.45,
    borderRadius: "8px",
    border: `1px solid ${state.campaignSummaryEdited ? colors.accent : colors.border}`,
    background: colors.bg,
    color: colors.text,
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "200px",
  }

  return (
    <div
      style={{
        border: `1px solid ${colors.accent}`,
        borderRadius: "12px",
        padding: "12px 14px",
        background: colors.accentSoft,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: colors.accent,
            whiteSpace: "nowrap",
            textShadow: `0 0 12px ${colors.glow}, 0 0 22px rgba(56, 189, 248, 0.4)`,
          }}
        >
          Campaign Summary
        </div>
        {hasIndustry ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {state.campaignSummaryEdited ? (
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: colors.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Edited
              </span>
            ) : null}
            <button
              type="button"
              onClick={refreshSummary}
              title="Rebuild summary from your brief fields"
              style={{
                padding: "4px 10px",
                fontSize: "0.68rem",
                fontWeight: 700,
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.textMuted,
                cursor: "pointer",
              }}
            >
              ↻ Refresh
            </button>
          </div>
        ) : null}
      </div>

      {!hasIndustry ? (
        <p style={{ margin: 0, fontSize: "0.8rem", color: colors.textMuted, lineHeight: 1.45, fontStyle: "italic" }}>
          Fill in the brief on the left — your summary appears here automatically.
        </p>
      ) : (
        <>
          <p style={{ margin: "0 0 8px", fontSize: "0.68rem", color: colors.textMuted, lineHeight: 1.35 }}>
            Edit freely — fix any scene beat here. Video still uses <strong>Ad theme</strong> on the left;
            refresh rebuilds from the brief.
          </p>
          <textarea
            style={inp}
            value={displaySummary}
            spellCheck
            onChange={(e) =>
              onPatch({
                campaignSummary: e.target.value,
                campaignSummaryEdited: true,
              })
            }
          />
        </>
      )}

      <StepGuideLabel complete={step1Complete} active={step1Active} colors={colors} compact>
        {STEP_LABELS[1]}
      </StepGuideLabel>
    </div>
  )
}

export { buildCampaignSummary }
