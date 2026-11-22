import fs from "node:fs/promises"
import path from "node:path"

/**
 * Fingerprint screen via AudD (optional).
 * Match → reject. No match → clear for human review.
 * No AUDD_API_TOKEN → skipped (admin review still required).
 *
 * Docs: https://docs.audd.io/
 */
export async function fingerprintAudioFile(filePath) {
  const token = (process.env.AUDD_API_TOKEN || "").trim()
  if (!token) {
    return {
      status: "skipped",
      detail: { reason: "AUDD_API_TOKEN not configured — admin review required" },
    }
  }

  try {
    const absolute = path.resolve(filePath)
    const buf = await fs.readFile(absolute)
    const blob = new Blob([buf])
    const form = new FormData()
    form.append("api_token", token)
    form.append("return", "apple_music,spotify")
    form.append("file", blob, path.basename(absolute))

    const res = await fetch("https://api.audd.io/", { method: "POST", body: form })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        status: "error",
        detail: { httpStatus: res.status, body },
      }
    }

    // AudD returns result object when a catalog match is found; null/empty = no match.
    const result = body?.result
    if (result && (result.title || result.artist || result.song_link)) {
      return {
        status: "match",
        detail: {
          title: result.title || null,
          artist: result.artist || null,
          album: result.album || null,
          release_date: result.release_date || null,
          label: result.label || null,
          song_link: result.song_link || null,
          score: result.score ?? null,
          provider: "audd",
        },
      }
    }

    return {
      status: "clear",
      detail: { provider: "audd", message: "No catalog match" },
    }
  } catch (err) {
    return {
      status: "error",
      detail: { message: err.message || "Fingerprint failed" },
    }
  }
}
