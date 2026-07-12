import { execFile } from "node:child_process"
import { promisify } from "node:util"
import ffmpegPath from "ffmpeg-static"
import { probeDurationSeconds } from "./ffmpegMedia.js"

const execFileAsync = promisify(execFile)

export function getFfmpegPath() {
  return ffmpegPath || "ffmpeg"
}

/**
 * Mix silent video + narration (+ optional music bed) into one MP4.
 * Uses the video's actual length so clips are not cut short by shorter TTS.
 */
export async function mixVideoWithAudio({
  videoPath,
  narrationPath,
  musicPath,
  outputPath,
  durationSeconds = 10,
  musicVolume = 0.4,
}) {
  const ffmpeg = getFfmpegPath()
  if (!ffmpeg) {
    throw new Error("ffmpeg not found. Run npm install in backend/ (ffmpeg-static).")
  }

  const probed = await probeDurationSeconds(videoPath)
  const duration = Math.max(1, probed || durationSeconds)
  const fadeStart = Math.max(0, duration - 0.75)
  const bedVol = Math.min(1, Math.max(0.05, Number(musicVolume) || 0.4))

  if (musicPath) {
    const filter = [
      `[1:a]apad=whole_dur=${duration},atrim=duration=${duration},volume=1.25,afade=t=out:st=${fadeStart}:d=0.75[narr]`,
      `[2:a]apad=whole_dur=${duration},atrim=duration=${duration},volume=${bedVol},afade=t=out:st=${fadeStart}:d=0.75[bed]`,
      `[narr][bed]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]`,
    ].join(";")

    await execFileAsync(ffmpeg, [
      "-y",
      "-i",
      videoPath,
      "-i",
      narrationPath,
      "-i",
      musicPath,
      "-filter_complex",
      filter,
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
    return
  }

  await execFileAsync(ffmpeg, [
    "-y",
    "-i",
    videoPath,
    "-i",
    narrationPath,
    "-filter_complex",
    `[1:a]apad=whole_dur=${duration},atrim=duration=${duration},volume=1.25,afade=t=out:st=${fadeStart}:d=0.75[aout]`,
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
