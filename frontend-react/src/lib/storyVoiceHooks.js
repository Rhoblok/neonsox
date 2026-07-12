/**
 * Story-aware voice hooks from My Story.
 * Only polished composites or explicitly rewritten beats — never raw story dumps.
 */

import { sentenceBeats } from "./storyBeats.js"
import { resolveToneStyle } from "./industryVoiceScripts.js"

function shortenForVoice(text, max = 88) {
  const t = String(text || "").trim().replace(/\s+/g, " ")
  if (t.length <= max) return t
  const slice = t.slice(0, max - 1).trimEnd()
  const lastSpace = slice.lastIndexOf(" ")
  return `${lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice}…`
}

function isProductionNote(beat = "") {
  const s = beat.toLowerCase().trim()
  if (!s) return true
  if (/^(clip|video|ad|scene|shot|opening|middle|payoff)\s+(should|must|needs?)\b/.test(s)) return true
  if (/\bshould accomplish\b/.test(s)) return true
  if (/\b(look|feel|seem)\s+real\b/.test(s)) return true
  if (/\b\d+\s*-?\s*seconds?\b/.test(s) && /\b(accomplish|fit|within|all scenes|entire)\b/.test(s)) {
    return true
  }
  if (/^(ensure|make sure|remember|note|important|do not|don't|no text|prevent|runway)\b/.test(s)) {
    return true
  }
  if (/^(wide shot|close[- ]?up|cut to|b-?roll|camera|fade|pan)\b/.test(s)) return true
  if (/^scene\s*\d+/i.test(s)) return true
  return false
}

/** Camera / stage directions that should never be spoken. */
function isCameraOrStageDirection(beat = "") {
  const s = beat.toLowerCase()
  return (
    /\b(zoom|zooms in|pan|tracking shot|picture this|pov|close[- ]?up|cut to)\b/.test(s) ||
    /\b(solid colored|neon-flashing|flashing socks)\b/.test(s) ||
    /\bthe picture this\b/.test(s)
  )
}

/** Travelogue sentences — too literal for a 10s VO. */
function isLiteralTravelogue(beat = "") {
  const s = beat.toLowerCase()
  return (
    /\b(leaves her|walks to the|walks to|brownstone|based fashion designer)\b/.test(s) ||
    /\b(sits down to see|staring back at her|enters the subway, sits)\b/.test(s) ||
    /\bcliton\b/.test(s) ||
    beat.length > 95
  )
}

function narrativeBeats(story = "") {
  return sentenceBeats(story).filter(
    (beat) => !isProductionNote(beat) && !isCameraOrStageDirection(beat) && !isLiteralTravelogue(beat)
  )
}

const BEAT_REWRITES = [
  [/^cats notice the socks and begin following her\.?$/i, "Cats on the sidewalk — trailing the neon socks like it's their job."],
  [/^a (fashion )?brooklyn[- ]based fashion designer.*$/i, "Brooklyn designer energy — brownstone steps to the subway, socks leading the way."],
  [/^a (fashion )?brooklyn woman walks on the sidewalk\.?$/i, "A Brooklyn designer hits the sidewalk — neon socks, big energy."],
  [/^she goes to the subway entrance and expects chaos\.?$/i, "She braces for subway chaos at the entrance."],
  [/^instead[,.]?\s*a kitten greeting committee waits at the turnstile\.?$/i, "Instead? A kitten greeting committee at the turnstile."],
  [/^picture this:?\s*zooms? in on.*neon.*socks.*$/i, "Neon socks, close-up — the whole commute just got brighter."],
  [/^picture this:?\s*looks? down at (her |the )?neon socks( glowing)?\.?$/i, "Neon socks glowing on the steps — that's the whole mood."],
  [/^cats follow her to the subway\.?$/i, "The cats follow her all the way to the subway."],
  [/^she enters the subway.*cats staring.*$/i, "She sits down — every cat in the car is staring. Of course they are."],
]

/** Returns rewritten line, or null if beat should not be spoken verbatim. */
function humanizeBeat(beat) {
  const b = String(beat || "")
    .replace(/\bPOV\b/gi, "")
    .replace(/\bhas a dangling string\b/gi, "")
    .replace(/^(wide shot|close[- ]?up|cut to|camera)[^.]*\.?\s*/i, "")
    .replace(/\bcliton\b/gi, "Clinton")
    .replace(/\s{2,}/g, " ")
    .trim()

  if (!b || isCameraOrStageDirection(b) || isLiteralTravelogue(b)) return null

  for (const [pattern, replacement] of BEAT_REWRITES) {
    if (pattern.test(b)) return replacement
  }

  return null
}

export function extractStorySignals(story = "") {
  const lower = story.toLowerCase()
  return {
    hasCats: /\b(cats?|kittens?|feline)\b/.test(lower),
    hasSubway: /\b(subway|turnstile|metro|train|station)\b/.test(lower),
    hasSocks: /\bsocks?\b/.test(lower),
    hasNeon: /\bneon\b/.test(lower),
    hasBrooklyn: /\b(brooklyn|nyc|manhattan|new york|brownstone|clinton)\b/.test(lower),
    hasDesigner: /\b(designer|fashion)\b/.test(lower),
    hasSidewalk: /\b(sidewalk|street|walk|steps)\b/.test(lower),
    beats: narrativeBeats(story),
  }
}

function compositeHooks(signals, style, company) {
  const { hasCats, hasSubway, hasSocks, hasNeon, hasBrooklyn, hasDesigner, hasSidewalk } = signals
  const brand = company.trim()

  const byTone = {
    serious_funny: [
      hasCats && hasSubway && "She expected subway chaos — the kitten greeting committee had other plans.",
      hasNeon && hasSocks && "Neon socks hit first. The sidewalk story catches up a second later.",
      hasBrooklyn && hasDesigner && "Brooklyn designer walk — plot twist waiting at the turnstile.",
      hasCats && hasSidewalk && "Cat escort on the sidewalk? Sure. The socks still steal the scene.",
      hasSubway && hasSocks && "Subway entrance. Glowing socks. Somehow the cutest commute ever.",
      hasCats && hasNeon && "Cats followed the neon socks. Nobody questioned the commute.",
      brand && hasSocks && hasNeon && `${brand} — serious style, silly socks, Brooklyn attitude.`,
      hasSubway && hasCats && "Turnstile kittens. Straight face. Best commute plot twist ever.",
      hasBrooklyn && hasSubway && "Brownstone steps to the subway — socks bright, cats committed.",
      brand && hasCats && `${brand} — your commute now includes a whisker review committee.`,
      hasDesigner && hasSocks && "Designer taste, neon socks — the feet finally match the ambition.",
      hasNeon && hasBrooklyn && "Neon on the socks, Brooklyn on the attitude — both non-negotiable.",
    ],
    playful: [
      hasCats && hasSubway && "Cats, subway, neon socks — the commute got weird in the best way.",
      hasNeon && hasSocks && "Your feet called — they want neon. Loudly.",
      hasBrooklyn && "Brooklyn blocks, brighter socks, bigger smiles.",
      hasCats && "Cat-approved chaos — from sidewalk to subway.",
      brand && hasSocks && `${brand}: socks loud enough to start a sidewalk parade.`,
      hasSubway && hasCats && "Subway cats, neon socks — best supporting cast ever.",
    ],
    bold: [
      hasNeon && hasSocks && "Neon socks. Now. Before the sidewalk forgets your name.",
      hasSubway && "Own the subway entrance — start with what's on your feet.",
      brand && "This is the drop — grab it before the next train.",
      hasDesigner && "Designer energy isn't quiet — neither are these socks.",
    ],
    warm: [
      hasCats && hasSubway && "A softer commute — cats, kindness, and socks that feel like you.",
      hasBrooklyn && hasSidewalk && "Brooklyn mornings, familiar streets, socks that feel like home.",
      brand && hasSocks && `${brand} — made for people who love getting dressed.`,
    ],
    inspirational: [
      hasDesigner && "Every look starts somewhere — today it starts at your feet.",
      hasNeon && hasSocks && "Step into color — the sidewalk is your runway.",
      hasSubway && "Small brave steps — from the street to the turnstile and beyond.",
    ],
    deadpan: [
      hasCats && hasSubway && "Cats followed her to the subway. Nobody questioned it.",
      hasNeon && hasSocks && "The socks glow. The plot does not explain itself.",
      hasSubway && "Turnstile kittens. Neon socks. Tuesday, apparently.",
    ],
    professional: [
      hasDesigner && hasSocks && "Designer-led style — premium socks built for everyday visibility.",
      brand && hasNeon && `${brand || "Our brand"} — bold product, polished delivery.`,
      hasSubway && hasBrooklyn && "Urban creative wear — built for real city commutes.",
    ],
  }

  return (byTone[style] || byTone.professional).filter(Boolean)
}

function passesStoryQuality(line = "") {
  const s = line.toLowerCase()
  if (s.length < 22 || s.length > 160) return false
  if (/advertising campaign|social media|acquisition|conversion/.test(s)) return false
  if (
    /dangling string|clip should|look real|accomplish|told with a straight face|picture this zooms/.test(
      s
    )
  ) {
    return false
  }
  if (/\bshould accomplish\b|\b\d+\s*seconds\b/.test(s)) return false
  if (/^cats notice the socks|leaves her|brownstone and walks|sits down to see|staring back/.test(s)) {
    return false
  }
  if (/\bthe picture this\b|neon-flashing|solid colored/.test(s)) return false
  if (/\bbased fashion designer leaves\b/.test(s)) return false
  return true
}

export function buildStoryVoiceHooks({ story = "", tone = "", company = "" }) {
  const text = story.trim()
  if (text.length < 30) return []

  const style = resolveToneStyle(tone)
  const signals = extractStorySignals(text)
  const hooks = []
  const seen = new Set()

  function add(hook) {
    const h = hook?.trim()
    if (!h || !passesStoryQuality(h)) return
    const key = h.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    hooks.push(h)
  }

  for (const line of compositeHooks(signals, style, company)) {
    add(line)
  }

  // Only add beats we explicitly rewrote — never raw My Story sentences
  if (hooks.length < 10) {
    for (const beat of signals.beats) {
      const rewritten = humanizeBeat(beat)
      if (rewritten) add(rewritten)
      if (hooks.length >= 12) break
    }
  }

  return hooks
}

export function storyFromBrief(brief) {
  if (brief.adThemeMode === "custom") {
    return (brief.adThemeCustom || "").trim()
  }
  return (brief.adTheme || brief.story || "").trim()
}
