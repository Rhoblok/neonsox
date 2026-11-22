const STORAGE_KEY = "neonsox-activity-log"
const MAX_ITEMS = 40

export function loadActivityLog(campaignKey = "global") {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    const list = all[campaignKey] || all.global || []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function pushActivity(campaignKey, { type, message }) {
  if (typeof window === "undefined" || !message) return []
  const key = campaignKey || "global"
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const all = raw ? JSON.parse(raw) : {}
  const prev = Array.isArray(all[key]) ? all[key] : []
  const item = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: type || "info",
    message: String(message),
    at: new Date().toISOString(),
  }
  const next = [item, ...prev].slice(0, MAX_ITEMS)
  all[key] = next
  // Also mirror to global so Dashboard always has something when key changes
  if (key !== "global") {
    const globalPrev = Array.isArray(all.global) ? all.global : []
    all.global = [item, ...globalPrev].slice(0, MAX_ITEMS)
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  window.dispatchEvent(new CustomEvent("neonsox-activity-updated"))
  return next
}
