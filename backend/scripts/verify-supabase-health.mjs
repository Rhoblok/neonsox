/**
 * Supabase project health check — confirms the project is reachable and not paused.
 *
 * Usage (from backend folder):
 *   node scripts/verify-supabase-health.mjs
 */
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, "..", ".env") })

const url = process.env.SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

const results = []
let failed = false

function pass(label, detail = "") {
  results.push({ ok: true, label, detail })
  console.log(`✓ ${label}${detail ? ` — ${detail}` : ""}`)
}

function fail(label, detail = "") {
  failed = true
  results.push({ ok: false, label, detail })
  console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`)
}

function warn(label, detail = "") {
  results.push({ ok: true, label, detail, warn: true })
  console.log(`⚠ ${label}${detail ? ` — ${detail}` : ""}`)
}

if (!url || !serviceKey) {
  fail("Env vars", "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in backend/.env")
  process.exit(1)
}

const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "unknown"
console.log(`\n=== Supabase health check ===`)
console.log(`Project: ${projectRef}`)
console.log(`Time: ${new Date().toISOString()}\n`)

// 1. REST API reachable (paused projects often fail here)
try {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })
  if (res.ok || res.status === 404 || res.status === 401) {
    pass("REST API reachable", `HTTP ${res.status}`)
  } else if (res.status === 502 || res.status === 503) {
    fail("REST API reachable", `HTTP ${res.status} — project may be paused or restarting`)
  } else {
    warn("REST API reachable", `HTTP ${res.status}`)
  }
} catch (err) {
  fail("REST API reachable", err.message)
}

const supabase = createClient(url, serviceKey)

// 2. Auth service (admin)
const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
if (authError) {
  const msg = authError.message || String(authError)
  if (/paused|inactive|disabled|not found/i.test(msg)) {
    fail("Auth service", `${msg} — project may be paused`)
  } else {
    fail("Auth service", msg)
  }
} else {
  pass("Auth service", `${authData?.users?.length ?? 0} user(s) sampled`)
}

// 3. Core tables
const tables = [
  { name: "profiles", hint: "docs/supabase-profiles.sql" },
  { name: "campaigns", hint: "docs/supabase-campaigns.sql" },
  { name: "studio_states", hint: "docs/supabase-studio-cloud.sql" },
]

for (const { name, hint } of tables) {
  const { error } = await supabase.from(name).select("*", { head: true, count: "exact" })
  if (error?.code === "42P01") {
    warn(`${name} table`, `missing — run ${hint}`)
  } else if (error) {
    fail(`${name} table`, error.message)
  } else {
    pass(`${name} table`, "exists and queryable")
  }
}

// 4. Storage bucket
const { data: bucket, error: bucketError } = await supabase.storage.getBucket("campaign-clips")
if (bucketError) {
  warn("campaign-clips bucket", "missing or inaccessible — run docs/supabase-studio-cloud.sql")
} else {
  pass("campaign-clips bucket", `public=${bucket.public}`)
}

// 5. Write/read ping (storage) — bucket may be video-only by policy
const pingPath = `_healthcheck/ping-${Date.now()}.mp4`
const pingBody = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32])
const { error: uploadError } = await supabase.storage
  .from("campaign-clips")
  .upload(pingPath, pingBody, { contentType: "video/mp4", upsert: true })

if (uploadError) {
  if (/paused|inactive|disabled|502|503/i.test(uploadError.message)) {
    fail("Storage write test", `${uploadError.message} — project may be paused`)
  } else {
    warn("Storage write test", uploadError.message)
  }
} else {
  pass("Storage write test", "upload OK")
  const { error: removeError } = await supabase.storage.from("campaign-clips").remove([pingPath])
  if (removeError) {
    warn("Storage cleanup", removeError.message)
  } else {
    pass("Storage cleanup", "ping file removed")
  }
}

console.log("\n=== Summary ===")
if (failed) {
  console.error("FAILED — Supabase may be misconfigured or paused. Check https://supabase.com/dashboard")
  process.exit(1)
}

console.log("OK — Supabase project is online and responding.")
console.log("\nNote: Free-tier projects pause after ~7 days of inactivity.")
console.log("Using the app, running this script, or opening the Supabase dashboard counts as activity.")
console.log("For production, consider Pro plan or a weekly cron ping to avoid pause surprises.\n")
