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
