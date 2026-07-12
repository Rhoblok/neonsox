import { AD_THEMES, AD_TONES, THEME_SETTINGS } from "./adCreativeOptions"
import { INDUSTRY_GROUPS } from "./industries"
import { fixSpelling } from "./spellFix"

const LABEL_FIELDS = [
  {
    key: "companyName",
    labels: ["company name", "company", "business name", "business", "brand name", "brand"],
  },
  {
    key: "industryCustom",
    labels: ["industry", "sector", "what industry", "business type"],
  },
  {
    key: "targetAudience",
    labels: ["target audience", "audience", "target market", "customers", "who is your target"],
  },
  {
    key: "deadlineOffer",
    labels: ["deadline", "offer", "promotion", "promo", "sale", "special"],
  },
  {
    key: "desiredOutcome",
    labels: ["outcome", "goal", "objective", "looking to achieve", "desired outcome"],
  },
  {
    key: "adTheme",
    labels: ["theme", "advertisement theme", "ad theme"],
  },
  {
    key: "adTone",
    labels: ["tone", "voice", "ad tone"],
  },
  {
    key: "themeSetting",
    labels: ["setting", "theme setting", "location", "scene"],
  },
]

const ALL_INDUSTRIES = INDUSTRY_GROUPS.flatMap((g) => g.industries)

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim()
}

function stripLabel(line, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`^${escaped}\\s*[:\\-–—]\\s*`, "i")
  return normalizeLine(line.replace(re, ""))
}

function matchLabeledValue(line) {
  const lower = line.toLowerCase()
  for (const field of LABEL_FIELDS) {
    for (const label of field.labels) {
      if (lower.startsWith(`${label}:`) || lower.startsWith(`${label} -`) || lower.startsWith(`${label} –`)) {
        return { key: field.key, value: stripLabel(line, label) }
      }
    }
  }
  return null
}

function fuzzyPickOption(text, options) {
  const lower = text.toLowerCase()
  const exact = options.find((o) => lower.includes(o.toLowerCase()))
  if (exact) return exact

  const words = lower.split(/[^a-z0-9]+/).filter(Boolean)
  let best = null
  let bestScore = 0
  for (const option of options) {
    const optionWords = option.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
    const score = optionWords.filter((w) => words.includes(w)).length
    if (score > bestScore && score >= Math.min(2, optionWords.length)) {
      bestScore = score
      best = option
    }
  }
  return best
}

function matchIndustry(text) {
  const lower = text.toLowerCase()
  const exact = ALL_INDUSTRIES.find((name) => lower.includes(name.toLowerCase()))
  if (exact) return { industry: exact, industryMode: "list", industryCustom: "" }

  const fuzzy = fuzzyPickOption(text, ALL_INDUSTRIES)
  if (fuzzy) return { industry: fuzzy, industryMode: "list", industryCustom: "" }

  if (text.length >= 3 && text.length <= 80) {
    return { industry: "", industryMode: "custom", industryCustom: fixSpelling(text) }
  }
  return null
}

function looksLikeOffer(text) {
  return /(\d+\s*%)|(save\s+\$?\d)|(\$\d)|\bby\s+[a-z]+\s+\d+/i.test(text)
}

function looksLikeAudience(text) {
  return /\b(offices|restaurants|malls|homeowners|families|businesses|customers|clients)\b/i.test(text)
}

/** Parse OCR plain text into brief field updates. */
export function parseBriefFromOcr(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean)

  const out = {}
  const unassigned = []

  for (const line of lines) {
    const labeled = matchLabeledValue(line)
    if (labeled?.value) {
      out[labeled.key] = fixSpelling(labeled.value)
      continue
    }
    unassigned.push(line)
  }

  for (const [key, value] of Object.entries(out)) {
    if (key === "adTheme") out.adTheme = fuzzyPickOption(value, AD_THEMES) || value
    if (key === "adTone") out.adTone = fuzzyPickOption(value, AD_TONES) || value
    if (key === "themeSetting") out.themeSetting = fuzzyPickOption(value, THEME_SETTINGS) || value
    if (key === "industryCustom") {
      const industryMatch = matchIndustry(value)
      if (industryMatch) Object.assign(out, industryMatch)
      delete out.industryCustom
    }
  }

  if (!out.companyName && unassigned.length) {
    const first = unassigned.shift()
    if (first.length <= 60) out.companyName = fixSpelling(first)
    else unassigned.unshift(first)
  }

  for (const line of unassigned) {
    if (!out.deadlineOffer && looksLikeOffer(line)) {
      out.deadlineOffer = fixSpelling(line)
      continue
    }
    if (!out.targetAudience && looksLikeAudience(line)) {
      out.targetAudience = fixSpelling(line)
      continue
    }
    if (!out.desiredOutcome && /\b(traffic|bookings|leads|sales|awareness|signups|calls)\b/i.test(line)) {
      out.desiredOutcome = fixSpelling(line)
      continue
    }
    if (!out.industry && !out.industryCustom) {
      const industryMatch = matchIndustry(line)
      if (industryMatch) Object.assign(out, industryMatch)
    }
  }

  if (!out.adTheme) out.adTheme = fuzzyPickOption(rawText, AD_THEMES) || ""
  if (!out.adTone) out.adTone = fuzzyPickOption(rawText, AD_TONES) || ""
  if (!out.themeSetting) out.themeSetting = fuzzyPickOption(rawText, THEME_SETTINGS) || ""

  return out
}

/** Merge parsed OCR fields into existing brief state (fill empty only by default). */
export function mergeOcrIntoBrief(currentState, parsed, { replace = false } = {}) {
  const updates = {}
  const stringFields = [
    "companyName",
    "targetAudience",
    "deadlineOffer",
    "desiredOutcome",
    "adTheme",
    "adTone",
    "themeSetting",
    "industry",
    "industryCustom",
  ]

  for (const key of stringFields) {
    const next = parsed[key]
    if (!next) continue
    const current = (currentState[key] || "").trim()
    if (replace || !current) updates[key] = next
  }

  if (parsed.industryMode && (replace || !hasIndustry(currentState))) {
    updates.industryMode = parsed.industryMode
    if (parsed.industryMode === "list") updates.industryCustom = ""
    if (parsed.industryMode === "custom") updates.industry = ""
  }

  return updates
}

function hasIndustry(state) {
  return !!(state.industryCustom?.trim() || state.industry?.trim())
}

export async function extractTextFromImage(file, onProgress) {
  const { createWorker } = await import("tesseract.js")
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round((m.progress || 0) * 100))
      }
    },
  })

  try {
    const {
      data: { text },
    } = await worker.recognize(file)
    return text.trim()
  } finally {
    await worker.terminate()
  }
}
