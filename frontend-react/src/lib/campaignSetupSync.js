import { supabase } from "./supabase"
import { DEFAULT_CAMPAIGN_SETUP, loadCampaignSetup, saveCampaignSetup } from "./campaignSetupStorage"

export { DEFAULT_CAMPAIGN_SETUP, loadCampaignSetup, saveCampaignSetup, marketFieldsFromSetup } from "./campaignSetupStorage"

/** Merge remote setup over local defaults; remote wins when present. */
function mergeSetup(remote = {}) {
  return { ...DEFAULT_CAMPAIGN_SETUP, ...remote }
}

export async function loadCampaignSetupFromSupabase(userId) {
  if (!userId) return loadCampaignSetup()

  const { data, error } = await supabase
    .from("campaigns")
    .select("setup")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.warn("campaign setup load failed:", error.message)
    return loadCampaignSetup()
  }

  if (!data?.setup || typeof data.setup !== "object") {
    return loadCampaignSetup()
  }

  const merged = mergeSetup(data.setup)
  saveCampaignSetup(merged)
  return merged
}

export async function saveCampaignSetupToSupabase(userId, setup) {
  if (!userId) return { ok: false, error: "Not signed in" }

  saveCampaignSetup(setup)

  const { error } = await supabase.from("campaigns").upsert(
    {
      user_id: userId,
      setup,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) {
    console.warn("campaign setup save failed:", error.message)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
