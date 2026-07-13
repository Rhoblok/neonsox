import { useCallback, useEffect, useMemo, useState } from "react"
import NeonButton from "../NeonButton"
import { useTheme } from "../../context/ThemeContext"
import { SOCIAL_PLATFORMS } from "../../lib/socialPlatforms"
import { studioKeyFromSetup } from "../../lib/paletteStudioStorage"
import { loadSocialsTray } from "../../lib/socialsTrayStorage"
import { trayItemPlaybackUrl } from "../../lib/studioSteps"
import { postToSocial } from "../../lib/socialApi"
import { platformById } from "../../lib/socialPlatforms"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4242"

function resolveMediaUrl(url) {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`
}

function downloadFilename(companyName) {
  const base = (companyName || "neonsox-ad")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48)
  return `${base || "neonsox-ad"}.mp4`
}

function formatExportedAt(iso) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

export default function SocialsTrayPanel({
  campaignSetup,
  platforms = [],
  platformAllowance = 2,
  onTogglePlatform,
}) {
  const { colors } = useTheme()
  const campaignKey = useMemo(() => studioKeyFromSetup(campaignSetup), [campaignSetup])
  const [items, setItems] = useState(() => loadSocialsTray(campaignKey))
  const [highlight, setHighlight] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [copyMsg, setCopyMsg] = useState("")
  const [downloadMsg, setDownloadMsg] = useState("")
  const [downloading, setDownloading] = useState(false)
  const [socialStatus, setSocialStatus] = useState({})
  const [socialReady, setSocialReady] = useState(null)
  const [postingPlatform, setPostingPlatform] = useState(null)
  const [postMsg, setPostMsg] = useState("")

  const refresh = useCallback(() => {
    const next = loadSocialsTray(campaignKey)
    setItems(next)
    setActiveIndex(0)
  }, [campaignKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    fetch(`${API_BASE}/api/social/status`)
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setSocialStatus(data?.configured || {})
        setSocialReady(true)
      })
      .catch(() => {
        setSocialStatus({})
        setSocialReady(false)
      })
  }, [])

  useEffect(() => {
    function onUpdated() {
      refresh()
    }
    function onScrollHere() {
      refresh()
      setHighlight(true)
      document.getElementById("socials-tray")?.scrollIntoView({ behavior: "smooth", block: "start" })
      window.setTimeout(() => setHighlight(false), 2200)
    }
    window.addEventListener("neonsox-socials-tray-updated", onUpdated)
    window.addEventListener("neonsox-scroll-socials-tray", onScrollHere)
    return () => {
      window.removeEventListener("neonsox-socials-tray-updated", onUpdated)
      window.removeEventListener("neonsox-scroll-socials-tray", onScrollHere)
    }
  }, [refresh])

  const active = items[activeIndex] || items[0] || null
  const src = active ? resolveMediaUrl(trayItemPlaybackUrl(active)) : null

  function goToPaletteEditor() {
    document.getElementById("palette-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function copyVideoLink() {
    if (!src) return
    setCopyMsg("")
    try {
      await navigator.clipboard.writeText(src)
      setCopyMsg("Link copied!")
    } catch {
      setCopyMsg("Could not copy — select the link below and copy manually.")
    }
    window.setTimeout(() => setCopyMsg(""), 3500)
  }

  async function downloadVideo() {
    if (!src || downloading) return
    setDownloadMsg("")
    setDownloading(true)
    try {
      const res = await fetch(src)
      if (!res.ok) throw new Error("fetch failed")
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = objectUrl
      anchor.download = downloadFilename(active?.companyName)
      anchor.click()
      URL.revokeObjectURL(objectUrl)
      setDownloadMsg("Download started!")
    } catch {
      setDownloadMsg("Download failed — try Copy link and save from your browser.")
    } finally {
      setDownloading(false)
      window.setTimeout(() => setDownloadMsg(""), 4000)
    }
  }

  async function postToPlatform(platformId) {
    if (!active || !src || postingPlatform) return
    const label = platformById(platformId)?.label || platformId
    setPostMsg("")
    setPostingPlatform(platformId)
    try {
      const caption = [active.companyName, active.industry].filter(Boolean).join(" — ")
      const result = await postToSocial({
        platform: platformId,
        mediaUrl: src,
        postType: "media",
        caption,
        companyName: active.companyName,
        trayItemId: active.id,
        generationId: active.generationId,
        campaignKey,
      })
      setPostMsg(result.ok ? `Posted to ${label}!` : result.error || "Post failed")
    } catch (err) {
      setPostMsg(err.message || "Post failed")
    } finally {
      setPostingPlatform(null)
      window.setTimeout(() => setPostMsg(""), 5000)
    }
  }

  const showPostSection = platforms.length > 0

  return (
    <section
      id="socials-tray"
      style={{
        marginTop: "12px",
        padding: "14px",
        borderRadius: "12px",
        border: `1px solid ${highlight ? "#00d4ff" : colors.border}`,
        background: colors.bg,
        boxShadow: highlight ? "0 0 22px rgba(0,212,255,0.4)" : "none",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        textAlign: "left",
      }}
    >
      <button
        type="button"
        onClick={goToPaletteEditor}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "10px",
          padding: "6px 12px",
          borderRadius: "999px",
          border: `1px solid ${colors.border}`,
          background: colors.surfaceAlt,
          color: colors.accent,
          fontSize: "0.72rem",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ← Go back to Palette Editor
      </button>

      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: colors.accent,
          marginBottom: "10px",
        }}
      >
        Socials Tray
      </div>

      {!active ? (
        <p style={{ margin: 0, fontSize: "0.78rem", color: colors.textMuted, lineHeight: 1.5 }}>
          Your finished ad appears here — big preview, ready to post.
        </p>
      ) : (
        <>
          {items.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: `1px solid ${idx === activeIndex ? colors.accent : colors.border}`,
                    background: idx === activeIndex ? colors.accentSoft : colors.surfaceAlt,
                    color: idx === activeIndex ? colors.accent : colors.textMuted,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Ad {items.length - idx}
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              borderRadius: "10px",
              overflow: "hidden",
              border: `1px solid ${colors.border}`,
              background: colors.surfaceAlt,
              marginBottom: "10px",
            }}
          >
            <div style={{ aspectRatio: "16 / 9", width: "100%" }}>
              {src ? (
                <video
                  key={src}
                  src={src}
                  controls
                  style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    minHeight: "160px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.textFaint,
                    fontSize: "0.8rem",
                  }}
                >
                  Video unavailable
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: "0.9rem", fontWeight: 800, color: colors.text, marginBottom: "2px" }}>
            {active.companyName || "Your ad"}
          </div>
          {active.industry && (
            <div style={{ fontSize: "0.72rem", color: colors.textMuted, marginBottom: "4px" }}>
              {active.industry}
            </div>
          )}
          <div style={{ fontSize: "0.65rem", color: colors.textFaint, marginBottom: "12px" }}>
            Exported {formatExportedAt(active.exportedAt)}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
            <NeonButton size="sm" variant="secondary" disabled={!src} onClick={copyVideoLink}>
              Copy link
            </NeonButton>
            <NeonButton size="sm" disabled={!src || downloading} onClick={downloadVideo}>
              {downloading ? "Downloading…" : "Download video"}
            </NeonButton>
            {(copyMsg || downloadMsg) && (
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: colors.accent }}>
                {copyMsg || downloadMsg}
              </span>
            )}
          </div>

          {src && (
            <details style={{ marginBottom: "12px" }}>
              <summary
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: colors.textFaint,
                  cursor: "pointer",
                  marginBottom: "6px",
                }}
              >
                Show video link
              </summary>
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surfaceAlt,
                  fontSize: "0.68rem",
                  color: colors.textMuted,
                  wordBreak: "break-all",
                  lineHeight: 1.4,
                }}
              >
                {src}
              </div>
            </details>
          )}

          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: colors.textFaint, marginBottom: "8px" }}>
            Post to ({platforms.length}/{platformAllowance})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {SOCIAL_PLATFORMS.map((p) => {
              const on = platforms.includes(p.id)
              const atCap = !on && platforms.length >= platformAllowance
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!onTogglePlatform || atCap}
                  onClick={() => onTogglePlatform?.(p.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "999px",
                    border: `1px solid ${on ? colors.accent : colors.border}`,
                    background: on ? colors.accentSoft : colors.surfaceAlt,
                    color: on ? colors.accent : colors.textMuted,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: atCap || !onTogglePlatform ? "not-allowed" : "pointer",
                    opacity: atCap ? 0.45 : 1,
                  }}
                >
                  {on ? "✓ " : ""}
                  {p.label}
                </button>
              )
            })}
          </div>

          {showPostSection && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: colors.textFaint, marginBottom: "8px" }}>
                Post now
              </div>
              {socialReady === false && (
                <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: "#ff8a8a", lineHeight: 1.5 }}>
                  Backend needs a restart with the latest code. In PowerShell:{" "}
                  <code style={{ fontSize: "0.7rem" }}>cd backend → node server.js</code>, then hard refresh this page.
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                {platforms.map((platformId) => {
                  const label = platformById(platformId)?.label || platformId
                  const wired = !!socialStatus[platformId]
                  const busy = postingPlatform === platformId
                  return (
                    <NeonButton
                      key={platformId}
                      size="sm"
                      disabled={!src || !!postingPlatform || !wired}
                      onClick={() => postToPlatform(platformId)}
                    >
                      {busy ? "Posting…" : wired ? `Post to ${label}` : `${label} (soon)`}
                    </NeonButton>
                  )
                })}
                {postMsg && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: colors.accent }}>{postMsg}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
