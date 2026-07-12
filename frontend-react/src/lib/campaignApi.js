/**
 * Phase B: Runway generate + ElevenLabs mix on selected clip only.
 */
import { publicAudioError, publicOverlayError } from "./publicErrors.js"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4242"

function resolveMediaUrl(url) {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`
}

export async function generateVideo(campaignId, payload) {
  const useMock = import.meta.env.VITE_USE_MOCK_GENERATION !== "false"

  if (!useMock && campaignId) {
    const res = await fetch(`${API_BASE}/api/campaigns/${encodeURIComponent(campaignId)}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, audioEnabled: false }),
    })
    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.error || "Generation request failed")
      err.refundTry = !!data.refundTry
      throw err
    }
    return {
      ...data,
      outputUrl: resolveMediaUrl(data.outputUrl) || data.cloudOutputUrl || null,
      cloudOutputUrl: data.cloudOutputUrl || null,
      cloudFinalOutputUrl: data.cloudFinalOutputUrl || null,
      cloudBrandedOutputUrl: data.cloudBrandedOutputUrl || null,
    }
  }

  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 1400))

  const fail = Math.random() < 0.12
  if (fail) {
    return {
      status: "failed",
      error: "This clip took too long. Your try was counted — pick a style and tap Generate Video again.",
      costCredits: 100,
      costUSD: 1.0,
    }
  }

  return {
    status: "succeeded",
    outputUrl: null,
    thumbnailUrl: null,
    costCredits: 100,
    costUSD: 1.0,
  }
}

export async function applyTextOverlay(campaignId, payload) {
  const useMock = import.meta.env.VITE_USE_MOCK_GENERATION !== "false"

  if (!useMock && campaignId) {
    const res = await fetch(`${API_BASE}/api/campaigns/${encodeURIComponent(campaignId)}/overlay-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(publicOverlayError(data.error || "Text overlay request failed"))
    }
    return {
      ...data,
      brandedOutputUrl: resolveMediaUrl(data.brandedOutputUrl) || data.cloudBrandedOutputUrl || null,
      cloudBrandedOutputUrl: data.cloudBrandedOutputUrl || null,
    }
  }

  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 800))

  return {
    status: "succeeded",
    brandedOutputUrl: payload.videoUrl || null,
    companyName: payload.companyName,
    style: "sesame-blinky",
    overlayStyle: payload.overlayStyle,
  }
}

export async function mixAudioOnClip(campaignId, payload) {
  const useMock = import.meta.env.VITE_USE_MOCK_GENERATION !== "false"

  if (!useMock && campaignId) {
    const res = await fetch(`${API_BASE}/api/campaigns/${encodeURIComponent(campaignId)}/mix-audio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(publicAudioError(data.error || "Audio mix request failed"))
    }
    return {
      ...data,
      finalOutputUrl: resolveMediaUrl(data.finalOutputUrl) || data.cloudFinalOutputUrl || null,
      cloudFinalOutputUrl: data.cloudFinalOutputUrl || null,
    }
  }

  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1500))

  return {
    status: "succeeded",
    finalOutputUrl: payload.videoUrl || null,
    usedMusic: true,
    voiceStyle: payload.voiceStyle,
    voiceGender: payload.voiceGender ?? "female",
    musicMood: payload.musicMood,
    musicVolume: payload.musicVolume ?? 45,
  }
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
