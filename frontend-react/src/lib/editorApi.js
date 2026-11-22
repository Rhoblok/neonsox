const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4242"

export async function uploadEditorMedia(file) {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${API_BASE}/api/editor/upload`, {
    method: "POST",
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Upload failed")
  return data
}

export async function renderEditorProject({ campaignKey, userId, videoClips, musicUrl, voiceUrl, musicVolume }) {
  const res = await fetch(`${API_BASE}/api/campaigns/${encodeURIComponent(campaignKey)}/editor/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      videoClips,
      musicUrl,
      voiceUrl,
      musicVolume,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Render failed")
  return data
}

export function resolveMediaUrl(url) {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`
}
