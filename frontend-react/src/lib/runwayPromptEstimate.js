import { effectiveAdTheme } from "./studioSteps.js"

export const RUNWAY_PROMPT_MAX = 1000

const NO_TEXT_RULE =
  "Absolutely no text in the video. No words, letters, numbers, typography, signage, banners, " +
  "subtitles, captions, logos with letters, uniform text, vehicle lettering, storefront signs, " +
  "brand names, company names, headlines, watermarks, or floating text overlays anywhere in the frame. " +
  "Pure visuals only — all text is added later in post-production."

const NO_BUILDING_TEXT_RULE =
  "Blank building facades only: no shop signs, no awnings with lettering, no subway entrance signs, " +
  "no billboards, no graffiti text, no window decals, no painted words on walls, doors, or railings."

const STRICT_NO_TEXT_RULE =
  "CRITICAL — no writing or readable text anywhere: no signs, letters, numbers, storefronts, " +
  "awnings, billboards, subway markers, graffiti, labels, or glyphs on buildings, walls, or props. " +
  "Silent visuals only."

const ELIMINATE_PROPS_RULE =
  "Eliminate props: no handheld objects — empty hands only; no briefcases, bags, purses, phones, cups, " +
  "or items appearing or vanishing mid-shot."

const STREET_PRESETS = new Set(["people_street_photography", "outdoor"])

const HUMAN_SCENE_PRESETS = new Set([
  "cute_avatar",
  "moody_portrait",
  "bold_portrait",
  "people_street_photography",
  "advertising_testimonial",
  "animated_character",
  "cute_character",
  "close_up",
])

const PROP_PATTERNS = [
  [/\bbriefcase\b/i, "briefcase"],
  [/\bsuitcase\b/i, "suitcase"],
  [/\b(handbag|purse|tote bag|portfolio)\b/i, "bag"],
  [/\bcoffee\b/i, "coffee cup"],
]

function isHumanScene(state) {
  const preset = state.selectedStylePreset || ""
  if (HUMAN_SCENE_PRESETS.has(preset)) return true
  const story = effectiveAdTheme(state).toLowerCase()
  const setting = (state.themeSetting || "").toLowerCase()
  return /\b(walk|walks|walking|sidewalk|brownstone|subway|designer|commute|steps)\b/.test(
    `${story} ${setting}`
  )
}

function explicitProps(story = "") {
  const found = []
  for (const [pattern, label] of PROP_PATTERNS) {
    if (pattern.test(story) && !found.includes(label)) found.push(label)
  }
  return found
}

function buildContinuityRules(state) {
  if (!isHumanScene(state)) return []

  const story = effectiveAdTheme(state)
  const sockLine = /\b(sock|socks|neon)\b/i.test(story)
    ? "Bright neon socks stay visible on her feet in every frame."
    : null
  const strict = state.preventAiMistakes !== false

  if (strict) {
    return [
      "One consistent character: same outfit and hair every frame; hands stay empty throughout.",
      sockLine,
    ].filter(Boolean)
  }

  const lines = [
    "One consistent character for the full clip: same outfit, hair, and handheld items in every frame; nothing pops in or vanishes mid-walk.",
  ]

  const props = explicitProps(story)
  if (props.length) {
    lines.push(`Keep the ${props.join(" and ")} in her hand throughout — never dropped or missing.`)
  }

  if (/\b(sock|socks|neon)\b/i.test(story)) {
    lines.push(sockLine || "Bright neon socks stay visible on her feet in every frame.")
  }

  return lines
}

const CONTENT_SAFETY =
  "Family-friendly commercial video. No violence, no weapons, no suggestive content."

const STYLE_DEFAULT =
  "Polished commercial video, cinematic b-roll, professional advertising quality."

export function storySliceLimit(state) {
  return state.preventAiMistakes !== false ? 120 : 180
}

function textGuardRules(state) {
  const strict = state.preventAiMistakes !== false
  if (strict) {
    return [STRICT_NO_TEXT_RULE, ELIMINATE_PROPS_RULE]
  }
  const buildingTextRule = STREET_PRESETS.has(state.selectedStylePreset) ? NO_BUILDING_TEXT_RULE : ""
  return [NO_TEXT_RULE, buildingTextRule].filter(Boolean)
}

/** Mirrors backend trimRunwayPrompt. */
export function trimRunwayPrompt(text, maxLen = RUNWAY_PROMPT_MAX) {
  const trimmed = String(text || "").trim()
  if (trimmed.length <= maxLen) return trimmed
  const slice = trimmed.slice(0, maxLen - 1).trimEnd()
  const lastSpace = slice.lastIndexOf(" ")
  const cut = lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice
  return `${cut}…`
}

/** Full engine prompt before auto-trim (mirrors backend). */
export function buildRunwayPromptPreview(state) {
  const industry = (state.industryCustom || state.industry || "business").trim()
  const setting = (state.themeSetting || "professional setting").trim()
  const tone = (state.adTone || "professional").trim()
  const creative = effectiveAdTheme(state)
  const creativeCap = storySliceLimit(state)
  const creativeLine = creative
    ? `Story: ${creative.slice(0, creativeCap)}${creative.length > creativeCap ? "…" : ""}.`
    : ""
  const continuityRules = buildContinuityRules(state)
  const textRules = textGuardRules(state)

  return [
    ...textRules,
    `10-second silent TV commercial for ${industry}.`,
    STYLE_DEFAULT,
    `Setting: ${setting}. Mood: ${tone}.`,
    creativeLine,
    ...continuityRules,
    CONTENT_SAFETY,
    "Smooth camera motion, high-end advertising quality.",
  ]
    .filter(Boolean)
    .join(" ")
}

/** Mirrors backend prompt length so we can warn before Generate Video. */
export function estimateRunwayPromptLength(state) {
  return buildRunwayPromptPreview(state).length
}

export function isRunwayPromptTooLong(state) {
  return estimateRunwayPromptLength(state) > RUNWAY_PROMPT_MAX
}

export const PROMPT_TOO_LONG_MESSAGE = "Shorten your prompt — 1000 characters max."

export function isPromptLengthErrorMessage(error = "") {
  return /shorten your prompt|1000 character|too long for the video|validation of body/i.test(
    String(error)
  )
}

export function isInternalGlitchError(error = "") {
  return /cannot read propert|null \(reading|undefined \(reading/i.test(String(error))
}

export function promptLengthLabel(state) {
  const storyChars = effectiveAdTheme(state).length
  const storySlice = storySliceLimit(state)
  const rawLen = estimateRunwayPromptLength(state)
  const sentLen = trimRunwayPrompt(buildRunwayPromptPreview(state)).length
  return {
    used: rawLen,
    sentLen,
    max: RUNWAY_PROMPT_MAX,
    over: rawLen > RUNWAY_PROMPT_MAX,
    autoTrim: rawLen > RUNWAY_PROMPT_MAX,
    storyChars,
    storySlice,
  }
}
