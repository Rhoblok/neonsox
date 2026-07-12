/**
 * Check Supabase profile flags for a user (manual toggle test helper).
 *
 * Usage (from backend folder):
 *   node scripts/check-profile.mjs you@example.com
 */
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, "..", ".env") })

const email = process.argv[2]
if (!email) {
  console.error("Usage: node scripts/check-profile.mjs <email>")
  process.exit(1)
}

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env")
  process.exit(1)
}

const supabase = createClient(url, key)

const { data: users, error: listError } = await supabase.auth.admin.listUsers()
if (listError) {
  console.error("Could not list users:", listError.message)
  process.exit(1)
}

const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!user) {
  console.error(`No auth user found for ${email}`)
  process.exit(1)
}

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, role, has_membership, has_campaign, stripe_customer_id, updated_at")
  .eq("id", user.id)
  .maybeSingle()

if (profileError) {
  console.error("Profile query failed:", profileError.message)
  process.exit(1)
}

if (!profile) {
  console.log(`User: ${email}`)
  console.log(`User ID: ${user.id}`)
  console.log("Profile row: MISSING — run docs/supabase-profiles.sql in Supabase SQL Editor")
  process.exit(1)
}

console.log(`User: ${email}`)
console.log(`User ID: ${profile.id}`)
console.log(`Role: ${profile.role || "member"}`)
console.log(`has_membership: ${profile.has_membership}`)
console.log(`has_campaign: ${profile.has_campaign}`)
console.log(`stripe_customer_id: ${profile.stripe_customer_id || "(none)"}`)
console.log(`updated_at: ${profile.updated_at || "(unknown)"}`)
