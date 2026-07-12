import { useState } from "react"

import NeonButton from "../NeonButton"

import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"

import { usePaletteStudio } from "../../hooks/usePaletteStudio"

import { countConsumedTries } from "../../lib/paletteStudioStorage"

import { studioStepState, STEP_LABELS, allStudioStepsComplete } from "../../lib/studioSteps"

import AiSummaryPanel from "./AiSummaryPanel"

import CampaignBriefPanel from "./CampaignBriefPanel"

import ClipNest from "./ClipNest"

import FinalizeAdPanel from "./FinalizeAdPanel"

import HoverTip from "./HoverTip"

import PreventAiMistakesToggle from "./PreventAiMistakesToggle"

import LockedCampaignBanner from "./LockedCampaignBanner"

import RemainingTriesBadge from "./RemainingTriesBadge"

import StepGuideLabel from "./StepGuideLabel"

import StudioStepProgress from "./StudioStepProgress"

import StylePresetGrid from "./StylePresetGrid"

import TextOverlayPanel from "./TextOverlayPanel"

import SocialsTrayPanel from "./SocialsTrayPanel"

import VideoViewerModal from "./VideoViewerModal"

export default function PaletteGenerationStudio({
  campaignSetup,
  onBuyNewCampaign,
  platforms = [],
  platformAllowance = 2,
  onTogglePlatform,
}) {
  const { colors } = useTheme()
  const { user } = useAuth()

  const {
    state,
    patch,
    remainingTries,
    isLocked,
    showLocked,
    studioReady,
    studioHydrating,
    canGenerate,
    canMixAudio,
    generating,
    mixingAudio,
    generate,
    selectGeneration,
    deselectGeneration,
    mixAudio,
    burnTextOverlay,
    skipTextOverlay,
    exportToSocials,
    canApplyTextOverlay,
    canSkipTextOverlay,
    applyingOverlay,
    suggestNarration,
    narrationPulseAt,
    scriptPickerOpen,
    scriptVariants,
    scriptVariantIndex,
    prevScriptVariant,
    nextScriptVariant,
    applyScriptVariant,
    closeScriptPicker,
    updateNarrationScript,
    narrationHint,
    selectedGeneration,
    toast,
    tryRestoredFlash,
  } = usePaletteStudio(campaignSetup, user?.id)

  const [viewerGen, setViewerGen] = useState(null)

  const steps = studioStepState(state, selectedGeneration)
  const allStepsComplete = allStudioStepsComplete(state, steps)

  return (
    <div style={{ marginTop: "16px", textAlign: "left" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: colors.text }}>
          AI Video Studio
        </h4>
        <RemainingTriesBadge
          remaining={remainingTries}
          total={state.triesAllowed}
          locked={showLocked}
          loading={studioHydrating}
          highlight={tryRestoredFlash}
        />
      </div>

      {toast && (
        <div
          style={{
            marginBottom: "10px",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "0.82rem",
            fontWeight: 600,
            background:
              toast.type === "success" || toast.type === "restored"
                ? colors.accentSoft
                : "rgba(255,107,107,0.12)",
            color: toast.type === "success" || toast.type === "restored" ? colors.accent : "#ff8a8a",
          }}
        >
          {toast.message}
        </div>
      )}

      <StudioStepProgress steps={steps} colors={colors} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 1fr) minmax(300px, 1.05fr)",
          gap: "14px",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <CampaignBriefPanel
            state={state}
            patch={patch}
            disabled={false}
            step1Complete={steps.complete[1]}
            step1Active={steps.active[1]}
            campaignSetup={campaignSetup}
          />
          <SocialsTrayPanel
            campaignSetup={campaignSetup}
            platforms={platforms}
            platformAllowance={platformAllowance}
            onTogglePlatform={onTogglePlatform}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <AiSummaryPanel
            state={state}
            campaignSetup={campaignSetup}
            step1Complete={steps.complete[1]}
            step1Active={steps.active[1]}
            onPatch={patch}
          />

          <HoverTip tip="Pick the look and feel for your 10-second video ad.">
            <section
              style={{
                border: `1px solid ${steps.active[2] && !steps.complete[2] ? colors.accent : colors.border}`,
                borderRadius: "10px",
                padding: "10px 12px",
                background: steps.active[2] && !steps.complete[2] ? colors.accentSoft : colors.surfaceAlt,
                boxShadow: steps.active[2] && !steps.complete[2] ? colors.glowShadow : "none",
              }}
            >
              <StepGuideLabel complete={steps.complete[2]} active={steps.active[2]} colors={colors} compact>
                {STEP_LABELS[2]}
              </StepGuideLabel>
              <StylePresetGrid
                selectedId={state.selectedStylePreset}
                onSelect={(id) => patch({ selectedStylePreset: id })}
              />
            </section>
          </HoverTip>

          <section
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              padding: "10px 12px",
              background: colors.bg,
            }}
          >
            <StepGuideLabel complete={steps.complete[3]} active={steps.active[3]} colors={colors} compact>
              {STEP_LABELS[3]}
            </StepGuideLabel>

            <PreventAiMistakesToggle
              checked={state.preventAiMistakes !== false}
              disabled={generating}
              onChange={(on) => patch({ preventAiMistakes: on })}
            />

            <HoverTip
              block
              tip="Creates your video from the brief. Visuals only — no words on screen yet. Usually takes 2–5 minutes."
            >
              <NeonButton disabled={!canGenerate} onClick={generate} size="md">
                {generating ? "Rendering…" : "Generate Video"}
              </NeonButton>
            </HoverTip>

            <ClipNest
              triesAllowed={state.triesAllowed}
              generations={state.generations || []}
              selectedGenerationId={state.selectedGenerationId}
              generating={generating}
              onOpen={setViewerGen}
              onDeselect={state.selectedGenerationId ? deselectGeneration : undefined}
              step4Complete={steps.complete[4]}
              step4Active={steps.active[4]}
            />
          </section>

          <FinalizeAdPanel
            selectedGeneration={selectedGeneration}
            state={state}
            patch={patch}
            mixingAudio={mixingAudio}
            canMixAudio={canMixAudio}
            onMixAudio={mixAudio}
            onSuggestScript={suggestNarration}
            onNarrationChange={updateNarrationScript}
            narrationHint={narrationHint}
            narrationPulseAt={narrationPulseAt}
            scriptPickerOpen={scriptPickerOpen}
            scriptVariants={scriptVariants}
            scriptVariantIndex={scriptVariantIndex}
            onPrevScript={prevScriptVariant}
            onNextScript={nextScriptVariant}
            onApplyScript={applyScriptVariant}
            onCloseScriptPicker={closeScriptPicker}
            step5Complete={steps.complete[5]}
            step5Active={steps.active[5]}
            allStepsComplete={allStepsComplete}
            onExportToSocials={exportToSocials}
          />

          <TextOverlayPanel
            selectedGeneration={selectedGeneration}
            state={state}
            patch={patch}
            applyingOverlay={applyingOverlay}
            canApplyOverlay={canApplyTextOverlay}
            canSkipOverlay={canSkipTextOverlay}
            onApplyOverlay={burnTextOverlay}
            onSkipOverlay={skipTextOverlay}
            step6Complete={steps.complete[6]}
            step6Active={steps.active[6]}
          />
        </div>
      </div>

      {showLocked && (
        <LockedCampaignBanner
          onBuyNew={onBuyNewCampaign}
          triesUsed={countConsumedTries(state.generations || [])}
          triesAllowed={state.triesAllowed}
          remaining={remainingTries}
        />
      )}

      <VideoViewerModal
        generation={viewerGen}
        stylePresetId={state.selectedStylePreset}
        isSelected={viewerGen?.id === state.selectedGenerationId}
        onSelect={selectGeneration}
        onDeselect={deselectGeneration}
        onClose={() => setViewerGen(null)}
      />
    </div>
  )
}
