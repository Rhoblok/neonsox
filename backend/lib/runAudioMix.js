import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  composeMusic,
  musicPromptForMood,
  resolveVoiceId,
  synthesizeSpeech,
  voiceTtsSettings,
} from "./elevenlabs.js"
import { mixVideoWithAudio } from "./ffmpegMix.js"
import { probeDurationSeconds } from "./ffmpegMedia.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP_ROOT = path.join(__dirname, "..", "tmp")
const MEDIA_ROOT = path.join(TMP_ROOT, "media")

export async function runAudioMix(payload, env = process.env) {
  const enabled = String(env.ELEVENLABS_AUDIO_ENABLED || "").toLowerCase() === "true"
  const apiKey = (env.ELEVENLABS_API_KEY || "").trim()
  const envVoiceId = (env.ELEVENLABS_VOICE_ID_FEMALE || env.ELEVENLABS_VOICE_ID || "").trim()

  if (!enabled) {
    throw new Error("AUDIO_MIX_DISABLED")
  }
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set in backend/.env")
  }
  if (!envVoiceId) {
    throw new Error("ELEVENLABS_VOICE_ID is not set in backend/.env")
  }

  const videoUrl = payload.videoUrl?.trim()
  const narrationText = payload.narrationText?.trim()
  if (!videoUrl) throw new Error("Missing videoUrl for audio mix")
  if (!narrationText) throw new Error("Missing narration text")

  const durationSeconds = Math.min(10, Math.max(2, Number(env.RUNWAY_DURATION_SECONDS || 10)))
  const musicMood = payload.musicMood || "upbeat"
  const voiceStyle = payload.voiceStyle || "professional"
  const voiceGender = payload.voiceGender === "male" ? "male" : "female"
  const generationId = payload.generationId || `mix_${Date.now()}`
  const rawMusicVol = Number(payload.musicVolume)
  const musicVolumePct = Number.isFinite(rawMusicVol) ? Math.min(100, Math.max(5, rawMusicVol)) : 45
  const musicVolume = musicVolumePct / 100

  const voiceId = resolveVoiceId(voiceGender, env)
  const ttsSettings = voiceTtsSettings(voiceStyle)
  const musicPrompt = musicPromptForMood(musicMood, payload.adTone || "")

  const jobDir = path.join(TMP_ROOT, generationId)
  await fs.mkdir(jobDir, { recursive: true })
  await fs.mkdir(MEDIA_ROOT, { recursive: true })

  const videoPath = path.join(jobDir, "video.mp4")
  const narrationPath = path.join(jobDir, "narration.mp3")
  const musicPath = path.join(jobDir, "music.mp3")
  const outputName = `${generationId}-final-${Date.now()}.mp4`
  const outputPath = path.join(MEDIA_ROOT, outputName)

  await downloadFile(videoUrl, videoPath)

  const probed = await probeDurationSeconds(videoPath)
  const clipDuration = Math.max(2, probed || durationSeconds)
  const musicLengthMs = Math.round(clipDuration * 1000)

  const narrationBuffer = await synthesizeSpeech({
    text: narrationText,
    voiceId,
    apiKey,
    ...ttsSettings,
  })
  await fs.writeFile(narrationPath, narrationBuffer)

  let usedMusic = false
  try {
    const musicBuffer = await composeMusic({
      prompt: musicPrompt,
      lengthMs: musicLengthMs,
      apiKey,
    })
    await fs.writeFile(musicPath, musicBuffer)
    usedMusic = true
  } catch (err) {
    console.warn("Music generation skipped:", err.message)
  }

  await mixVideoWithAudio({
    videoPath,
    narrationPath,
    musicPath: usedMusic ? musicPath : null,
    outputPath,
    durationSeconds: clipDuration,
    musicVolume,
  })

  try {
    await fs.rm(jobDir, { recursive: true, force: true })
  } catch {
    /* ignore cleanup errors */
  }

  return {
    status: "succeeded",
    finalOutputUrl: `/api/media/${outputName}`,
    usedMusic,
    voiceStyle,
    voiceGender,
    musicMood,
    musicVolume: musicVolumePct,
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
