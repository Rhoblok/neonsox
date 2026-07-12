import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MEDIA_ROOT = path.join(__dirname, "..", "tmp", "media")

const BUCKET = "campaign-clips"

function getSupabaseAdmin(env = process.env) {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function safeSegment(value = "") {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "clip"
}

/** Resolve /api/media/foo.mp4 or http URL to a local file path or remote URL. */
async function resolveMediaSource(mediaUrl, apiBase = "") {
  const url = String(mediaUrl || "").trim()
  if (!url) return null

  if (url.startsWith("/api/media/")) {
    const name = path.basename(url)
    return { type: "local", path: path.join(MEDIA_ROOT, name) }
  }

  if (url.startsWith("http://localhost") && url.includes("/api/media/")) {
    const name = path.basename(new URL(url).pathname)
    return { type: "local", path: path.join(MEDIA_ROOT, name) }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return { type: "remote", url }
  }

  return null
}

/**
 * Upload a finished clip to Supabase Storage.
 * Returns public HTTPS URL or null if cloud is not configured.
 */
export async function uploadClipToCloud({
  mediaUrl,
  userId,
  campaignKey,
  fileLabel,
  env = process.env,
}) {
  const supabase = getSupabaseAdmin(env)
  if (!supabase || !userId || !mediaUrl) return null

  const source = await resolveMediaSource(mediaUrl, env.API_BASE)
  if (!source) return null

  let buffer
  if (source.type === "local") {
    buffer = await fs.readFile(source.path)
  } else {
    const res = await fetch(source.url)
    if (!res.ok) throw new Error(`Could not download clip for cloud upload (${res.status})`)
    buffer = Buffer.from(await res.arrayBuffer())
  }

  const storagePath = `${userId}/${safeSegment(campaignKey)}/${safeSegment(fileLabel)}-${Date.now()}.mp4`

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "video/mp4",
    upsert: true,
  })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data?.publicUrl || null
}

/** Attach cloud URLs to mix/overlay/generate API results when possible. */
export async function enrichResultWithCloudUrls(result, { userId, campaignKey, generationId, env }) {
  if (!result || result.status !== "succeeded" || !userId) return result

  const out = { ...result }

  try {
    if (result.finalOutputUrl) {
      const cloud = await uploadClipToCloud({
        mediaUrl: result.finalOutputUrl,
        userId,
        campaignKey,
        fileLabel: `${generationId || "mix"}-final`,
        env,
      })
      if (cloud) out.cloudFinalOutputUrl = cloud
    }
    if (result.brandedOutputUrl) {
      const cloud = await uploadClipToCloud({
        mediaUrl: result.brandedOutputUrl,
        userId,
        campaignKey,
        fileLabel: `${generationId || "branded"}-overlay`,
        env,
      })
      if (cloud) out.cloudBrandedOutputUrl = cloud
    }
    if (result.outputUrl && !result.finalOutputUrl) {
      const cloud = await uploadClipToCloud({
        mediaUrl: result.outputUrl,
        userId,
        campaignKey,
        fileLabel: `${generationId || "raw"}-clip`,
        env,
      })
      if (cloud) out.cloudOutputUrl = cloud
    }
  } catch (err) {
    console.warn("Cloud clip upload skipped:", err.message)
  }

  return out
}
