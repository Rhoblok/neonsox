/**
 * Builds the "AI Summary for Video Clip Rendering" from campaign brief inputs.
 * Custom creative themes get synthesized concept direction — not verbatim repeat.
 */

import { fixSpelling, fixSpellingList } from "./spellFix.js"
import { formatMarketSummary } from "./marketCountries.js"
import { buildNarrationScriptVariants, narrationHintForIndustry } from "./industryVoiceScripts.js"
import { effectiveAdTheme } from "./studioSteps.js"
import { AD_THEMES } from "./adCreativeOptions.js"
import { marketFieldsFromSetup } from "./campaignSetupStorage.js"

/** Runway renders no on-screen text — branding goes in voiceover (Step 4). */
export function buildRunwayOnScreenTextRule() {
  return "No on-screen text in the video clip. All messaging is voiceover only."
}

function isCustomCreativeTheme(brief, theme) {
  if (brief.adThemeMode === "custom") return true
  if (!theme || theme.length < 40) return false
  return !AD_THEMES.includes(theme)
}

import { sentenceBeats } from "./storyBeats.js"

function shorten(text, max = 140) {
  const t = String(text || "").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}

function toneRead(tone) {
  const map = {
    "Serious-Funny": "playful tension — real moments with a wink",
    Professional: "credible and polished",
    "Warm & Friendly": "approachable and human",
    "Bold & Urgent": "high energy with clear stakes",
    Inspirational: "uplifting and aspirational",
    Playful: "light, fun, and memorable",
    "Deadpan Humor": "dry comedy with a straight face",
  }
  return map[tone] || tone.toLowerCase()
}

function inferBrandMoment(theme, company) {
  const lower = theme.toLowerCase()
  if (lower.includes("sock")) return `${company || "Your brand"} lands on the neon socks as the hero product beat.`
  if (lower.includes("logo") || lower.includes("sign"))
    return `${company || "Your brand"} gets a clear brand presence without on-screen text in the raw clip.`
  return `${company || "Your brand"} should appear in the payoff — product, result, or unmistakable brand color.`
}

function buildCustomConceptSummary({
  industry,
  audience,
  deadline,
  outcome,
  theme,
  tone,
  setting,
  company,
  marketLine,
  languageLine,
}) {
  const beats = sentenceBeats(theme)
  const opening = beats[0] || theme
  const middle = beats.slice(1, Math.max(1, beats.length - 1))
  const climax = beats.length > 1 ? beats[beats.length - 1] : null

  const brandLine = company ? `${company} — ` : ""

  return [
    `${brandLine}Your ad plan`,
    "",
    "Creative direction (from your story):",
    `• Opening beat: ${shorten(opening, 160)}`,
    middle.length
      ? middle.map((b, i) => `• Scene ${i + 2}: ${shorten(b, 120)}`).join("\n")
      : `• Middle: Build visual momentum in ${setting.toLowerCase()}.`,
    climax && climax !== opening ? `• Payoff beat: ${shorten(climax, 140)}` : null,
    "",
    "Concept overview (what the viewer feels):",
    `A ${toneRead(tone)} story in a ${setting.toLowerCase()} world. The hook is visual and specific — not a generic tagline. ${audience || "Your audience"} should feel "I've seen this before" recognition in the first 2 seconds, then curiosity about what happens next.`,
    "",
    "Strategic lens:",
    `• Who it's for: ${audience || "your ideal customers"}.`,
    `• Goal: ${outcome || "more traffic and bookings"}.`,
    `• Tone execution: ${tone} — ${toneRead(tone)}.`,
    deadline ? `• Offer to land in VO or end card later: ${deadline}.` : null,
    marketLine && marketLine !== "No markets selected" ? `• Markets: ${marketLine}.` : null,
    languageLine ? `• Languages: ${languageLine}.` : null,
    "",
    "Brand integration:",
    inferBrandMoment(theme, company),
    "",
    "Runway direction:",
    `• Setting for generation: ${setting}.`,
    `• Industry context: ${industry}.`,
    "• Generated clip has no burned-in text — add voice in Step 5 and company name in Step 6.",
  ]
    .filter(Boolean)
    .join("\n")
}

function presetOpeningByTone({ tone, setting, theme, audience, company }) {
  const place = setting.toLowerCase()
  const who = audience || "your audience"
  const brand = company || "your brand"

  switch (tone) {
    case "Serious-Funny":
      return `Open on a ${place} beat that earns a quick smile — "${theme}" with real stakes and a wink, so ${who} leans in instead of scrolling past.`
    case "Warm & Friendly":
      return `Begin with a welcoming ${place} moment — "${theme}" told gently, so ${who} feels recognized and at ease with ${brand}.`
    case "Bold & Urgent":
      return `Hit fast in a ${place} frame — "${theme}" with clear momentum, so ${who} feels the clock ticking and the payoff within reach.`
    case "Inspirational":
      return `Start aspirational in ${place} — "${theme}" as a small brave choice that hints at a bigger story ${who} wants to join.`
    case "Playful":
      return `Lead with color and motion in ${place} — "${theme}" should feel fun inside the first two seconds, not like a corporate slide.`
    case "Deadpan Humor":
      return `Open dry in ${place} — "${theme}" delivered straight-faced while something subtly absurd happens; ${who} gets the joke without a laugh track.`
    default:
      return `Open on a ${place} scene that signals "${theme}" within 2 seconds. ${who} sees a relatable problem, then a clear ${brand} win.`
  }
}

