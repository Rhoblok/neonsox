export const STEP_LABELS = {
  1: "STEP 1 — SUMMARY",
  2: "STEP 2 — PICK A LOOK",
  3: "STEP 3 — GENERATE",
  4: "STEP 4 — PICK YOUR AD",
  5: "STEP 5 — VOICE & MUSIC",
  6: "STEP 6 — ON-SCREEN TEXT",
}

export const STEP_ORDER = [1, 2, 3, 4, 5, 6]

export function effectiveAdTheme(state) {
  if (state.adThemeMode === "custom") {
    return (state.adThemeCustom || "").trim()
  }
  return (state.adTheme || "").trim()
}

export function studioStepState(state, selectedGeneration) {
  const step1Complete =
    !!(state.industryCustom?.trim() || state.industry?.trim()) &&
    state.targetAudience.trim() &&
    effectiveAdTheme(state) &&
    state.adTone &&
    state.themeSetting &&
    state.companyName.trim()

  const step2Complete = !!state.selectedStylePreset
  const step3Complete = (state.generations || []).some((g) => g.status === "succeeded")
  const step4Complete = !!state.selectedGenerationId
  const step5Complete =
    !!(selectedGeneration?.cloudFinalOutputUrl || selectedGeneration?.finalOutputUrl) &&
    selectedGeneration?.audioMixStatus === "succeeded"
  const step6Complete =
    selectedGeneration?.textOverlaySkipped === true ||
    (!!(selectedGeneration?.cloudBrandedOutputUrl || selectedGeneration?.brandedOutputUrl) &&
      selectedGeneration?.textOverlayStatus === "succeeded")

  const complete = {
    1: step1Complete,
    2: step2Complete,
    3: step3Complete,
    4: step4Complete,
    5: step5Complete,
    6: step6Complete,
  }

  const firstOpen = STEP_ORDER.find((n) => !complete[n]) || null

  const active = {
    1: firstOpen === 1,
    2: firstOpen === 2,
    3: firstOpen === 3,
    4: firstOpen === 4,
    5: firstOpen === 5,
    6: firstOpen === 6,
  }

  return {
    step1Complete,
    step2Complete,
    step3Complete,
    step4Complete,
    step5Complete,
    step6Complete,
    active,
    complete,
    firstOpen,
  }
}

/** All 6 workflow steps done. */
export function allStudioStepsComplete(_state, steps) {
  return STEP_ORDER.every((n) => steps.complete[n])
}

function isLocalDevMediaUrl(url) {
  if (!url || typeof url !== "string") return false
  return url.includes("localhost") || url.startsWith("/api/media/")
}

/** Best playback URL for live studio preview — local branded beats stale cloud copies. */
export function generationPlaybackUrl(generation) {
  if (!generation) return null
  if (generation.brandedOutputUrl) return generation.brandedOutputUrl
  if (generation.cloudBrandedOutputUrl) return generation.cloudBrandedOutputUrl
  return (
    generation.cloudFinalOutputUrl ||
    generation.finalOutputUrl ||
    generation.cloudOutputUrl ||
    generation.outputUrl ||
    null
  )
}

/** URL to persist in Socials Tray — cloud first so playback works without local backend. */
export function exportPlaybackUrl(generation) {
  if (!generation) return null
  return (
    generation.cloudBrandedOutputUrl ||
    generation.cloudFinalOutputUrl ||
    generation.brandedOutputUrl ||
    generation.finalOutputUrl ||
    generation.cloudOutputUrl ||
    generation.outputUrl ||
    null
  )
}

/** Resolve tray item for video player, copy link, and download. */
export function trayItemPlaybackUrl(item) {
  if (!item) return null
  if (item.cloudVideoUrl) return item.cloudVideoUrl
  const url = item.videoUrl
  if (url && !isLocalDevMediaUrl(url)) return url
  return url || null
}

/** Raw clip URL for audio mix (never branded/final). */
export function generationMixSourceUrl(generation) {
  if (!generation) return null
  return generation.cloudOutputUrl || generation.outputUrl || null
}

/** Audio-mixed or raw clip for text overlay (never branded). */
export function generationOverlaySourceUrl(generation) {
  if (!generation) return null
  return (
    generation.cloudFinalOutputUrl ||
    generation.finalOutputUrl ||
    generation.cloudOutputUrl ||
    generation.outputUrl ||
    null
  )
}

export function generationHasPlayableClip(generation) {
  return !!generationMixSourceUrl(generation)
}

/** Underlying clip without Palette Editor company name (for checking baked-in video text). */
export function sourcePlaybackUrl(generation) {
  if (!generation) return null
  return (
    generation.cloudFinalOutputUrl ||
    generation.cloudOutputUrl ||
    generation.finalOutputUrl ||
    generation.outputUrl ||
    null
  )
}
