/**
 * Backend prompt smoke — mirrors frontend prevent-AI-mistakes path.
 * Usage: cd backend && node scripts/smoke-palette.mjs
 */
import { buildRunwayPrompt, trimRunwayPrompt, RUNWAY_PROMPT_MAX } from "../lib/runwayPrompt.js"
import { buildBlinkyTextFilter } from "../lib/ffmpegOverlay.js"

let failed = 0

function ok(label, condition) {
  if (!condition) {
    console.error(`FAIL: ${label}`)
    failed++
  } else {
    console.log(`ok: ${label}`)
  }
}

const payload = {
  preventAiMistakes: true,
  selectedStylePreset: "people_street_photography",
  brief: {
    industry: "Fashion designer neon socks",
    themeSetting: "Urban Street",
    adTone: "Serious-Funny",
    adTheme: "Brooklyn designer walks to subway. Neon socks. Cats follow. " + "scene ".repeat(80),
  },
}

const raw = buildRunwayPrompt(payload)
const trimmed = trimRunwayPrompt(raw)

ok("runway prompt builds", raw.length > 200)
ok("trimmed prompt within runway max", trimmed.length <= RUNWAY_PROMPT_MAX)
ok("strict no-text rule present", trimmed.includes("no writing") || trimmed.includes("Silent visuals"))
ok(
  "character continuity rule for street scenes",
  trimmed.includes("hands stay empty") && trimmed.includes("neon socks stay visible")
)
ok("eliminate props rule when prevent AI mistakes on", trimmed.includes("Eliminate props"))

const flashFilter2 = buildBlinkyTextFilter({
  companyName: "NEONSOX",
  durationSeconds: 10,
  overlayStyle: { flashSeconds: 2, color: "yellow", size: "m", position: "middle", pulse: "off", fontStyle: "bebas-neue" },
})
ok("flash for 2 seconds only", flashFilter2.filter.includes("between(t\\,0.35\\,2.35)"))

const flashFilter6 = buildBlinkyTextFilter({
  companyName: "NEONSOX",
  durationSeconds: 10,
  overlayStyle: { flashSeconds: 6, color: "yellow", size: "m", position: "middle", pulse: "off", fontStyle: "bebas-neue" },
})
ok("flash for 6 seconds only", flashFilter6.filter.includes("between(t\\,0.35\\,6.35)"))

if (failed > 0) {
  console.error(`\n${failed} smoke check(s) failed.`)
  process.exit(1)
}

console.log("\nAll backend smoke checks passed.")
