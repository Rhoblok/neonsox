/** Map Runway API errors to plain-language messages for the UI. */
export function friendlyRunwayError(message = "", { refundTry = false } = {}) {
  const msg = String(message)
  const tryNote = refundTry
    ? "No credit burned — click Generate again."
    : "Your try was counted — please generate again."

  if (/content moderation/i.test(msg)) {
    return (
      "Runway blocked this clip after 3 automatic prompt retries. " +
      "We already switched to safer visuals — " +
      tryNote
    )
  }

  if (/insufficient|credit|balance/i.test(msg)) {
    return msg.includes("Not enough") ? msg : `Runway credits issue: ${msg}. ${tryNote}`
  }

  if (/timed out/i.test(msg)) {
    return `Runway took too long. ${tryNote}`
  }

  return msg.replace(/^Runway create failed:\s*/i, "")
}
