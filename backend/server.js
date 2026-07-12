import express from "express"
import cors from "cors"
import Stripe from "stripe"
import dotenv from "dotenv"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import { runGeneration } from "./lib/generateVideo.js"
import { runAudioMix } from "./lib/runAudioMix.js"
import { runTextOverlay } from "./lib/runTextOverlay.js"
import { friendlyRunwayError } from "./lib/runwayErrors.js"
import { requireAdmin } from "./lib/adminAuth.js"
import { evaluateScaleMonitor, fetchSubscriberCounts } from "./lib/scaleMonitor.js"
import { enrichResultWithCloudUrls } from "./lib/clipCloudStorage.js"
import { registerSocialRoutes } from "./lib/socialRoutes.js"

import { publicAudioError, publicOverlayError } from "./lib/publicErrors.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MEDIA_DIR = path.join(__dirname, "tmp", "media")

dotenv.config()

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174"

const MEMBERSHIP_PRICE_ID = "price_1TiJgHF2RIMjk7tqxPseEcGr"
const CAMPAIGN_PRICE_IDS = new Set([
  "price_1TiJlTF2RIMjk7tqYqDM8AoN",
  "price_1TiJnMF2RIMjk7tqB3qQLoGQ",
  "price_1TiJp0F2RIMjk7tqpaRskSB3",
])

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

app.locals.getSupabase = getSupabase

// Stripe webhooks require the raw request body — register BEFORE express.json().
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"]
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set in backend/.env")
      return res.status(500).send("Webhook not configured")
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    try {
      if (event.type === "checkout.session.completed") {
        await handleCheckoutCompleted(event.data.object)
      }
    } catch (err) {
      console.error("Webhook handler error:", err.message)
      return res.status(500).send("Webhook handler failed")
    }

    res.json({ received: true })
  }
)

app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use("/api/media", express.static(MEDIA_DIR))

function checkoutSessionOwnerId(session) {
  return session.client_reference_id || session.metadata?.userId || null
}

/** Paid checkout — subscription or one-time campaign tier. */
function checkoutSessionIsComplete(session) {
  if (session.payment_status === "paid") return true
  if (session.status === "complete") return true
  return false
}

async function handleCheckoutCompleted(session) {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)")
  }

  const userId = session.client_reference_id || session.metadata?.userId
  if (!userId) {
    console.warn("checkout.session.completed without userId — session:", session.id)
    return
  }

  const updates = {}

  if (session.customer) {
    updates.stripe_customer_id =
      typeof session.customer === "string" ? session.customer : session.customer.id
  }

  // Subscription checkout → membership. One-time payment → campaign tier.
  if (session.mode === "subscription") {
    updates.has_membership = true
  } else if (session.mode === "payment") {
    updates.has_campaign = true
  }

  updates.updated_at = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id")

  if (error) throw new Error(error.message)

  if (!updated?.length) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      role: "member",
      has_membership: updates.has_membership ?? false,
      has_campaign: updates.has_campaign ?? false,
      stripe_customer_id: updates.stripe_customer_id ?? null,
      updated_at: updates.updated_at,
    })
    if (insertError) throw new Error(insertError.message)
    console.log("Profile created after checkout:", userId, updates)
    return
  }

  console.log("Profile updated after checkout:", userId, updates)
}

