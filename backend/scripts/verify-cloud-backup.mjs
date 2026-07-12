/**
 * Verify Supabase cloud backup for a user (studio state, campaign, video clips).
 *
 * Usage (from backend folder):
 *   node scripts/verify-cloud-backup.mjs ceo@neonsox.com
 */
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, "..", ".env") })

const email = process.argv[2] || "ceo@neonsox.com"
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env")
  process.exit(1)
}

const supabase = createClient(url, key)

function countGenerations(state) {
  const gens = state?.generations
  return Array.isArray(gens) ? gens.length : 0
}

function cloudUrlsInState(state) {
  const gens = state?.generations || []
  return gens.flatMap((g) =>
    [g.cloudBrandedOutputUrl, g.cloudFinalOutputUrl, g.cloudOutputUrl].filter(Boolean)
  )
}

const { data: users, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 })
if (listError) {
  console.error("Could not list users:", listError.message)
  process.exit(1)
}

const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!user) {
  console.error(`No auth user found for ${email}`)
  process.exit(1)
}

console.log(`\n=== Cloud backup check: ${email} ===`)
console.log(`User ID: ${user.id}\n`)

// campaigns table
const { data: campaign, error: campaignError } = await supabase
  .from("campaigns")
  .select("setup, updated_at")
  .eq("user_id", user.id)
  .maybeSingle()

if (campaignError?.code === "42P01") {
  console.log("campaigns table: MISSING — run docs/supabase-campaigns.sql")
} else if (campaignError) {
  console.log("campaigns table: ERROR —", campaignError.message)
} else if (!campaign) {
  console.log("campaigns table: exists, but no row for this user yet")
} else {
  const setup = campaign.setup || {}
  console.log("campaigns table: OK")
  console.log(`  updated_at: ${campaign.updated_at}`)
  console.log(`  tier: ${setup.tier || "(default)"}`)
  console.log(`  name: ${setup.name || "(draft)"}`)
  console.log(`  platforms: ${(setup.platforms || []).join(", ") || "(none)"}`)
}

// studio_states table
const { data: studios, error: studioError } = await supabase
  .from("studio_states")
  .select("campaign_key, state, socials_tray, updated_at")
  .eq("user_id", user.id)
  .order("updated_at", { ascending: false })

if (studioError?.code === "42P01") {
  console.log("\nstudio_states table: MISSING — run docs/supabase-studio-cloud.sql")
} else if (studioError) {
  console.log("\nstudio_states table: ERROR —", studioError.message)
} else if (!studios?.length) {
  console.log("\nstudio_states table: exists, but no rows for this user yet")
  console.log("  → Open Dashboard while logged in; studio syncs on save + tab changes")
} else {
  console.log(`\nstudio_states table: OK (${studios.length} campaign key(s))`)
  for (const row of studios) {
    const gens = countGenerations(row.state)
    const clouds = cloudUrlsInState(row.state)
    const tray = Array.isArray(row.socials_tray) ? row.socials_tray.length : 0
    console.log(`  • ${row.campaign_key}`)
    console.log(`    updated_at: ${row.updated_at}`)
    console.log(`    generations: ${gens}`)
    console.log(`    cloud video URLs in state: ${clouds.length}`)
    console.log(`    socials tray items: ${tray}`)
    if (tray > 0) {
      const latest = row.socials_tray[0]
      console.log(`    latest tray video: ${latest?.videoUrl || latest?.cloudBrandedOutputUrl || "(none)"}`)
    }
  }
}

// storage bucket
const { data: bucket, error: bucketError } = await supabase.storage.getBucket("campaign-clips")
if (bucketError) {
  console.log("\ncampaign-clips bucket: MISSING or inaccessible — run docs/supabase-studio-cloud.sql")
} else {
  console.log(`\ncampaign-clips bucket: OK (public: ${bucket.public})`)
  const { data: files, error: listFilesError } = await supabase.storage
    .from("campaign-clips")
    .list(user.id, { limit: 20, sortBy: { column: "created_at", order: "desc" } })

  if (listFilesError) {
    console.log("  files: could not list —", listFilesError.message)
  } else if (!files?.length) {
    console.log("  files: none under your user folder yet")
    console.log("  → Clips upload when backend runs generate / mix / overlay while logged in")
  } else {
    console.log(`  files: ${files.length} item(s) in ${user.id}/`)
    for (const f of files.slice(0, 5)) {
      console.log(`    • ${f.name}`)
    }
  }
}

console.log("\n=== Done ===\n")
