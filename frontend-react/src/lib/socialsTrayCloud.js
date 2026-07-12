/** Restore cloud socials tray into localStorage for a campaign key. */
export function restoreSocialsTrayFromCloud(campaignKey, items) {
  if (typeof window === "undefined" || !Array.isArray(items) || items.length === 0) return
  const STORAGE_KEY = "neonsox-socials-tray"
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[campaignKey] = items
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}
