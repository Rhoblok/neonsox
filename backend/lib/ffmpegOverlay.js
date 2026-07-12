import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { getFfmpegPath } from "./ffmpegMix.js"
import { resolveOverlayStyle, resolveFlashTiming, normalizeFlashSeconds } from "./overlayPresets.js"
import { resolveFontFile, resolveFontStyle } from "./overlayFontStyles.js"

const execFileAsync = promisify(execFile)

export function escapeDrawtext(text = "") {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%")
}

function ffmpegFontArg(fontPath) {
  if (!fontPath) return ""
  const normalized = fontPath.replace(/\\/g, "/").replace(/:/g, "\\:")
  return `fontfile='${normalized}':`
}

export function buildBlinkyTextFilter({
  companyName,
  durationSeconds = 10,
  overlayStyle = {},
}) {
  const company = escapeDrawtext(companyName.trim())
  if (!company) {
    throw new Error("Company name is required for text overlay")
  }

  const timing = resolveFlashTiming(overlayStyle, durationSeconds)
  const { flashStart, flashEnd, sweepSeconds } = timing
  const sweepEnd = flashStart + sweepSeconds
  const { fontcolor, fontsize, y, pulseHz } = resolveOverlayStyle(overlayStyle)
  const { path: fontPath } = resolveFontFile(overlayStyle.fontStyle)
  if (!fontPath) {
    throw new Error("Overlay fonts missing. Run: node scripts/fetch-overlay-fonts.mjs")
  }

  const fontExtras = resolveFontStyle(overlayStyle.fontStyle)
  const fontArg = ffmpegFontArg(fontPath)
  const fadeIn = 0.12
  const fadeOut = 0.12
  const pulseFactor = pulseHz > 0 ? `(0.55+0.45*sin(2*PI*t*${pulseHz}))` : "1"
  const edgeFade = `if(lt(t\\,${flashStart + fadeIn})\\,(t-${flashStart})/${fadeIn}\\,if(gt(t\\,${flashEnd - fadeOut})\\,(${flashEnd}-t)/${fadeOut}\\,1))`
  const alpha = `${edgeFade}*${pulseFactor}`
  const sweepX = `if(lt(t\\,${sweepEnd})\\,-text_w+(w+text_w)*((t-${flashStart})/${sweepSeconds})\\,(w-text_w)/2)`

  const parts = [
    `drawtext=${fontArg}text='${company}'`,
    `fontsize=${fontsize}`,
    `fontcolor=${fontcolor}`,
    `borderw=${fontExtras.borderw}`,
    `bordercolor=${fontExtras.bordercolor}`,
  ]

  if (fontExtras.shadowx || fontExtras.shadowy) {
    parts.push(`shadowx=${fontExtras.shadowx}`, `shadowy=${fontExtras.shadowy}`, `shadowcolor=${fontExtras.shadowcolor}`)
  }

  parts.push(
    `x='${sweepX}'`,
    `y=${y}`,
    `alpha='${alpha}'`,
    `enable='between(t\\,${flashStart}\\,${flashEnd})'`
  )

  return { filter: parts.join(":"), timing }
}

export async function burnTextOverlay({
  videoPath,
  outputPath,
  companyName,
  durationSeconds = 10,
  overlayStyle = {},
}) {
  const ffmpeg = getFfmpegPath()
  if (!ffmpeg) {
    throw new Error("ffmpeg not found. Run npm install in backend/ (ffmpeg-static).")
  }

  const { filter, timing } = buildBlinkyTextFilter({ companyName, durationSeconds, overlayStyle })
  console.log(
    `Text overlay: ${normalizeFlashSeconds(overlayStyle)}s on screen (${timing.flashStart}s–${timing.flashEnd}s)`
  )

  await execFileAsync(ffmpeg, [
    "-y",
    "-i",
    videoPath,
    "-vf",
    filter,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "22",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputPath,
  ])

  return timing
}

export { bundledFontsStatus } from "./overlayFontStyles.js"
