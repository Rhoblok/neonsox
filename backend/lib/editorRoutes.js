import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import multer from "multer"
import { renderEditorProject } from "./ffmpegEditor.js"
import { enrichResultWithCloudUrls } from "./clipCloudStorage.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MEDIA_DIR = path.join(__dirname, "..", "tmp", "media")

const EXT_BY_MIME = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/aac": ".aac",
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdir(MEDIA_DIR, { recursive: true })
        .then(() => cb(null, MEDIA_DIR))
        .catch((err) => cb(err))
    },
    filename: (_req, file, cb) => {
      const ext = EXT_BY_MIME[file.mimetype] || path.extname(file.originalname) || ".bin"
      cb(null, `upload_${Date.now()}${ext}`)
    },
  }),
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("audio/") ||
      /\.(mp4|webm|mov|mp3|m4a|wav|aac)$/i.test(file.originalname || "")
    cb(ok ? null : new Error("Only video or audio files are allowed"), ok)
  },
})

export function registerEditorRoutes(app) {
  app.post("/api/editor/upload", (req, res) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Upload failed" })
      }
      if (!req.file) {
        return res.status(400).json({ error: "No file received" })
      }

      const isVideo = req.file.mimetype.startsWith("video/")
      const isAudio = req.file.mimetype.startsWith("audio/")
      const kind = isVideo ? "video" : isAudio ? "audio" : "unknown"

      res.json({
        ok: true,
        kind,
        url: `/api/media/${req.file.filename}`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      })
    })
  })

  app.post("/api/campaigns/:campaignId/editor/render", async (req, res) => {
    try {
      const videoClips = Array.isArray(req.body.videoClips) ? req.body.videoClips.filter(Boolean) : []
      if (!videoClips.length) {
        return res.status(400).json({ status: "failed", error: "Add at least one video clip." })
      }

      const result = await renderEditorProject({
        videoClips,
        musicUrl: req.body.musicUrl || null,
        voiceUrl: req.body.voiceUrl || null,
        musicVolume: Number(req.body.musicVolume ?? 40) / 100,
        campaignId: String(req.params.campaignId || "editor").slice(0, 80),
        apiBase: process.env.API_BASE || "",
      })

      const enriched = await enrichResultWithCloudUrls(
        {
          ...result,
          brandedOutputUrl: result.outputUrl,
          finalOutputUrl: result.outputUrl,
        },
        {
          userId: req.body.userId,
          campaignKey: req.params.campaignId,
          generationId: `editor_${Date.now()}`,
        }
      )

      res.json({
        ...result,
        cloudOutputUrl: enriched.cloudBrandedOutputUrl || enriched.cloudFinalOutputUrl || null,
      })
    } catch (err) {
      console.error("Editor render error:", err.message)
      res.status(500).json({ status: "failed", error: err.message || "Render failed" })
    }
  })
}
