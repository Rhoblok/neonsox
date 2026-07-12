/**
 * Runway prompt builder — zero on-screen text (Runway cannot render text reliably).
 */

const HUMAN_RISK_PRESETS = new Set([
  "cute_avatar",
  "moody_portrait",
  "bold_portrait",
  "people_street_photography",
  "advertising_testimonial",
  "animated_character",
  "cute_character",
  "close_up",
])

const STYLE_HINTS = {
  cute_isometric: "Soft isometric 3D product scene, playful commercial look.",
  neon: "Neon-lit environment, electric colors, product hero shot.",
  low_poly: "Low-poly 3D geometric product showcase, clean commercial motion.",
  clay_model: "Hand-sculpted clay texture 3D objects, whimsical commercial look.",
  studio_shot: "Professional studio product lighting, clean background, commercial packshot motion.",
  indoor: "Bright modern interior environment, professional service context.",
  outdoor: "Sunny outdoor environment, wide establishing shots, commercial service vehicle or storefront.",
  advertising_product: "Classic product advertising, hero product on pedestal, smooth camera move.",
  brutalist_product: "Bold brutalist product staging, geometric shapes, dramatic lighting.",
  summer_product: "Bright summery product styling, warm natural light.",
  stone_carving: "Stylized stone-sculpted 3D objects, carved texture.",
  origami: "Folded paper aesthetic, origami-style 3D shapes.",
  plastic_bricks: "Modular colorful brick-built 3D scene.",
  animated_character: "Animated character commercial, friendly stylized figures, polished motion.",
  default: "Polished commercial video, cinematic b-roll, professional advertising quality.",
}

export const RUNWAY_PROMPT_MAX = 1000

/** Runway rejects prompts over 1000 characters. */
export function trimRunwayPrompt(text, maxLen = RUNWAY_PROMPT_MAX) {
  const trimmed = String(text || "").trim()
  if (trimmed.length <= maxLen) return trimmed
  const slice = trimmed.slice(0, maxLen - 1).trimEnd()
  const lastSpace = slice.lastIndexOf(" ")
  const cut = lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice
  return `${cut}…`
}

export const CONTENT_SAFETY =
  "Family-friendly commercial video. No violence, no weapons, no suggestive content."

export const NO_TEXT_RULE =
  "Absolutely no text in the video. No words, letters, numbers, typography, signage, banners, " +
  "subtitles, captions, logos with letters, uniform text, vehicle lettering, storefront signs, " +
  "brand names, company names, headlines, watermarks, or floating text overlays anywhere in the frame. " +
  "Pure visuals only — all text is added later in post-production."

export const NO_BUILDING_TEXT_RULE =
  "Blank building facades only: no shop signs, no awnings with lettering, no subway entrance signs, " +
  "no billboards, no graffiti text, no window decals, no painted words on walls, doors, or railings."

const STREET_PRESETS = new Set(["people_street_photography", "outdoor"])

const PROP_PATTERNS = [
  [/\bbriefcase\b/i, "briefcase"],
  [/\bsuitcase\b/i, "suitcase"],
  [/\b(handbag|purse|tote bag|portfolio)\b/i, "bag"],
  [/\bcoffee\b/i, "coffee cup"],
]

function storyText(payload) {
  return String(payload.brief?.adTheme || payload.brief?.creativeTheme || "").trim()
}

