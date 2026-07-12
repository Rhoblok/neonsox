import crypto from "node:crypto"

const BUCKET = "campaign-clips"

/** Extract storage object path from a Supabase public URL, or return path if already relative. */
export function storagePathFromSupabaseUrl(url) {
  if (!url || typeof url !== "string") return null
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) {
    if (!url.startsWith("http")) return url.replace(/^\/+/, "")
    return null
  }
  return decodeURIComponent(url.slice(idx + marker.length))
}

export function signClipStoragePath(storagePath, secret) {
  if (!storagePath || !secret) return null
  const payload = Buffer.from(storagePath, "utf8").toString("base64url")
  const sig = crypto.createHmac("sha256", secret).update(storagePath).digest("base64url")
  return `${payload}.${sig}`
}

export function verifyClipToken(token, secret) {
  if (!token || !secret) return null
  const dot = token.lastIndexOf(".")
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  let storagePath
  try {
    storagePath = Buffer.from(payload, "base64url").toString("utf8")
  } catch {
    return null
  }
  const expected = crypto.createHmac("sha256", secret).update(storagePath).digest("base64url")
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  return storagePath
}

/**
 * Mask Supabase storage behind your API domain for subscribers.
 * Set CLIP_URL_SIGNING_SECRET + PUBLIC_API_BASE in production.
 */
export function maskedClipUrl(supabasePublicUrl, env = process.env) {
  const secret = env.CLIP_URL_SIGNING_SECRET
  const apiBase = (env.PUBLIC_API_BASE || env.FRONTEND_URL || "").replace(/\/$/, "")
  if (!secret || !apiBase) return supabasePublicUrl

  const storagePath = storagePathFromSupabaseUrl(supabasePublicUrl)
  if (!storagePath) return supabasePublicUrl

  const token = signClipStoragePath(storagePath, secret)
  return token ? `${apiBase}/api/clips/${token}` : supabasePublicUrl
}

export { BUCKET }
