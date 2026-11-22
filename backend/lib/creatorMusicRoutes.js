import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import multer from "multer"
import { requireAuth } from "./requireAuth.js"
import { requireAdmin } from "./adminAuth.js"
import { fingerprintAudioFile } from "./audioFingerprint.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MEDIA_DIR = path.join(__dirname, "..", "tmp", "media")
const LICENSE_GRANT = "neonsox_creator_music_v1"

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdir(MEDIA_DIR, { recursive: true })
        .then(() => cb(null, MEDIA_DIR))
        .catch((err) => cb(err))
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "") || ".mp3"
      cb(null, `creator_music_${Date.now()}${ext}`)
    },
  }),
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith("audio/") ||
      /\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(file.originalname || "")
    cb(ok ? null : new Error("Only audio files are allowed for music contributions"), ok)
  },
})

function missingTable(error) {
  const msg = String(error?.message || error || "")
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    /creator_music|does not exist|schema cache/i.test(msg)
  )
}

function publicBase(req) {
  return (process.env.PUBLIC_API_BASE || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")
}

export function registerCreatorMusicRoutes(app) {
  /** Accept Creator Music Terms (profile ack). */
  app.post("/api/creator-music/terms", requireAuth, async (req, res) => {
    const supabase = req.app.locals.getSupabase?.()
    if (!supabase) return res.status(503).json({ error: "Supabase not configured." })

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("profiles")
      .update({ creator_music_terms_accepted_at: now, updated_at: now })
      .eq("id", req.authUser.id)
      .select("creator_music_terms_accepted_at")
      .single()

    if (error) {
      if (missingTable(error) || /creator_music_terms/i.test(error.message || "")) {
        return res.status(503).json({
          error: "Run docs/supabase-creator-music.sql in Supabase SQL Editor first.",
          code: "schema_missing",
        })
      }
      return res.status(500).json({ error: error.message || "Could not save terms acceptance." })
    }

    res.json({ ok: true, creatorMusicTermsAcceptedAt: data?.creator_music_terms_accepted_at || now })
  })

  /** Status for Profile UI. */
  app.get("/api/creator-music/status", requireAuth, async (req, res) => {
    const supabase = req.app.locals.getSupabase?.()
    if (!supabase) return res.status(503).json({ error: "Supabase not configured." })

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("creator_music_terms_accepted_at")
      .eq("id", req.authUser.id)
      .single()

    if (profileError && missingTable(profileError)) {
      return res.status(503).json({
        error: "Run docs/supabase-creator-music.sql in Supabase SQL Editor first.",
        code: "schema_missing",
      })
    }

    const { data: mine, error: listError } = await supabase
      .from("creator_music_contributions")
      .select(
        "id, title, url, credit_name, license_grant, fingerprint_status, review_status, review_notes, created_at, reviewed_at"
      )
      .eq("user_id", req.authUser.id)
      .order("created_at", { ascending: false })
      .limit(40)

    if (listError && missingTable(listError)) {
      return res.status(503).json({
        error: "Run docs/supabase-creator-music.sql in Supabase SQL Editor first.",
        code: "schema_missing",
      })
    }

    res.json({
      ok: true,
      creatorMusicTermsAcceptedAt: profile?.creator_music_terms_accepted_at || null,
      fingerprintConfigured: !!(process.env.AUDD_API_TOKEN || "").trim(),
      contributions: mine || [],
    })
  })

  /**
   * Submit a bed: requires profile terms + per-upload grant checkbox.
   * Fingerprint match → auto-rejected. Otherwise pending your review.
   */
  app.post("/api/creator-music/contributions", requireAuth, (req, res) => {
    upload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message || "Upload failed" })
      if (!req.file) return res.status(400).json({ error: "No audio file received" })

      const supabase = req.app.locals.getSupabase?.()
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." })

      const title = String(req.body.title || "").trim() || req.file.originalname || "Untitled bed"
      const creditName = String(req.body.creditName || "").trim() || null
      const grantAccepted = String(req.body.licenseGrantAccepted || "") === "true"
      if (!grantAccepted) {
        await fs.unlink(req.file.path).catch(() => {})
        return res.status(400).json({
          error: "Confirm the per-upload license grant before submitting.",
          code: "grant_required",
        })
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("creator_music_terms_accepted_at")
        .eq("id", req.authUser.id)
        .single()

      if (profileError) {
        await fs.unlink(req.file.path).catch(() => {})
        if (missingTable(profileError) || /creator_music_terms/i.test(profileError.message || "")) {
          return res.status(503).json({
            error: "Run docs/supabase-creator-music.sql in Supabase SQL Editor first.",
            code: "schema_missing",
          })
        }
        return res.status(500).json({ error: "Could not verify terms acceptance." })
      }

      if (!profile?.creator_music_terms_accepted_at) {
        await fs.unlink(req.file.path).catch(() => {})
        return res.status(403).json({
          error: "Accept Creator Music Terms on your Profile first.",
          code: "terms_required",
        })
      }

      const fp = await fingerprintAudioFile(req.file.path)
      const url = `/api/media/${req.file.filename}`
      const now = new Date().toISOString()

      let fingerprintStatus = fp.status
      let reviewStatus = "pending"
      let reviewNotes = null
      let reviewedAt = null

      if (fp.status === "match") {
        reviewStatus = "rejected"
        reviewNotes = `Auto-rejected: fingerprint matched published recording${
          fp.detail?.artist || fp.detail?.title
            ? ` (${[fp.detail.artist, fp.detail.title].filter(Boolean).join(" — ")})`
            : ""
        }.`
        reviewedAt = now
      }

      const row = {
        user_id: req.authUser.id,
        title,
        url,
        filename: req.file.filename,
        credit_name: creditName,
        license_grant: LICENSE_GRANT,
        license_accepted_at: now,
        fingerprint_status: fingerprintStatus,
        fingerprint_detail: fp.detail || null,
        review_status: reviewStatus,
        review_notes: reviewNotes,
        reviewed_at: reviewedAt,
        updated_at: now,
      }

      const { data: saved, error: insertError } = await supabase
        .from("creator_music_contributions")
        .insert(row)
        .select(
          "id, title, url, credit_name, license_grant, fingerprint_status, review_status, review_notes, created_at"
        )
        .single()

      if (insertError) {
        await fs.unlink(req.file.path).catch(() => {})
        if (missingTable(insertError)) {
          return res.status(503).json({
            error: "Run docs/supabase-creator-music.sql in Supabase SQL Editor first.",
            code: "schema_missing",
          })
        }
        return res.status(500).json({ error: insertError.message || "Could not save contribution." })
      }

      res.json({
        ok: true,
        contribution: saved,
        absoluteUrl: `${publicBase(req)}${url}`,
        message:
          reviewStatus === "rejected"
            ? "Rejected — this file matched a published recording."
            : fingerprintStatus === "skipped"
              ? "Submitted for admin review (fingerprint skipped — no AUDD_API_TOKEN)."
              : "Submitted for admin review.",
      })
    })
  })

  /** Approved beds for Editing Bay library (authenticated). */
  app.get("/api/creator-music/library", requireAuth, async (req, res) => {
    const supabase = req.app.locals.getSupabase?.()
    if (!supabase) return res.status(503).json({ error: "Supabase not configured." })

    const { data, error } = await supabase
      .from("creator_music_contributions")
      .select("id, title, url, credit_name, created_at")
      .eq("review_status", "approved")
      .in("fingerprint_status", ["clear", "skipped"])
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      if (missingTable(error)) {
        return res.json({ ok: true, tracks: [], schemaMissing: true })
      }
      return res.status(500).json({ error: error.message || "Could not load library." })
    }

    const tracks = (data || []).map((t) => ({
      id: `contrib_${t.id}`,
      label: t.credit_name ? `${t.title} · ${t.credit_name}` : t.title,
      mood: "creator",
      license: "NEONSOX creator library",
      url: t.url,
      contributionId: t.id,
    }))

    res.json({ ok: true, tracks })
  })

  /** Admin review queue. */
  app.get("/api/admin/creator-music", requireAdmin, async (req, res) => {
    const supabase = req.app.locals.getSupabase?.()
    if (!supabase) return res.status(503).json({ error: "Supabase not configured." })

    const status = String(req.query.status || "pending")
    let q = supabase
      .from("creator_music_contributions")
      .select(
        "id, user_id, title, url, credit_name, license_grant, fingerprint_status, fingerprint_detail, review_status, review_notes, created_at, reviewed_at"
      )
      .order("created_at", { ascending: true })
      .limit(80)

    if (status !== "all") q = q.eq("review_status", status)

    const { data, error } = await q
    if (error) {
      if (missingTable(error)) {
        return res.status(503).json({
          error: "Run docs/supabase-creator-music.sql in Supabase SQL Editor first.",
          code: "schema_missing",
        })
      }
      return res.status(500).json({ error: error.message || "Could not load queue." })
    }

    res.json({
      ok: true,
      fingerprintConfigured: !!(process.env.AUDD_API_TOKEN || "").trim(),
      contributions: data || [],
    })
  })

  /** Admin approve / reject. */
  app.patch("/api/admin/creator-music/:id", requireAdmin, async (req, res) => {
    const supabase = req.app.locals.getSupabase?.()
    if (!supabase) return res.status(503).json({ error: "Supabase not configured." })

    const id = req.params.id
    const reviewStatus = String(req.body.review_status || "").toLowerCase()
    if (!["approved", "rejected", "pending"].includes(reviewStatus)) {
      return res.status(400).json({ error: "review_status must be approved, rejected, or pending." })
    }

    if (reviewStatus === "approved") {
      const { data: existing } = await supabase
        .from("creator_music_contributions")
        .select("fingerprint_status")
        .eq("id", id)
        .single()
      if (existing?.fingerprint_status === "match") {
        return res.status(400).json({
          error: "Cannot approve a fingerprint catalog match. Reject instead.",
        })
      }
    }

    const now = new Date().toISOString()
    const patch = {
      review_status: reviewStatus,
      review_notes: req.body.review_notes != null ? String(req.body.review_notes) : null,
      reviewed_by: req.adminUser.id,
      reviewed_at: reviewStatus === "pending" ? null : now,
      updated_at: now,
    }

    const { data, error } = await supabase
      .from("creator_music_contributions")
      .update(patch)
      .eq("id", id)
      .select(
        "id, title, url, credit_name, fingerprint_status, review_status, review_notes, reviewed_at"
      )
      .single()

    if (error) {
      return res.status(500).json({ error: error.message || "Could not update review." })
    }

    res.json({ ok: true, contribution: data })
  })
}
