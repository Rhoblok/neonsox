const STORAGE_KEY = "neonsox-campaign-setup"

export const DEFAULT_CAMPAIGN_SETUP = {
  name: "",
  tier: "tier1",
  goal: "Awareness",
  platforms: [],
  startDate: "",
  endDate: "",
  focus: "",
  homeCountry: "",
  homeRegion: "",
  targetMarkets: [],
  selectedLanguages: [],
  worldwideMarkets: false,
}

export function loadCampaignSetup() {
  if (typeof window === "undefined") return { ...DEFAULT_CAMPAIGN_SETUP }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CAMPAIGN_SETUP }
    return { ...DEFAULT_CAMPAIGN_SETUP, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CAMPAIGN_SETUP }
  }
}

export function saveCampaignSetup(setup) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(setup))
  } catch {
    /* ignore quota errors */
  }
}

export function marketFieldsFromSetup(setup = {}) {
  return {
    homeCountry: setup.homeCountry || "",
    homeRegion: setup.homeRegion || "",
    targetMarkets: setup.targetMarkets || [],
    selectedLanguages: setup.selectedLanguages || [],
    worldwideMarkets: !!setup.worldwideMarkets,
  }
}