function isHumanScene(payload) {
  const preset = payload.selectedStylePreset || ""
  if (HUMAN_RISK_PRESETS.has(preset)) return true
  const story = storyText(payload).toLowerCase()
  const setting = (payload.brief?.themeSetting || "").toLowerCase()
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

/** Runway often drops handheld props mid-clip — strict mode bans them; otherwise lock continuity. */
function buildContinuityRules(payload) {
  if (!isHumanScene(payload)) return []

  const story = storyText(payload)
  const sockLine = /\b(sock|socks|neon)\b/i.test(story)
    ? "Bright neon socks stay visible on her feet in every frame."
    : null

  if (isStrictNoText(payload)) {
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

export const STRICT_NO_TEXT_RULE =
  "CRITICAL — no writing or readable text anywhere: no signs, letters, numbers, storefronts, " +
  "awnings, billboards, subway markers, graffiti, labels, or glyphs on buildings, walls, or props. " +
  "Silent visuals only."

export const ELIMINATE_PROPS_RULE =
  "Eliminate props: no handheld objects — empty hands only; no briefcases, bags, purses, phones, cups, " +
  "or items appearing or vanishing mid-shot."

function isStrictNoText(payload) {
  return payload.preventAiMistakes !== false
}

function textGuardRules(payload, presetId) {
  if (isStrictNoText(payload)) {
    return [STRICT_NO_TEXT_RULE, ELIMINATE_PROPS_RULE]
  }
  const buildingTextRule = STREET_PRESETS.has(presetId) ? NO_BUILDING_TEXT_RULE : ""
  return [NO_TEXT_RULE, buildingTextRule].filter(Boolean)
}

export const NO_LOGO_TEXT_RULE =
  "If a reference image is provided, use it for color and mood only. Do not display the reference " +
  "image, logo, brand name, or any letters from the reference anywhere in the video."

export function isModerationError(message = "") {
  return /content moderation|moderation|safety|policy/i.test(String(message))
}

export function isRefundableError(message = "") {
  const msg = String(message)
  return (
    isModerationError(msg) ||
    /timed out|timeout/i.test(msg) ||
    /insufficient|credit|balance/i.test(msg) ||
    /validation of body/i.test(msg)
  )
}

function styleHint(presetId) {
  if (HUMAN_RISK_PRESETS.has(presetId)) {
    return STYLE_HINTS.default
  }
  return STYLE_HINTS[presetId] || STYLE_HINTS.default
}

function cleanIndustry(payload) {
  return (payload.brief?.industry || payload.productName || "business").trim()
}

function buildPromptCore(payload, extra = "") {
  const industry = cleanIndustry(payload)
  const presetId = payload.selectedStylePreset || ""
  const setting = payload.brief?.themeSetting || "professional setting"
  const tone = payload.brief?.adTone || "professional"
  const creative = String(payload.brief?.adTheme || payload.brief?.creativeTheme || "").trim()
  const creativeCap = isStrictNoText(payload) ? 120 : 180
  const creativeLine = creative
    ? `Story: ${creative.slice(0, creativeCap)}${creative.length > creativeCap ? "…" : ""}.`
    : ""
  const continuityRules = buildContinuityRules(payload)
  const textRules = textGuardRules(payload, presetId)

  return trimRunwayPrompt(
    [
      ...textRules,
      `10-second silent TV commercial for ${industry}.`,
      styleHint(presetId),
      `Setting: ${setting}. Mood: ${tone}.`,
      creativeLine,
      ...continuityRules,
      CONTENT_SAFETY,
      extra,
      "Smooth camera motion, high-end advertising quality.",
    ]
      .filter(Boolean)
      .join(" ")
  )
}

export function buildRunwayPrompt(payload) {
  return buildPromptCore(payload)
}

export function buildSafeFallbackPrompt(payload) {
  return buildPromptCore(
    payload,
    "Abstract stylized commercial showcase in a clean modern studio. Soft gradient background, smooth slow camera push-in."
  )
}

export function buildMinimalFallbackPrompt(payload) {
  const industry = cleanIndustry(payload)
  const textRules = isStrictNoText(payload)
    ? [STRICT_NO_TEXT_RULE, ELIMINATE_PROPS_RULE]
    : ["No text or logos in frame."]

  return trimRunwayPrompt(
    [
      ...textRules,
      `Calm commercial B-roll for ${industry}.`,
      "Clean studio lighting, smooth slow camera motion.",
      CONTENT_SAFETY,
    ].join(" ")
  )
}
