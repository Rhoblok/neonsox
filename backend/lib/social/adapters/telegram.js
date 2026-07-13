import { notConfigured } from "./stub.js"

function apiBase(token) {
  return `https://api.telegram.org/bot${token}`
}

function normalizeMediaUrl(mediaUrl, env) {
  const url = String(mediaUrl || "").trim()
  if (!url) return null
  if (url.startsWith("https://")) return url
  if (url.startsWith("http://") && url.includes("/api/media/")) return url

  const backendBase = (env.PUBLIC_API_BASE || "http://localhost:4242").replace(/\/$/, "")
  if (url.startsWith("/api/media/")) return `${backendBase}${url}`
  return url
}

async function sendVideoByUrl(token, channelId, videoUrl, caption) {
  const res = await fetch(`${apiBase(token)}/sendVideo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: channelId,
      video: videoUrl,
      caption: caption || undefined,
      supports_streaming: true,
    }),
  })
  const data = await res.json()
  if (data.ok) {
    return {
      ok: true,
      status: "posted",
      externalPostId: String(data.result?.message_id || ""),
    }
  }
  return {
    ok: false,
    status: "failed",
    error: data.description || "Telegram rejected the video URL",
  }
}

async function sendVideoByUpload(token, channelId, videoUrl, caption) {
  const res = await fetch(videoUrl)
  if (!res.ok) {
    return { ok: false, status: "failed", error: `Could not fetch video (${res.status})` }
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const form = new FormData()
  form.append("chat_id", channelId)
  form.append("video", new Blob([buffer], { type: "video/mp4" }), "neonsox-ad.mp4")
  if (caption) form.append("caption", caption)
  form.append("supports_streaming", "true")

  const upload = await fetch(`${apiBase(token)}/sendVideo`, { method: "POST", body: form })
  const data = await upload.json()
  if (data.ok) {
    return {
      ok: true,
      status: "posted",
      externalPostId: String(data.result?.message_id || ""),
    }
  }
  return {
    ok: false,
    status: "failed",
    error: data.description || "Telegram upload failed",
  }
}

/**
 * @param {import('../types.js').SocialPostPayload} payload
 * @param {NodeJS.ProcessEnv} [env]
 */
export async function postToTelegram(payload, env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN?.trim()
  const channelId = env.TELEGRAM_CHANNEL_ID?.trim()
  if (!token || !channelId) return notConfigured("telegram")

  const videoUrl = normalizeMediaUrl(payload.mediaUrl, env)
  if (!videoUrl) {
    return { ok: false, status: "failed", error: "No video URL to post" }
  }

  const caption = (payload.caption || payload.companyName || "").trim().slice(0, 1024)

  try {
    if (videoUrl.startsWith("https://")) {
      const byUrl = await sendVideoByUrl(token, channelId, videoUrl, caption)
      if (byUrl.ok) return byUrl
      // Some hosts block Telegram pull — fall back to upload
      if (!byUrl.error?.toLowerCase().includes("failed to get http url content")) {
        return byUrl
      }
    }
    return await sendVideoByUpload(token, channelId, videoUrl, caption)
  } catch (err) {
    return { ok: false, status: "failed", error: err.message || "Telegram post failed" }
  }
}

export function isTelegramConfigured(env = process.env) {
  return !!(env.TELEGRAM_BOT_TOKEN?.trim() && env.TELEGRAM_CHANNEL_ID?.trim())
}
