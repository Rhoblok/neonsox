import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { burnTextOverlay, bundledFontsStatus } from "./ffmpegOverlay.js"
import { normalizeFlashSeconds } from "./overlayPresets.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP_ROOT = path.join(__dirname, "..", "tmp")
const MEDIA_ROOT = path.join(TMP_ROOT, "media")

export async function runTextOverlay(payload, env = process.env) {
  const videoUrl = payload.videoUrl?.trim()
  const companyName = (payload.companyName || payload.brandName || "").trim()

  if (!videoUrl) throw new Error("Missing videoUrl for text overlay")
  if (!companyName) throw new Error("Missing company name for text overlay")

  const durationSeconds = Math.min(10, Math.max(2, Number(env.RUNWAY_DURATION_SECONDS || 10)))
  const generationId = payload.generationId || `overlay_${Date.now()}`

  const fontStatus = bundledFontsStatus()
  if (fontStatus.installed === 0) {
    throw new Error("Overlay fonts missing. Run: node backend/scripts/fetch-overlay-fonts.mjs")
  }

  const jobDir = path.join(TMP_ROOT, generationId)
  await fs.mkdir(jobDir, { recursive: true })
  await fs.mkdir(MEDIA_ROOT, { recursive: true })

  const videoPath = path.join(jobDir, "source.mp4")
  const outputName = `${generationId}-branded-${Date.now()}.mp4`
  const outputPath = path.join(MEDIA_ROOT, outputName)

  const overlayStyle = {
    ...(payload.overlayStyle || {}),
    flashSeconds: normalizeFlashSeconds(payload.overlayStyle || {}),
  }

  await downloadFile(videoUrl, videoPath)

  const timing = await burnTextOverlay({
    videoPath,
    outputPath,
    companyName,
    durationSeconds,
    overlayStyle,
  })

  try {
    await fs.rm(jobDir, { recursive: true, force: true })
  } catch {
    /* ignore cleanup errors */
  }

  return {
    status: "succeeded",
    brandedOutputUrl: `/api/media/${outputName}`,
    companyName,
    overlayStyle,
    flashSeconds: timing.flashDuration,
    flashWindow: { start: timing.flashStart, end: timing.flashEnd },
  }
}

async function downloadFile(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Could not download video (${res.status})`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(destPath, buffer)
}
