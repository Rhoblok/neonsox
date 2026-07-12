const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4242"

async function parseJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error || data.message || `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data
}

/** Platforms the backend can post to (adapter registry). */
export async function fetchSocialPlatforms() {
  const res = await fetch(`${API_BASE}/api/social/platforms`)
  return parseJson(res)
}

/** Connected accounts for the signed-in user (OAuth — pending). */
export async function fetchSocialConnections() {
  const res = await fetch(`${API_BASE}/api/social/connections`)
  return parseJson(res)
}

/**
 * Post exported tray media to a platform via proprietary backend adapter.
 * @param {{ platform: string, mediaUrl: string, postType?: string, caption?: string, trayItemId?: string, generationId?: string, campaignKey?: string }} payload
 */
export async function postToSocial(payload) {
  const res = await fetch(`${API_BASE}/api/social/post`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return parseJson(res)
}
