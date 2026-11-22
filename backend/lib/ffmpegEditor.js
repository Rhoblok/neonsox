import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { getFfmpegPath } from "./ffmpegMix.js"
import { mixVideoWithAudio } from "./ffmpegMix.js"
import { probeDurationSeconds } from "./ffmpegMedia.js"

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MEDIA_ROOT = path.join(__dirname, "..", "tmp", "media")

async function downloadRemote(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not download media (${res.status})`)
  await fs.writeFile(destPath, Buffer.from(await res.arrayBuffer()))
}

/** Resolve tray/API URL to a local filesystem path inside jobDir. */
export async function materializeMedia(url, jobDir, label, apiBase = "") {
  const raw = String(url || "").trim()
  if (!raw) throw new Error(`Missing media URL for ${label}`)

  let localPath = null

  if (raw.startsWith("/api/media/")) {
    localPath = path.join(MEDIA_ROOT, path.basename(raw))
  } else if (raw.startsWith("http://localhost") && raw.includes("/api/media/")) {
    localPath = path.join(MEDIA_ROOT, path.basename(new URL(raw).pathname))
  } else if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const ext = path.extname(new URL(raw).pathname) || ".mp4"
    localPath = path.join(jobDir, `${label}${ext}`)
    await downloadRemote(raw, localPath)
  } else {
    throw new Error(`Unsupported media URL for ${label}`)
  }

  try {
    await fs.access(localPath)
  } catch {
    throw new Error(`Media file not found for ${label}`)
  }

  return localPath
}

async function probeHasAudio(filePath) {
  const ffmpeg = getFfmpegPath()
  let output = ""
  try {
    const { stderr, stdout } = await execFileAsync(ffmpeg, ["-hide_banner", "-i", filePath], {
      maxBuffer: 10 * 1024 * 1024,
    })
    output = `${stdout}\n${stderr}`
  } catch (err) {
    output = `${err.stdout || ""}\n${err.stderr || ""}`
  }
  return /Audio:/i.test(output)
}

/** Extract audio track from video for music/voice tray imports. */
export async function extractAudioFromVideo(videoPath, outputPath) {
  const ffmpeg = getFfmpegPath()
  await execFileAsync(ffmpeg, ["-y", "-i", videoPath, "-vn", "-acodec", "aac", "-b:a", "192k", outputPath])
}

/** Concatenate multiple video clips into one MP4 (re-encodes for compatibility). */
export async function concatVideoClips(inputPaths, outputPath) {
  if (!inputPaths.length) throw new Error("No video clips to stitch")
  const ffmpeg = getFfmpegPath()

  if (inputPaths.length === 1) {
    await fs.copyFile(inputPaths[0], outputPath)
    return
  }

  const audioFlags = await Promise.all(inputPaths.map((p) => probeHasAudio(p)))
  const allHaveAudio = audioFlags.every(Boolean)

  const inputs = inputPaths.flatMap((p) => ["-i", p])

  if (allHaveAudio) {
    const parts = inputPaths.map((_, i) => `[${i}:v:0][${i}:a:0]`).join("")
    const filter = `${parts}concat=n=${inputPaths.length}:v=1:a=1[outv][outa]`
    await execFileAsync(ffmpeg, [
      "-y",
      ...inputs,
      "-filter_complex",
      filter,
      "-map",
      "[outv]",
      "-map",
      "[outa]",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      outputPath,
    ])
    return
  }

  const parts = inputPaths.map((_, i) => `[${i}:v:0]`).join("")
  const filter = `${parts}concat=n=${inputPaths.length}:v=1:a=0[outv]`
  await execFileAsync(ffmpeg, [
    "-y",
    ...inputs,
    "-filter_complex",
    filter,
    "-map",
    "[outv]",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    outputPath,
  ])
}

/**
 * Stitch video clips, optionally replace/mix voice + music beds.
 * videoClips: array of URLs
 * musicUrl / voiceUrl: optional audio URLs (mp3/m4a or video — audio extracted)
 */
export async function renderEditorProject({
  videoClips = [],
  musicUrl = null,
  voiceUrl = null,
  musicVolume = 0.4,
  campaignId = "editor",
  apiBase = "",
}) {
  if (!videoClips.length) throw new Error("Add at least one video clip")

  const jobDir = path.join(path.dirname(MEDIA_ROOT), `editor_${campaignId}_${Date.now()}`)
  await fs.mkdir(jobDir, { recursive: true })
  await fs.mkdir(MEDIA_ROOT, { recursive: true })

  try {
    const localVideos = []
    for (let i = 0; i < videoClips.length; i++) {
      localVideos.push(await materializeMedia(videoClips[i], jobDir, `clip_${i}`, apiBase))
    }

    const stitchedPath = path.join(jobDir, "stitched.mp4")
    await concatVideoClips(localVideos, stitchedPath)

    let outputName = `${campaignId}-editor-${Date.now()}.mp4`
    let outputPath = path.join(MEDIA_ROOT, outputName)

    const voicePath = voiceUrl
      ? await resolveAudioSource(voiceUrl, jobDir, "voice", apiBase)
      : null
    const musicPath = musicUrl
      ? await resolveAudioSource(musicUrl, jobDir, "music", apiBase)
      : null

    if (voicePath && musicPath) {
      const duration = Math.max(1, (await probeDurationSeconds(stitchedPath)) || 10)
      await mixVideoWithAudio({
        videoPath: stitchedPath,
        narrationPath: voicePath,
        musicPath,
        outputPath,
        durationSeconds: duration,
        musicVolume,
      })
    } else if (voicePath) {
      const duration = Math.max(1, (await probeDurationSeconds(stitchedPath)) || 10)
      await mixVideoWithAudio({
        videoPath: stitchedPath,
        narrationPath: voicePath,
        musicPath: null,
        outputPath,
        durationSeconds: duration,
        musicVolume,
      })
    } else if (musicPath) {
      await mixMusicOnly({
        videoPath: stitchedPath,
        musicPath,
        outputPath,
        musicVolume,
      })
    } else {
      await fs.copyFile(stitchedPath, outputPath)
    }

    return {
      status: "succeeded",
      outputUrl: `/api/media/${outputName}`,
      clipCount: videoClips.length,
      hasVoice: !!voicePath,
      hasMusic: !!musicPath,
    }
  } finally {
    try {
      await fs.rm(jobDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  }
}

async function resolveAudioSource(url, jobDir, label, apiBase) {
  const local = await materializeMedia(url, jobDir, `${label}_src`, apiBase)
  const lower = local.toLowerCase()
  if (lower.endsWith(".mp3") || lower.endsWith(".m4a") || lower.endsWith(".wav") || lower.endsWith(".aac")) {
    return local
  }
  const audioOut = path.join(jobDir, `${label}.m4a`)
  await extractAudioFromVideo(local, audioOut)
  return audioOut
}

async function mixMusicOnly({ videoPath, musicPath, outputPath, musicVolume = 0.4 }) {
  const ffmpeg = getFfmpegPath()
  const duration = Math.max(1, (await probeDurationSeconds(videoPath)) || 10)
  const fadeStart = Math.max(0, duration - 0.75)
  const bedVol = Math.min(1, Math.max(0.05, Number(musicVolume) || 0.4))

  await execFileAsync(ffmpeg, [
    "-y",
    "-i",
    videoPath,
    "-i",
    musicPath,
    "-filter_complex",
    `[1:a]apad=whole_dur=${duration},atrim=duration=${duration},volume=${bedVol},afade=t=out:st=${fadeStart}:d=0.75[aout]`,
    "-map",
    "0:v:0",
    "-map",
    "[aout]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-t",
    String(duration),
    outputPath,
  ])
}
