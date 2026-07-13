import { listSupportedPlatforms, postToSocialPlatform, getSocialPlatformStatus } from "./social/index.js"

/**
 * Proprietary social API routes — app talks to platforms via backend adapters only.
 * OAuth + token storage land here next session (see docs/supabase-social-connections.sql).
 */
export function registerSocialRoutes(app) {
  app.get("/api/social/platforms", (_req, res) => {
    res.json({ platforms: listSupportedPlatforms() })
  })

  app.get("/api/social/status", (_req, res) => {
    res.json({ configured: getSocialPlatformStatus() })
  })

  app.get("/api/social/connections", (_req, res) => {
    const configured = getSocialPlatformStatus()
    const connections = Object.entries(configured)
      .filter(([, ready]) => ready)
      .map(([platform]) => ({ platform, status: "active", label: "Server configured" }))
    res.json({ connections })
  })

  app.post("/api/social/post", async (req, res) => {
    const {
      platform,
      postType,
      mediaUrl,
      caption,
      companyName,
      trayItemId,
      generationId,
      campaignKey,
    } = req.body || {}

    if (!platform || !mediaUrl) {
      return res.status(400).json({ ok: false, error: "platform and mediaUrl are required" })
    }

    const result = await postToSocialPlatform({
      platform,
      postType: postType || "media",
      mediaUrl,
      caption,
      companyName,
      trayItemId,
      generationId,
      campaignKey,
    })

    const status = result.status === "not_configured" ? 501 : result.ok ? 200 : 502
    return res.status(status).json(result)
  })
}
