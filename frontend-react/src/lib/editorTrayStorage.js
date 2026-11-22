const STORAGE_KEY = "neonsox-editor-tray"

export const EMPTY_EDITOR_STATE = {
  videoClips: [],
  music: null,
  voice: null,
  musicVolume: 45,
  lastRender: null,
  uploads: [],
  /** Extra timeline lanes (drag targets). Render still uses video + music + voice. */
  sfxClips: [],
  foleyClips: [],
  adrClips: [],
}

export function loadEditorTray(campaignKey) {
  if (typeof window === "undefined" || !campaignKey) return { ...EMPTY_EDITOR_STATE }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    const saved = all[campaignKey]
    if (!saved || typeof saved !== "object") return { ...EMPTY_EDITOR_STATE }
    return {
      ...EMPTY_EDITOR_STATE,
      ...saved,
      videoClips: Array.isArray(saved.videoClips) ? saved.videoClips : [],
      uploads: Array.isArray(saved.uploads) ? saved.uploads : [],
      sfxClips: Array.isArray(saved.sfxClips) ? saved.sfxClips : [],
      foleyClips: Array.isArray(saved.foleyClips) ? saved.foleyClips : [],
      adrClips: Array.isArray(saved.adrClips) ? saved.adrClips : [],
    }
  } catch {
    return { ...EMPTY_EDITOR_STATE }
  }
}

export function saveEditorTray(campaignKey, state) {
  if (typeof window === "undefined" || !campaignKey) return state
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const all = raw ? JSON.parse(raw) : {}
  all[campaignKey] = state
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return state
}

export function patchEditorTray(campaignKey, patch) {
  const current = loadEditorTray(campaignKey)
  const next = { ...current, ...patch }
  saveEditorTray(campaignKey, next)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("neonsox-editor-tray-updated"))
  }
  return next
}

export function addEditorUpload(campaignKey, asset) {
  const current = loadEditorTray(campaignKey)
  const uploads = [
    {
      id: asset.id || `up_${Date.now()}`,
      label: asset.label || asset.originalName || "Upload",
      url: asset.url,
      kind: asset.kind || "video",
      originalName: asset.originalName || "",
      addedAt: new Date().toISOString(),
    },
    ...current.uploads,
  ].slice(0, 48)
  return patchEditorTray(campaignKey, { uploads })
}

export function makeClipRef({ url, label, source = "upload", kind = "video", trayId = null, generationId = null }) {
  return {
    id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    url,
    label: label || "Clip",
    source,
    kind,
    trayId,
    generationId,
  }
}
