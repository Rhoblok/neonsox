const STORAGE_KEY = "neonsox-socials-tray"

export function loadSocialsTray(campaignKey) {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    return Array.isArray(all[campaignKey]) ? all[campaignKey] : []
  } catch {
    return []
  }
}

export function addToSocialsTray(campaignKey, item) {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const all = raw ? JSON.parse(raw) : {}
  const tray = Array.isArray(all[campaignKey]) ? all[campaignKey] : []
  const next = [{ ...item, id: item.id || `social_${Date.now()}`, exportedAt: new Date().toISOString() }, ...tray].slice(
    0,
    24
  )
  all[campaignKey] = next
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return next
}

function isLocalDevMediaUrl(url) {
  if (!url || typeof url !== "string") return false
  return url.includes("localhost") || url.startsWith("/api/media/")
}

/** Upgrade tray items to Supabase URLs when studio generations have cloud copies. */
export function upgradeSocialsTrayUrls(campaignKey, generations = []) {
  if (typeof window === "undefined" || !campaignKey) return { tray: [], changed: false }

  const byId = new Map((generations || []).map((g) => [g.id, g]))
  const tray = loadSocialsTray(campaignKey)
  let changed = false

  const next = tray.map((item) => {
    const gen = byId.get(item.generationId || item.id)
    const cloud =
      gen?.cloudBrandedOutputUrl ||
      gen?.cloudFinalOutputUrl ||
      item.cloudVideoUrl ||
      null

    if (!cloud) return item

    const needsUpgrade =
      item.cloudVideoUrl !== cloud ||
      !item.videoUrl ||
      isLocalDevMediaUrl(item.videoUrl) ||
      item.videoUrl !== cloud

    if (!needsUpgrade) return item

    changed = true
    return { ...item, cloudVideoUrl: cloud, videoUrl: cloud }
  })

  if (changed) {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[campaignKey] = next
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  }

  return { tray: next, changed }
}
