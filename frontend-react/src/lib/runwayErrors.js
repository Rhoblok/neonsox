/** Map generation service errors to plain-language messages for subscribers. */
export function friendlyRunwayError(message = "", { refundTry = false } = {}) {
  const msg = String(message)
  const tryNote = refundTry
    ? "No try was used — tap Generate Video again."
    : "Please tap Generate Video again."

  if (/cannot read propert|null \(reading|undefined \(reading/i.test(msg)) {
    return `Something glitched while saving your clip. Please tap Generate Video again.`
  }

  if (/validation of body|prompt.*too long|max.*character/i.test(msg)) {
    return "Video engine rejected the request. Please tap Generate Video again."
  }

  if (/content moderation|blocked|policy|safety/i.test(msg)) {
    return `We couldn't make this clip after a few automatic retries. ${tryNote}`
  }

  if (/insufficient|credit|balance|not enough/i.test(msg)) {
    return `Not enough video credits to finish this clip. ${tryNote}`
  }

  if (/timed out|timeout/i.test(msg)) {
    return `This clip took too long to finish. ${tryNote}`
  }

  if (/runway_api|not configured|\.env|server/i.test(msg)) {
    return "Video creation isn't available right now. Please try again later."
  }

  if (/ffmpeg|elevenlabs|api key/i.test(msg)) {
    return "Something went wrong on our end. Please try again in a few minutes."
  }

  const cleaned = msg
    .replace(/^Runway create failed:\s*/i, "")
    .replace(/^Runway /i, "")
    .replace(/Runway/gi, "Video")

  if (cleaned.length > 160 || /[{[\]}/\\]/.test(cleaned)) {
    return `We couldn't finish your clip. ${tryNote}`
  }

  return cleaned || `We couldn't finish your clip. ${tryNote}`
}