/** Confirm payment after Stripe redirect — no Stripe CLI or webhook required for local testing. */
app.post("/api/checkout/confirm", async (req, res) => {
  const { sessionId, userId } = req.body

  if (!sessionId || !userId) {
    return res.status(400).json({ error: "Missing checkout session." })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: "Stripe is not configured on the server." })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const ownerId = checkoutSessionOwnerId(session)

    if (!ownerId || ownerId !== userId) {
      return res.status(403).json({ error: "This payment does not belong to your account." })
    }

    if (!checkoutSessionIsComplete(session)) {
      return res.status(400).json({ error: "Payment is not complete yet. Wait a moment and refresh." })
    }

    await handleCheckoutCompleted(session)
    res.json({
      ok: true,
      mode: session.mode,
      purchaseType: session.metadata?.purchaseType || null,
    })
  } catch (err) {
    console.error("Checkout confirm error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/checkout", async (req, res) => {
  const { priceId, mode, userId, email } = req.body

  if (!userId || !email) {
    return res.status(401).json({ error: "You must be logged in to checkout." })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return res.status(500).json({ error: "Server is missing Supabase configuration." })
  }

  // Business rule: campaign tiers require active membership first.
  if (CAMPAIGN_PRICE_IDS.has(priceId)) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("has_membership")
      .eq("id", userId)
      .single()

    if (error || !profile?.has_membership) {
      return res.status(403).json({
        error: "Active membership required before purchasing a campaign tier.",
      })
    }
  }

  const purchaseType = priceId === MEMBERSHIP_PRICE_ID ? "membership" : "campaign"

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      client_reference_id: userId,
      customer_email: email,
      metadata: { userId, purchaseType },
      success_url: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing`,
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Runway video generation — API key stays server-side only.
app.post("/api/campaigns/:campaignId/generate", async (req, res) => {
  if (!process.env.RUNWAY_API_KEY) {
    return res.status(503).json({
      error: "Runway is not configured. Add RUNWAY_API_KEY to backend/.env and restart the backend.",
    })
  }

  try {
    const result = await runGeneration(req.body)
    const enriched = await enrichResultWithCloudUrls(result, {
      userId: req.body.userId,
      campaignKey: req.params.campaignId,
      generationId: req.body.generationId,
    })
    if (enriched.status === "failed") {
      console.error("Runway generate failed:", enriched.error)
      return res.json({
        ...enriched,
        error: friendlyRunwayError(enriched.error, { refundTry: enriched.refundTry }),
      })
    }
    res.json(enriched)
  } catch (err) {
    const friendly = friendlyRunwayError(err.message)
    console.error("Runway generate error:", err.message)
    res.status(500).json({
      status: "failed",
      error: friendly,
      refundTry: false,
    })
  }
})

app.post("/api/campaigns/:campaignId/overlay-text", async (req, res) => {
  try {
    const result = await runTextOverlay({
      ...req.body,
      generationId: req.body.generationId || `${req.params.campaignId}-overlay-${Date.now()}`,
    })
    const enriched = await enrichResultWithCloudUrls(result, {
      userId: req.body.userId,
      campaignKey: req.params.campaignId,
      generationId: req.body.generationId,
    })
    res.json(enriched)
  } catch (err) {
    console.error("Text overlay error:", err.message)
    res.status(500).json({
      status: "failed",
      error: publicOverlayError(err.message),
    })
  }
})

app.post("/api/campaigns/:campaignId/mix-audio", async (req, res) => {
  if (String(process.env.ELEVENLABS_AUDIO_ENABLED || "").toLowerCase() !== "true") {
    console.warn("Audio mix requested but ELEVENLABS_AUDIO_ENABLED is not true")
    return res.status(503).json({
      status: "failed",
      error: publicAudioError("disabled"),
    })
  }

  try {
    const result = await runAudioMix({
      ...req.body,
      generationId: req.body.generationId || `${req.params.campaignId}-${Date.now()}`,
    })
    const enriched = await enrichResultWithCloudUrls(result, {
      userId: req.body.userId,
      campaignKey: req.params.campaignId,
      generationId: req.body.generationId,
    })
    res.json(enriched)
  } catch (err) {
    console.error("Audio mix error:", err.message)
    res.status(500).json({
      status: "failed",
      error: publicAudioError(err.message),
    })
  }
})

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    runway: !!process.env.RUNWAY_API_KEY,
    elevenLabs: !!process.env.ELEVENLABS_API_KEY,
    audioMixEnabled: String(process.env.ELEVENLABS_AUDIO_ENABLED || "").toLowerCase() === "true",
    textOverlayEnabled: true,
    durationSeconds: Number(process.env.RUNWAY_DURATION_SECONDS || 10),
  })
})

app.get("/api/admin/scale-monitor", requireAdmin, async (_req, res) => {
  const supabase = getSupabase()
  if (!supabase) {
    return res.status(503).json({ error: "Server is missing Supabase configuration." })
  }

  try {
    const counts = await fetchSubscriberCounts(supabase)
    const report = evaluateScaleMonitor(counts)
    res.json(report)
  } catch (err) {
    console.error("Scale monitor error:", err.message)
    res.status(500).json({ error: "Could not load Scale Monitor data." })
  }
})

registerSocialRoutes(app)

const PORT = Number(process.env.PORT || 4242)

const server = app.listen(PORT)

server.on("listening", () => {
  console.log(`Backend running on http://localhost:${PORT}`)
  console.log("Leave this window open while you use the app. Press Ctrl+C to stop.")
  if (process.env.RUNWAY_API_KEY) {
    console.log(
      `Runway: configured · ${process.env.RUNWAY_DURATION_SECONDS || 10}s clips · model ${process.env.RUNWAY_MODEL || "gen4.5"}`
    )
  } else {
    console.log("Runway: RUNWAY_API_KEY not set (generation endpoint disabled)")
  }
  const audioOn = String(process.env.ELEVENLABS_AUDIO_ENABLED || "").toLowerCase() === "true"
  if (audioOn && process.env.ELEVENLABS_API_KEY) {
    console.log("ElevenLabs: audio mix enabled (TTS + music + ffmpeg)")
  } else if (process.env.ELEVENLABS_API_KEY) {
    console.log("ElevenLabs: key set · set ELEVENLABS_AUDIO_ENABLED=true to enable mix")
  }
  console.log("ffmpeg: text overlay (Step 6) enabled · bundled fonts in assets/fonts/")
})

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use — the backend is already running on this computer.`)
    console.error(`Check: http://localhost:${PORT}/api/health`)
    console.error("To run it in this window instead, stop the existing process first:")
    console.error(`  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`)
    console.error("Then run: node server.js\n")
  } else {
    console.error("Server failed to start:", err.message)
  }
  process.exit(1)
})
