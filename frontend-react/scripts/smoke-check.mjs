/**
 * Fast regression guard — run after every Palette / studio change.
 * Usage: cd frontend-react && npm run smoke
 */
import { readFileSync } from "fs"
import { reconcileStudioState } from "../src/lib/paletteStudioStorage.js"
import {
  buildRunwayPromptPreview,
  promptLengthLabel,
  trimRunwayPrompt,
  RUNWAY_PROMPT_MAX,
} from "../src/lib/runwayPromptEstimate.js"
import { resolveToneStyle, buildNarrationScriptVariants } from "../src/lib/industryVoiceScripts.js"

let failed = 0

function ok(label, condition) {
  if (!condition) {
    console.error(`FAIL: ${label}`)
    failed++
  } else {
    console.log(`ok: ${label}`)
  }
}

// 1) Failed tries must not vanish from tray state
{
  const state = reconcileStudioState({
    generations: [
      {
        id: "g1",
        status: "failed",
        refunded: false,
        retryIndex: 4,
        createdAt: new Date().toISOString(),
      },
    ],
  })
  ok("failed try stays visible when not refunded", state.generations.length === 1)
}

// 2) Cloud merge must not auto-pick "your ad"
{
  const cloudSyncSrc = readFileSync(new URL("../src/lib/studioCloudSync.js", import.meta.url), "utf8")
  ok(
    "cloud merge source does not auto-select first succeeded clip",
    !cloudSyncSrc.includes('generations.find((g) => g.status === "succeeded")')
  )
}

// 3) Tone must change script ideas
{
  const brief = {
    industry: "Fashion designer",
    companyName: "NEONSOX",
    deadlineOffer: "Save 15%",
  }
  const playful = buildNarrationScriptVariants({ ...brief, adTone: "Playful" })
  const bold = buildNarrationScriptVariants({ ...brief, adTone: "Bold & Urgent" })
  ok("tone produces script variants", playful.length >= 10 && bold.length >= 10)
  ok(
    "playful and bold scripts differ",
    playful[0]?.script && bold[0]?.script && playful[0].script !== bold[0].script
  )
  ok("resolveToneStyle maps Playful", resolveToneStyle("Playful") === "playful")
}

// 4) Long story is OK — engine auto-trims
{
  const longStory = "A ".repeat(1200)
  const state = {
    industryCustom: "Fashion designer and neon sock brand with Brooklyn street energy",
    adThemeMode: "custom",
    adThemeCustom: longStory,
    themeSetting: "Urban Street Scene with heavy foot traffic and subway entrances",
    adTone: "Serious-Funny",
    selectedStylePreset: "people_street_photography",
    preventAiMistakes: true,
  }
  const label = promptLengthLabel(state)
  const trimmed = trimRunwayPrompt(buildRunwayPromptPreview(state))
  ok("long story allowed in UI", label.storyChars > 500)
  ok("engine prompt trims to runway max", trimmed.length <= RUNWAY_PROMPT_MAX)
  ok(
    "street scene prompt locks character continuity",
    trimRunwayPrompt(buildRunwayPromptPreview(state)).includes("hands stay empty")
  )
  ok(
    "prevent AI mistakes adds eliminate props rule",
    trimRunwayPrompt(buildRunwayPromptPreview(state)).includes("Eliminate props")
  )
  ok(
    "long story path is safe for generate",
    label.autoTrim === true || trimmed.length <= RUNWAY_PROMPT_MAX
  )
}

// 5) NEONSOX-style brief — story-aware scripts from My Story
{
  const story =
    "A Brooklyn fashion designer walks on the sidewalk. A cat follows her. " +
    "She goes to the subway entrance and expects chaos. " +
    "Instead, a kitten greeting committee waits at the turnstile. " +
    "POV looks down at her neon socks glowing."
  const storyWithNotes =
    story +
    " Clip should look real. Should accomplish all scenes in 10 seconds. " +
    "A brooklyn-based fashion designer leaves her Cliton Hill Brownstone and walks to the subway station. " +
    "The Picture this zooms in on her solid colored neon-flashing socks. " +
    "She enters the subway, sits down to see all of the cats staring back at her."
  const neon = buildNarrationScriptVariants({
    industryCustom: "Advertising Campaign On social media",
    companyName: "NEONSOX",
    deadlineOffer: "save 15% by August 1st 2026",
    adTone: "Serious-Funny",
    adThemeMode: "custom",
    adThemeCustom: storyWithNotes,
  })
  ok("NEONSOX brief produces scripts", neon.length >= 10)
  ok(
    "no literal advertising-campaign-on-social-media line",
    !neon.some((v) => /advertising campaign on social media/i.test(v.script))
  )
  ok("story ideas listed first", neon[0]?.source === "story")
  ok(
    "story scripts reference cats subway or neon socks",
    neon.slice(0, 6).some((v) => /cat|subway|neon|sock|kitten|turnstile/i.test(v.script))
  )
  ok(
    "no literal dumps or camera directions",
    !neon.some((v) =>
      /picture this zooms|brownstone and walks|sits down to see|staring back|neon-flashing|leaves her cliton/i.test(
        v.script
      )
    )
  )
  ok("CTA is capitalized", neon[0]?.script.includes("Save 15%"))
}

if (failed > 0) {
  console.error(`\n${failed} smoke check(s) failed.`)
  process.exit(1)
}

console.log("\nAll frontend smoke checks passed.")
