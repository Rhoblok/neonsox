const STORAGE_KEY = "neonsox-palette-studio"
const STALE_PENDING_MS = 10 * 60 * 1000

/** Dev/config errors persisted before audio was enabled — drop so users can retry. */
function isStaleAudioConfigError(message = "") {
  const m = String(message).toLowerCase()
  return (
    m.includes(".env") ||
    m.includes("elevenlabs_audio_enabled") ||
    m.includes("audio mix is disabled")
  )
}

function reconcileGeneration(generation) {
  let g = { ...generation }

  if (g.status === "failed" && g.refunded) {
    return null
  }

  if (g.status === "pending") {
    const age = Date.now() - new Date(g.createdAt || 0).getTime()
    if (age > STALE_PENDING_MS) {
      return {
        ...g,
        status: "failed",
        refunded: true,
        error: "Render timed out — try restored.",
      }
    }
  }

  if (g.audioMixError && isStaleAudioConfigError(g.audioMixError)) {
    const { audioMixError, audioMixStatus, ...rest } = g
    return rest
  }

  return g
}

export const DEFAULT_STUDIO_STATE = {
  companyName: "",
  industryMode: "list",
  industry: "",
  industryCustom: "",
  targetAudience: "",
  deadlineOffer: "",
  desiredOutcome: "",
  adTheme: "",
  adThemeMode: "list",
  adThemeCustom: "",
  campaignSummary: "",
  campaignSummaryEdited: false,
  adTone: "",
  themeSetting: "",
  selectedStylePreset: "",
  productName: "",
  headline: "",
  cta: "",
  brandName: "",
  brandColors: "",
  logoUrl: "",
  logoSource: "",
  logoFileName: "",
  narrationScript: "",
  narrationScriptEdited: false,
  voiceStyle: "professional",
  voiceGender: "female",
  musicMood: "upbeat",
  musicVolume: 45,
  overlayColor: "yellow",
  overlaySize: "m",
  overlayPosition: "bottom",
  overlayPulse: "slow",
  overlayFontStyle: "bebas-neue",
  overlayFlashAt: 4,
  preventAiMistakes: true,
  retryCount: 0,
  triesAllowed: 5,
  generations: [],
  selectedGenerationId: null,
}

function occupiesSlot(generation) {
  if (generation.status === "succeeded") return true
  if (generation.status === "pending") return true
  if (generation.status === "failed" && !generation.refunded) return true
  return false
}

/** Finished clips only — pending/render does NOT lock the campaign. */
export function countConsumedTries(generations = []) {
  return generations.filter((g) => g.status === "succeeded").length
}

/** Next open tray slot (1-based). Reuses slots freed by refunded failures. */
export function nextRetryIndex(generations = [], triesAllowed = 5) {
  for (let slot = 1; slot <= triesAllowed; slot++) {
    const taken = generations.some((g) => g.retryIndex === slot && occupiesSlot(g))
    if (!taken) return slot
  }
  return triesAllowed + 1
}

/**
 * Fix persisted state: drop refunded failures, expire stale pending renders,
 * and sync retryCount to successful clips only.
 */
export function reconcileStudioState(state) {
  const safe = state && typeof state === "object" ? state : DEFAULT_STUDIO_STATE
  const generations = (safe.generations || [])
    .map(reconcileGeneration)
    .filter(Boolean)
    .filter((g) => !(g.status === "failed" && g.refunded))

  return {
    ...safe,
    generations,
    preventAiMistakes: safe.preventAiMistakes !== false,
    retryCount: countConsumedTries(generations),
    musicVolume: Math.min(80, Math.max(15, Number(safe.musicVolume) || 45)),
    voiceGender: safe.voiceGender === "male" ? "male" : "female",
    overlayFlashAt: [2, 4, 6].includes(Number(safe.overlayFlashAt)) ? Number(safe.overlayFlashAt) : 4,
  }
}

export function loadStudioState(campaignKey) {
  if (typeof window === "undefined") return { ...DEFAULT_STUDIO_STATE }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    return reconcileStudioState({ ...DEFAULT_STUDIO_STATE, ...(all[campaignKey] || {}) })
  } catch {
    return { ...DEFAULT_STUDIO_STATE }
  }
}

export function saveStudioState(campaignKey, state) {
  if (typeof window === "undefined") return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    const reconciled = reconcileStudioState(state)
    const toSave = {
      ...reconciled,
      retryCount: countConsumedTries(reconciled.generations),
    }
    if (toSave.logoUrl?.startsWith("data:image/")) {
      toSave.logoUrl = ""
    }
    all[campaignKey] = toSave
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* ignore quota errors during dev */
  }
}

/** Stable key from campaign frame fields (top form). */
export function studioKeyFromSetup(setup) {
  const name = (setup?.name || "draft").trim().toLowerCase()
  const tier = setup?.tier || "tier1"
  return `${tier}:${name || "draft"}`
}
