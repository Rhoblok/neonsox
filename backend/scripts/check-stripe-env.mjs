#!/usr/bin/env node
/**
 * Pre-flight check for local Stripe checkout testing (no Stripe CLI required).
 * Usage: node scripts/check-stripe-env.mjs
 */
import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "..", ".env")

function readEnv() {
  try {
    const raw = readFileSync(envPath, "utf8")
    const out = {}
    for (const line of raw.split("\n")) {
      const t = line.trim()
      if (!t || t.startsWith("#")) continue
      const i = t.indexOf("=")
      if (i === -1) continue
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
    return out
  } catch {
    return {}
  }
}

const env = readEnv()
let ok = true

function check(label, pass, hint) {
  if (pass) {
    console.log(`✓ ${label}`)
  } else {
    console.log(`✗ ${label}`)
    if (hint) console.log(`  → ${hint}`)
    ok = false
  }
}

check("STRIPE_SECRET_KEY set", !!env.STRIPE_SECRET_KEY?.startsWith("sk_"), "Add sk_test_... to backend/.env")
check(
  "FRONTEND_URL matches Vite (5173 or 5174)",
  env.FRONTEND_URL === "http://localhost:5173" || env.FRONTEND_URL === "http://localhost:5174",
  "Set FRONTEND_URL to the port shown when you run npm run dev"
)
check("SUPABASE_URL set", !!env.SUPABASE_URL, "Add SUPABASE_URL to backend/.env")
check("SUPABASE_SERVICE_ROLE_KEY set", !!env.SUPABASE_SERVICE_ROLE_KEY, "Add service role key to backend/.env")

const webhook = env.STRIPE_WEBHOOK_SECRET
if (webhook?.startsWith("whsec_") && webhook !== "leave_blank_for_now") {
  console.log("✓ STRIPE_WEBHOOK_SECRET set (optional — for production webhook backup)")
} else {
  console.log("○ STRIPE_WEBHOOK_SECRET not set — OK for local testing (Success page confirms payment)")
}

console.log("")
if (ok) {
  console.log("Ready for checkout test. No Stripe CLI needed — see RUN.md §3.")
} else {
  console.log("Fix the items above, restart backend, then run checkout test.")
  process.exit(1)
}
