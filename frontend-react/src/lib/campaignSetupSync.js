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
    const missingTable =
      error.code === "42P01" || String(error.message).includes("Could not find the table")
    return { ok: false, error: error.message, missingTable }
  }

  return { ok: true }
}

/** Returns whether the campaigns table exists and is reachable for this user. */
export async function probeCampaignCloud(userId) {
  if (!userId) return { ready: true }

  const { error } = await supabase.from("campaigns").select("user_id").eq("user_id", userId).limit(1)

  if (!error) return { ready: true }

  const missingTable =
    error.code === "42P01" || String(error.message).includes("Could not find the table")
  if (missingTable) return { ready: false, missingTable: true }

  console.warn("campaign cloud probe failed:", error.message)
  return { ready: false, error: error.message }
}
