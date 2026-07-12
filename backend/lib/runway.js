const RUNWAY_BASE = "https://api.dev.runwayml.com/v1"

function headers(apiKey, version) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Runway-Version": version,
    "Content-Type": "application/json",
  }
}

async function parseError(res) {
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return json.error || json.message || text
  } catch {
    return text || `HTTP ${res.status}`
  }
}

export function pickModel({ audioEnabled, preferred }) {
  if (audioEnabled) return "veo3.1_fast"
  return preferred || "gen4.5"
}

export async function createVideoTask({
  apiKey,
  version,
  model,
  promptText,
  promptImage,
  duration,
  ratio,
}) {
  const isImageToVideo = model === "gen4_turbo" || !!promptImage

  const endpoint = isImageToVideo ? `${RUNWAY_BASE}/image_to_video` : `${RUNWAY_BASE}/text_to_video`

  const body = {
    model,
    ratio,
    duration,
  }

  if (isImageToVideo) {
    body.promptImage = promptImage
    body.promptText = promptText
  } else {
    body.promptText = promptText
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: headers(apiKey, version),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Runway create failed: ${await parseError(res)}`)
  }

  return res.json()
}

export async function getTask({ apiKey, version, taskId }) {
  const res = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
    headers: headers(apiKey, version),
  })

  if (!res.ok) {
    throw new Error(`Runway task fetch failed: ${await parseError(res)}`)
  }

  return res.json()
}

export async function waitForTask({ apiKey, version, taskId, intervalMs = 5000, maxAttempts = 72 }) {
  for (let i = 0; i < maxAttempts; i++) {
    const task = await getTask({ apiKey, version, taskId })
    const status = (task.status || "").toUpperCase()

    if (status === "SUCCEEDED") return task
    if (status === "FAILED" || status === "CANCELLED") {
      throw new Error(task.failure || task.failureCode || "Runway generation failed")
    }

    await new Promise((r) => setTimeout(r, intervalMs))
  }

  throw new Error("Runway generation timed out")
}

export function extractOutputUrl(task) {
  if (Array.isArray(task.output) && task.output[0]) return task.output[0]
  if (Array.isArray(task.artifacts)) {
    const video = task.artifacts.find((a) => a.url || a.uri)
    return video?.url || video?.uri || null
  }
  return task.outputUrl || null
}

export async function getCreditBalance({ apiKey, version }) {
  const res = await fetch(`${RUNWAY_BASE}/organization`, {
    headers: headers(apiKey, version),
  })

  if (!res.ok) return null

  const org = await res.json()
  const credits = org.creditBalance ?? org.credits
  return typeof credits === "number" ? credits : null
}