function presetPayoffByTone({ tone, company, outcome }) {
  const brand = company || "Your brand"
  const goal = outcome.toLowerCase() || "more leads and bookings"

  switch (tone) {
    case "Serious-Funny":
      return `${brand} lands the win with competent delivery and just enough personality to stick — driving ${goal}.`
    case "Warm & Friendly":
      return `${brand} closes on trust and warmth — ${goal} through a human, inviting payoff.`
    case "Bold & Urgent":
      return `${brand} closes with momentum — act-now energy that pushes ${goal} over the line.`
    case "Inspirational":
      return `${brand} lifts the viewer toward a bigger version of themselves — ${goal} as the natural next step.`
    case "Playful":
      return `${brand} ends on delight — memorable, light energy that still moves ${goal}.`
    case "Deadpan Humor":
      return `${brand} resolves the bit without breaking character — ${goal}, understated and effective.`
    default:
      return `${brand} drives ${goal} with a polished, credible delivery.`
  }
}

function buildPresetConceptSummary({
  industry,
  audience,
  deadline,
  outcome,
  theme,
  tone,
  setting,
  company,
  marketLine,
  languageLine,
}) {
  const brandLine = company ? `${company} — ` : ""

  return [
    `${brandLine}Your ad plan`,
    "",
    `Strategy: ${industry} · ${theme} · ${tone} tone · ${setting}.`,
    "",
    "Concept overview:",
    presetOpeningByTone({ tone, setting, theme, audience, company }),
    "",
    "The payoff:",
    presetPayoffByTone({ tone, company, outcome }),
    "",
    "Tone execution:",
    `• Voice & pacing: ${tone} — ${toneRead(tone)}.`,
    `• Visual mood: ${setting} world, edited to match ${tone.toLowerCase()} delivery.`,
    "",
    "Call to action:",
    `• Who it's for: ${audience || "customers in your market"}.`,
    marketLine && marketLine !== "No markets selected" ? `• Markets: ${marketLine}.` : null,
    languageLine ? `• Ad languages: ${languageLine}.` : null,
    `• Main promise: ${outcome || "More traffic and bookings"}.`,
    deadline ? `• Special offer: ${deadline}.` : "• Next step: contact or book today.",
    "",
    "Your video clip stays text-free. Add voice in Step 5 and your company name in the Palette Editor (Step 6).",
  ]
    .filter(Boolean)
    .join("\n")
}

export function buildCampaignSummary(brief) {
  const industry = fixSpelling((brief.industryCustom || brief.industry || "").trim())
  const audience = fixSpellingList((brief.targetAudience || "").trim())
  const deadline = fixSpelling((brief.deadlineOffer || "").trim())
  const outcome = fixSpelling((brief.desiredOutcome || "").trim())
  const theme = fixSpelling(effectiveAdTheme(brief) || brief.adTheme || "")
  const tone = fixSpelling(brief.adTone || "")
  const setting = fixSpelling(brief.themeSetting || "")
  const company = fixSpelling((brief.companyName || brief.brandName || "").trim())
  const marketLine = brief.worldwideMarkets
    ? "Worldwide"
    : formatMarketSummary({
        homeCountry: brief.homeCountry,
        homeRegion: brief.homeRegion,
        targetMarkets: brief.targetMarkets || [],
        worldwideMarkets: brief.worldwideMarkets,
      })
  const languageLine = (brief.selectedLanguages || []).length
    ? brief.selectedLanguages.join(", ")
    : ""

  if (!industry) {
    return { summary: "", headline: "", cta: "", productName: "" }
  }

  const headline = outcome || `Grow your ${industry} business`
  const cta = deadline || "Book now"
  const productName = industry

  const summary = isCustomCreativeTheme(brief, theme)
    ? buildCustomConceptSummary({
        industry,
        audience,
        deadline,
        outcome,
        theme,
        tone,
        setting,
        company,
        marketLine,
        languageLine,
      })
    : buildPresetConceptSummary({
        industry,
        audience,
        deadline,
        outcome,
        theme,
        tone,
        setting,
        company,
        marketLine,
        languageLine,
      })

  return { summary, headline, cta, productName }
}

/** User-edited summary wins; otherwise build from brief fields. */
export function resolveCampaignSummary(brief, campaignSetup = null) {
  if (brief.campaignSummaryEdited && String(brief.campaignSummary || "").trim()) {
    return String(brief.campaignSummary).trim()
  }
  return buildCampaignSummary({ ...brief, ...marketFieldsFromSetup(campaignSetup) }).summary
}

/** ~10 second spoken script — Slick & Simple, industry-first (no outcome jargon). */
export function buildNarrationScript(brief) {
  const variants = buildNarrationScriptVariants({
    industry: fixSpelling((brief.industryCustom || brief.industry || "").trim()),
    industryCustom: fixSpelling((brief.industryCustom || brief.industry || "").trim()),
    companyName: fixSpelling((brief.companyName || brief.brandName || "").trim()),
    brandName: fixSpelling((brief.companyName || brief.brandName || "").trim()),
    deadlineOffer: fixSpelling((brief.deadlineOffer || "").trim()),
    adTone: fixSpelling(brief.adTone || ""),
    adThemeMode: brief.adThemeMode,
    adThemeCustom: fixSpelling(brief.adThemeCustom || ""),
    adTheme: fixSpelling(brief.adTheme || ""),
  })
  return variants[0]?.script || ""
}

export { buildNarrationScriptVariants, narrationHintForIndustry } from "./industryVoiceScripts.js"
