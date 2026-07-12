import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { getFfmpegPath } from "./ffmpegMix.js"

const execFileAsync = promisify(execFile)

function parseDuration(text = "") {
  const match = String(text).match(/Duration:\s(\d+):(\d+):([\d.]+)/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  return hours * 3600 + minutes * 60 + seconds
}

/** Read actual media duration in seconds (video or audio). */
export async function probeDurationSeconds(filePath) {
  const ffmpeg = getFfmpegPath()
  if (!ffmpeg) return null

  let output = ""
  try {
    const { stderr, stdout } = await execFileAsync(ffmpeg, ["-hide_banner", "-i", filePath], {
      maxBuffer: 10 * 1024 * 1024,
    })
    output = `${stdout}\n${stderr}`
  } catch (err) {
    output = `${err.stdout || ""}\n${err.stderr || ""}`
  }

  return parseDuration(output)
}
