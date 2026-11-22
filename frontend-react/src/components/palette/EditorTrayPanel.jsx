import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import NeonButton from "../NeonButton"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"
import { studioKeyFromSetup, loadStudioState } from "../../lib/paletteStudioStorage"
import { loadSocialsTray, addToSocialsTray } from "../../lib/socialsTrayStorage"
import { trayItemPlaybackUrl, exportPlaybackUrl } from "../../lib/studioSteps"
import StudioClipPicker from "./StudioClipPicker"
import EditingBayTimeline, { trackById, setEditorDragPayload } from "./EditingBayTimeline"
import {
  loadEditorTray,
  patchEditorTray,
  addEditorUpload,
  makeClipRef,
} from "../../lib/editorTrayStorage"
import { uploadEditorMedia, renderEditorProject, resolveMediaUrl } from "../../lib/editorApi"
import { NEONSOX_MUSIC_LIBRARY } from "../../lib/neonsoxMusicLibrary"
import { fetchCreatorMusicLibrary } from "../../lib/creatorMusicApi"
import { pushActivity } from "../../lib/activityLogStorage"

function neonTitleStyle(colors, size = "0.62rem") {
  return {
    fontSize: size,
    fontWeight: 800,
    color: colors.text,
    marginBottom: "2px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    textShadow: `0 0 8px ${colors.glow}, 0 0 16px rgba(56, 189, 248, 0.3)`,
  }
}

function cutRoomLabelStyle(colors) {
  return {
    fontSize: "0.68rem",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: colors.accent,
    marginBottom: "2px",
    textShadow: `0 0 10px ${colors.glow}, 0 0 18px rgba(56, 189, 248, 0.4)`,
  }
}

function panelStyle(colors, glow = false) {
  return {
    padding: "4px 6px",
    borderRadius: "7px",
    border: `1px solid ${glow ? "rgba(56, 189, 248, 0.4)" : colors.border}`,
    background: colors.surfaceAlt,
    boxShadow: glow ? "0 0 10px rgba(56, 189, 248, 0.25)" : "none",
  }
}

function ImportMenu({
  label,
  onPickFile,
  trayItems,
  uploads,
  onPickTray,
  onPickUpload,
  colors,
  track,
  allowUpload = true,
  allowTray = true,
  libraryTracks = null,
  onPickLibrary = null,
  libraryTitle = "NEONSOX library",
}) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const accent = track?.accent || colors.accent
  const border = track?.border || colors.border
  const fill = track?.fill || colors.surfaceAlt
  const hasLibrary = Array.isArray(libraryTracks) && libraryTracks.length > 0

  useEffect(() => {
    if (!open) return undefined
    function place() {
      const rect = btnRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuW = 240
      const pad = 8
      let left = rect.left
      let top = rect.bottom + 4
      if (left + menuW > window.innerWidth - pad) left = Math.max(pad, window.innerWidth - menuW - pad)
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 200 && rect.top > spaceBelow) {
        top = Math.max(pad, rect.top - 4 - 200)
      }
      setMenuPos({ top, left })
    }
    place()
    function onDoc(e) {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "3px 8px",
          borderRadius: "5px",
          border: `1.5px solid ${border}`,
          background: fill,
          color: accent,
          fontSize: "0.58rem",
          fontWeight: 900,
          letterSpacing: "0.04em",
          cursor: "pointer",
          textShadow: `0 0 8px ${accent}`,
          boxShadow: `0 0 10px ${accent}44`,
        }}
      >
        + {label}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            minWidth: "240px",
            maxWidth: "min(300px, calc(100vw - 16px))",
            maxHeight: "min(280px, calc(100vh - 24px))",
            overflowY: "auto",
            padding: "8px",
            borderRadius: "8px",
            border: `1px solid ${border}`,
            background: colors.bg,
            boxShadow: `0 10px 28px rgba(0,0,0,0.55), 0 0 16px ${accent}33`,
          }}
        >
          <div style={{ fontSize: "0.58rem", fontWeight: 800, color: accent, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Add to {track?.label || label}
          </div>

          {hasLibrary && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "0.55rem", color: colors.textFaint, marginBottom: "2px", fontWeight: 700 }}>
                {libraryTitle}
              </div>
              {libraryTracks.map((trackItem) => (
                <button
                  key={trackItem.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onPickLibrary?.(trackItem)
                  }}
                  style={menuItemStyle(colors)}
                >
                  {trackItem.label}
                  {!trackItem.url ? (
                    <span style={{ display: "block", fontSize: "0.48rem", color: colors.textFaint, fontWeight: 600 }}>
                      Licensed · audio bed soon
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {allowUpload && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onPickFile()
              }}
              style={menuItemStyle(colors)}
            >
              Upload from my files
            </button>
          )}

          {allowTray && (
            <div style={{ marginTop: allowUpload || hasLibrary ? "8px" : 0 }}>
              <div style={{ fontSize: "0.55rem", color: colors.textFaint, marginBottom: "2px", fontWeight: 700 }}>
                From Socials Tray
              </div>
              {trayItems.length > 0 ? (
                trayItems.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false)
                      onPickTray(item)
                    }}
                    style={menuItemStyle(colors)}
                  >
                    {item.companyName || `Tray ad ${trayItems.length - idx}`}
                  </button>
                ))
              ) : (
                <p style={{ margin: "0 0 4px", fontSize: "0.52rem", color: colors.textFaint }}>
                  No tray ads yet — export one from Palette first.
                </p>
              )}
            </div>
          )}

          {allowUpload && (
            <div style={{ marginTop: "8px" }}>
              <div style={{ fontSize: "0.55rem", color: colors.textFaint, marginBottom: "2px", fontWeight: 700 }}>
                From my uploads
              </div>
              {uploads.length > 0 ? (
                uploads.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false)
                      onPickUpload(asset)
                    }}
                    style={menuItemStyle(colors)}
                  >
                    {asset.label}
                  </button>
                ))
              ) : (
                <p style={{ margin: "0", fontSize: "0.52rem", color: colors.textFaint }}>
                  No uploads yet — use “Upload from my files”.
                </p>
              )}
            </div>
          )}

          {!allowUpload && hasLibrary && (
            <p style={{ margin: "8px 0 0", fontSize: "0.5rem", color: colors.textFaint, lineHeight: 1.35 }}>
              Music is NEONSOX-licensed only (protects your ads). Admins can upload custom beds.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function trackPanelStyle(track) {
  return {
    padding: "4px 6px",
    borderRadius: "7px",
    border: `1.5px solid ${track.border}`,
    background: track.fill,
    boxShadow: `0 0 12px ${track.accent}33`,
  }
}

function trackLabelStyle(track) {
  return {
    fontSize: "0.58rem",
    fontWeight: 900,
    letterSpacing: "0.06em",
    color: track.accent,
    textShadow: `0 0 8px ${track.accent}`,
    margin: 0,
  }
}

function menuItemStyle(colors) {
  return {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "6px 8px",
    marginBottom: "2px",
    borderRadius: "6px",
    border: "none",
    background: "transparent",
    color: colors.text,
    fontSize: "0.72rem",
    cursor: "pointer",
  }
}

export default function EditorTrayPanel({ campaignSetup }) {
  const { colors } = useTheme()
  const { user, isAdmin } = useAuth()
  const campaignKey = useMemo(() => studioKeyFromSetup(campaignSetup), [campaignSetup])
  const [editor, setEditor] = useState(() => loadEditorTray(campaignKey))
  const [trayItems, setTrayItems] = useState(() => loadSocialsTray(campaignKey))
  const [studioGenerations, setStudioGenerations] = useState(
    () => loadStudioState(campaignKey).generations || []
  )
  const [selectedStudioIds, setSelectedStudioIds] = useState([])
  const [rendering, setRendering] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState("")
  const [creatorLibrary, setCreatorLibrary] = useState([])

  const musicLibraryTracks = useMemo(
    () => [...NEONSOX_MUSIC_LIBRARY, ...creatorLibrary],
    [creatorLibrary]
  )

  const videoInputRef = useRef(null)
  const musicInputRef = useRef(null)
  const voiceInputRef = useRef(null)
  const sfxInputRef = useRef(null)
  const foleyInputRef = useRef(null)
  const adrInputRef = useRef(null)
  const pendingUploadKind = useRef("video")

  const refresh = useCallback(() => {
    setEditor(loadEditorTray(campaignKey))
    setTrayItems(loadSocialsTray(campaignKey))
    setStudioGenerations(loadStudioState(campaignKey).generations || [])
  }, [campaignKey])

  useEffect(() => {
    refresh()
    setSelectedStudioIds([])
  }, [refresh, campaignKey])

  useEffect(() => {
    let active = true
    fetchCreatorMusicLibrary()
      .then((data) => {
        if (active) setCreatorLibrary(Array.isArray(data.tracks) ? data.tracks : [])
      })
      .catch(() => {
        if (active) setCreatorLibrary([])
      })
    return () => {
      active = false
    }
  }, [campaignKey])

  useEffect(() => {
    function onUpdated() {
      refresh()
    }
    window.addEventListener("neonsox-editor-tray-updated", onUpdated)
    window.addEventListener("neonsox-socials-tray-updated", onUpdated)
    window.addEventListener("neonsox-studio-updated", onUpdated)
    return () => {
      window.removeEventListener("neonsox-editor-tray-updated", onUpdated)
      window.removeEventListener("neonsox-socials-tray-updated", onUpdated)
      window.removeEventListener("neonsox-studio-updated", onUpdated)
    }
  }, [refresh])

  const previewUrl = useMemo(() => {
    if (editor.lastRender?.url) return resolveMediaUrl(editor.lastRender.cloudUrl || editor.lastRender.url)
    const first = editor.videoClips[0]
    return first ? resolveMediaUrl(first.url) : null
  }, [editor])

  function persist(next) {
    patchEditorTray(campaignKey, next)
    setEditor(next)
  }

  async function handleFileInput(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ""
    if (!files.length) return
    const kind = pendingUploadKind.current
    if (kind === "music" && !isAdmin) {
      setMsg("Music uploads are admin-only. Pick a NEONSOX licensed bed instead.")
      return
    }
    setUploading(true)
    setMsg("")
    let added = 0

    try {
      const current = loadEditorTray(campaignKey)
      let nextClips = [...current.videoClips]
      let nextMusic = current.music
      let nextVoice = current.voice
      let nextSfx = [...(current.sfxClips || [])]
      let nextFoley = [...(current.foleyClips || [])]
      let nextAdr = [...(current.adrClips || [])]

      for (const file of files) {
        const uploaded = await uploadEditorMedia(file)
        addEditorUpload(campaignKey, {
          url: uploaded.url,
          kind: uploaded.kind,
          label: uploaded.originalName || file.name,
          originalName: uploaded.originalName || file.name,
        })
        const ref = makeClipRef({
          url: uploaded.url,
          label: uploaded.originalName || file.name,
          source: "upload",
          kind: kind === "video" ? "video" : kind,
        })

        if (kind === "video" && uploaded.kind === "video") {
          nextClips = [...nextClips, ref]
          added++
        } else if (kind === "music" && (uploaded.kind === "audio" || uploaded.kind === "video")) {
          nextMusic = { ...ref, kind: "music" }
          added++
        } else if (kind === "voice" && (uploaded.kind === "audio" || uploaded.kind === "video")) {
          nextVoice = { ...ref, kind: "voice" }
          added++
        } else if (kind === "sfx" && (uploaded.kind === "audio" || uploaded.kind === "video")) {
          nextSfx = [...nextSfx, { ...ref, kind: "sfx" }]
          added++
        } else if (kind === "foley" && (uploaded.kind === "audio" || uploaded.kind === "video")) {
          nextFoley = [...nextFoley, { ...ref, kind: "foley" }]
          added++
        } else if (kind === "adr" && (uploaded.kind === "audio" || uploaded.kind === "video")) {
          nextAdr = [...nextAdr, { ...ref, kind: "adr" }]
          added++
        }
      }

      if (!added) {
        setMsg("Wrong file type for this slot.")
      } else {
        persist({
          ...current,
          videoClips: nextClips,
          music: nextMusic,
          voice: nextVoice,
          sfxClips: nextSfx,
          foleyClips: nextFoley,
          adrClips: nextAdr,
        })
        setMsg(`Added to ${kind}.`)
      }
      refresh()
    } catch (err) {
      setMsg(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function openFilePicker(kind) {
    if (kind === "music" && !isAdmin) {
      setMsg("Music uploads are admin-only. Use + Add → NEONSOX library.")
      return
    }
    pendingUploadKind.current = kind
    if (kind === "video") videoInputRef.current?.click()
    else if (kind === "music") musicInputRef.current?.click()
    else if (kind === "voice") voiceInputRef.current?.click()
    else if (kind === "sfx") sfxInputRef.current?.click()
    else if (kind === "foley") foleyInputRef.current?.click()
    else if (kind === "adr") adrInputRef.current?.click()
  }

  function addMusicFromLibrary(track) {
    if (!track) return
    const current = loadEditorTray(campaignKey)
    const ref = makeClipRef({
      url: track.url || "",
      label: track.label,
      source: "neonsox-library",
      kind: "music",
    })
    persist({
      ...current,
      music: { ...ref, kind: "music", libraryId: track.id, license: track.license || "NEONSOX exclusive" },
    })
    setMsg(
      track.url
        ? `NEONSOX bed “${track.label}” on MUSIC.`
        : `Reserved “${track.label}” (licensed). Audio file ships with the library drop.`
    )
  }

  function addVideoFromTray(item) {
    const url = trayItemPlaybackUrl(item)
    if (!url) return
    const current = loadEditorTray(campaignKey)
    persist({
      ...current,
      videoClips: [
        ...current.videoClips,
        makeClipRef({
          url,
          label: item.companyName || "Tray clip",
          source: "tray",
          trayId: item.id,
        }),
      ],
    })
  }

  function toggleStudioSelection(id) {
    setSelectedStudioIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleAllStudio(ids, select) {
    setSelectedStudioIds(select ? ids : [])
  }

  function addStudioClipById(generationId) {
    addFromDrag({ type: "studio", generationId }, "video", undefined)
  }

  function addSelectedStudioClips() {
    if (!selectedStudioIds.length) return
    for (const id of selectedStudioIds) {
      addStudioClipById(id)
    }
  }

  function insertClipOnTrack(lane, ref, targetIndex) {
    const current = loadEditorTray(campaignKey)
    if (lane === "music") {
      persist({ ...current, music: { ...ref, kind: "music" } })
      return
    }
    if (lane === "voice") {
      persist({ ...current, voice: { ...ref, kind: "voice" } })
      return
    }
    if (lane === "video") {
      const list = [...current.videoClips]
      const at = Math.min(Math.max(0, targetIndex ?? list.length), list.length)
      list.splice(at, 0, { ...ref, kind: "video" })
      persist({ ...current, videoClips: list })
      return
    }
    const key = lane === "sfx" ? "sfxClips" : lane === "foley" ? "foleyClips" : "adrClips"
    const list = [...(current[key] || [])]
    const at = Math.min(Math.max(0, targetIndex ?? list.length), list.length)
    list.splice(at, 0, { ...ref, kind: lane })
    persist({ ...current, [key]: list })
  }

  /** Drop from Cut Room (studio try / upload / tray) onto a timeline lane. */
  function addFromDrag(payload, targetTrackId, targetIndex) {
    if (!payload?.type) return

    if (payload.type === "studio") {
      if (targetTrackId !== "video") {
        setMsg("Studio tries drop on the VIDEO track.")
        return
      }
      const gen = studioGenerations.find((g) => g.id === payload.generationId)
      const url = exportPlaybackUrl(gen)
      if (!gen || gen.status !== "succeeded" || !url) {
        setMsg("That studio clip isn't ready.")
        return
      }
      const current = loadEditorTray(campaignKey)
      if (current.videoClips.some((c) => c.generationId === gen.id)) {
        setMsg("That try is already on the timeline.")
        return
      }
      insertClipOnTrack(
        "video",
        makeClipRef({
          url,
          label: `Try ${gen.retryIndex || "?"}`,
          source: "studio",
          generationId: gen.id,
        }),
        targetIndex
      )
      setSelectedStudioIds((prev) => prev.filter((id) => id !== gen.id))
      setMsg(`Dropped Try ${gen.retryIndex || "?"} on VIDEO.`)
      return
    }

    if (payload.type === "upload") {
      if (targetTrackId === "music" && !isAdmin) {
        setMsg("Music uploads are admin-only. Pick a NEONSOX licensed bed.")
        return
      }
      const asset = editor.uploads.find((u) => u.id === payload.assetId)
      if (!asset?.url) {
        setMsg("Upload not found.")
        return
      }
      const lane = targetTrackId
      const okVideo = lane === "video" && asset.kind === "video"
      const okAudio =
        lane !== "video" && (asset.kind === "audio" || asset.kind === "video")
      if (!okVideo && !okAudio) {
        setMsg(`That file doesn't fit the ${lane.toUpperCase()} track.`)
        return
      }
      insertClipOnTrack(
        lane,
        makeClipRef({
          url: asset.url,
          label: asset.label,
          source: "upload",
          kind: lane,
        }),
        targetIndex
      )
      setMsg(`Dropped on ${lane.toUpperCase()}.`)
      return
    }

    if (payload.type === "tray") {
      const item = trayItems.find((t) => t.id === payload.trayItemId)
      const url = trayItemPlaybackUrl(item)
      if (!item || !url) {
        setMsg("Tray clip not found.")
        return
      }
      if (targetTrackId !== "video" && targetTrackId !== "sfx") {
        setMsg("Tray ads drop on VIDEO (or SFX).")
        return
      }
      insertClipOnTrack(
        targetTrackId,
        makeClipRef({
          url,
          label: item.companyName || "Tray clip",
          source: "tray",
          kind: targetTrackId,
          trayId: item.id,
        }),
        targetIndex
      )
      setMsg(`Dropped tray clip on ${targetTrackId.toUpperCase()}.`)
    }
  }

  const queuedGenerationIds = useMemo(
    () => editor.videoClips.map((c) => c.generationId).filter(Boolean),
    [editor.videoClips]
  )

  function addVideoFromUpload(asset) {
    const current = loadEditorTray(campaignKey)
    persist({
      ...current,
      videoClips: [
        ...current.videoClips,
        makeClipRef({ url: asset.url, label: asset.label, source: "upload", kind: "video" }),
      ],
    })
  }

  function addLaneFromTray(lane, item) {
    if (lane === "music" && !isAdmin) {
      setMsg("Music is NEONSOX-licensed only. Pick from the NEONSOX library.")
      return
    }
    const url = trayItemPlaybackUrl(item)
    if (!url) return
    const current = loadEditorTray(campaignKey)
    const ref = makeClipRef({
      url,
      label: item.companyName || `${lane} clip`,
      source: "tray",
      kind: lane,
      trayId: item.id,
    })
    if (lane === "video") {
      persist({ ...current, videoClips: [...current.videoClips, ref] })
      return
    }
    if (lane === "music") {
      persist({ ...current, music: { ...ref, kind: "music" } })
      return
    }
    if (lane === "voice") {
      persist({ ...current, voice: { ...ref, kind: "voice" } })
      return
    }
    const key = lane === "sfx" ? "sfxClips" : lane === "foley" ? "foleyClips" : "adrClips"
    persist({ ...current, [key]: [...(current[key] || []), ref] })
  }

  function addLaneFromUpload(lane, asset) {
    if (lane === "music" && !isAdmin) {
      setMsg("Music uploads are admin-only. Pick a NEONSOX licensed bed.")
      return
    }
    const current = loadEditorTray(campaignKey)
    const ref = makeClipRef({ url: asset.url, label: asset.label, source: "upload", kind: lane })
    if (lane === "video") {
      persist({ ...current, videoClips: [...current.videoClips, ref] })
      return
    }
    if (lane === "music") {
      persist({ ...current, music: { ...ref, kind: "music" } })
      return
    }
    if (lane === "voice") {
      persist({ ...current, voice: { ...ref, kind: "voice" } })
      return
    }
    const key = lane === "sfx" ? "sfxClips" : lane === "foley" ? "foleyClips" : "adrClips"
    persist({ ...current, [key]: [...(current[key] || []), ref] })
  }

  function moveClip(index, dir) {
    const next = [...editor.videoClips]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    persist({ ...editor, videoClips: next })
  }

  function removeClip(index) {
    persist({ ...editor, videoClips: editor.videoClips.filter((_, i) => i !== index) })
  }

  function trackList(trackId) {
    if (trackId === "video") return editor.videoClips || []
    if (trackId === "music") return editor.music ? [{ ...editor.music, kind: "music" }] : []
    if (trackId === "voice") return editor.voice ? [{ ...editor.voice, kind: "voice" }] : []
    if (trackId === "sfx") return editor.sfxClips || []
    if (trackId === "foley") return editor.foleyClips || []
    if (trackId === "adr") return editor.adrClips || []
    return []
  }

  function writeTrack(trackId, list) {
    const current = loadEditorTray(campaignKey)
    if (trackId === "video") return { ...current, videoClips: list }
    if (trackId === "music") return { ...current, music: list[0] ? { ...list[0], kind: "music" } : null }
    if (trackId === "voice") return { ...current, voice: list[0] ? { ...list[0], kind: "voice" } : null }
    if (trackId === "sfx") return { ...current, sfxClips: list }
    if (trackId === "foley") return { ...current, foleyClips: list }
    if (trackId === "adr") return { ...current, adrClips: list }
    return current
  }

  function reorderTrack(trackId, fromIndex, toIndex) {
    const list = [...trackList(trackId)]
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    const [item] = list.splice(fromIndex, 1)
    const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex
    list.splice(Math.max(0, insertAt), 0, item)
    // Music / voice stay single-slot for stitch engine
    if ((trackId === "music" || trackId === "voice") && list.length > 1) {
      persist(writeTrack(trackId, [list[0]]))
      return
    }
    persist(writeTrack(trackId, list))
  }

  function moveClipAcrossTracks(fromTrack, fromIndex, toTrack, toIndex) {
    const fromList = [...trackList(fromTrack)]
    const clip = fromList[fromIndex]
    if (!clip) return
    fromList.splice(fromIndex, 1)

    const kind =
      toTrack === "video"
        ? "video"
        : toTrack === "music"
          ? "music"
          : toTrack === "voice"
            ? "voice"
            : toTrack
    const moved = { ...clip, kind }

    let toList = [...trackList(toTrack)]
    if (toTrack === "music" || toTrack === "voice") {
      toList = [moved]
    } else {
      toList.splice(Math.min(toIndex, toList.length), 0, moved)
    }

    const base = loadEditorTray(campaignKey)
    const patch = { ...base }
    const apply = (id, list) => {
      if (id === "video") patch.videoClips = list
      else if (id === "music") patch.music = list[0] ? { ...list[0], kind: "music" } : null
      else if (id === "voice") patch.voice = list[0] ? { ...list[0], kind: "voice" } : null
      else if (id === "sfx") patch.sfxClips = list
      else if (id === "foley") patch.foleyClips = list
      else if (id === "adr") patch.adrClips = list
    }
    apply(fromTrack, fromList)
    apply(toTrack, toList)
    persist(patch)
  }

  function removeFromTrack(trackId, index) {
    const list = [...trackList(trackId)]
    list.splice(index, 1)
    persist(writeTrack(trackId, list))
  }

  const timelineTracks = useMemo(
    () => ({
      music: trackList("music"),
      video: trackList("video"),
      voice: trackList("voice"),
      sfx: trackList("sfx"),
      foley: trackList("foley"),
      adr: trackList("adr"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derived from editor snapshot
    [editor]
  )

  async function handleRender() {
    if (!editor.videoClips.length || rendering) return
    setRendering(true)
    setMsg("")
    try {
      const result = await renderEditorProject({
        campaignKey,
        userId: user?.id,
        videoClips: editor.videoClips.map((c) => c.url),
        musicUrl: editor.music?.url || null,
        voiceUrl: editor.voice?.url || null,
        musicVolume: editor.musicVolume,
      })
      const lastRender = {
        url: result.outputUrl,
        cloudUrl: result.cloudOutputUrl || null,
        at: new Date().toISOString(),
        clipCount: result.clipCount,
      }
      persist({ ...editor, lastRender })
      pushActivity(campaignKey, {
        type: "editor",
        message: `Stitched ${result.clipCount || editor.videoClips.length} clip(s) in Editing Bay.`,
      })
      setMsg("Stitched! Preview below — export to Socials Tray when ready.")
    } catch (err) {
      setMsg(err.message || "Render failed")
    } finally {
      setRendering(false)
    }
  }

  function exportToTray() {
    if (!editor.lastRender?.url) return
    const url = editor.lastRender.cloudUrl || editor.lastRender.url
    addToSocialsTray(campaignKey, {
      id: `editor_${Date.now()}`,
      videoUrl: url,
      cloudVideoUrl: editor.lastRender.cloudUrl || null,
      companyName: campaignSetup?.name || "Editor export",
      industry: "Custom edit",
      source: "editor-tray",
    })
    window.dispatchEvent(new CustomEvent("neonsox-socials-tray-updated"))
    pushActivity(campaignKey, { type: "export", message: "Exported edit to Socials Tray." })
    setMsg("Exported to Socials Tray!")
  }

  const videoUploads = editor.uploads.filter((u) => u.kind === "video")
  const audioUploads = editor.uploads.filter((u) => u.kind === "audio")

  return (
    <section
      id="editor-tray"
      style={{
        padding: "6px",
        borderRadius: "10px",
        border: "1px solid rgba(56, 189, 248, 0.35)",
        background: colors.bg,
        textAlign: "left",
        boxShadow: "0 0 16px rgba(56, 189, 248, 0.1)",
        height: "calc(100vh - 148px)",
        maxHeight: "calc(100vh - 148px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <input ref={videoInputRef} type="file" accept="video/*" multiple hidden onChange={handleFileInput} />
      <input ref={musicInputRef} type="file" accept="audio/*,video/*" multiple hidden onChange={handleFileInput} />
      <input ref={voiceInputRef} type="file" accept="audio/*,video/*" multiple hidden onChange={handleFileInput} />
      <input ref={sfxInputRef} type="file" accept="audio/*,video/*" multiple hidden onChange={handleFileInput} />
      <input ref={foleyInputRef} type="file" accept="audio/*,video/*" multiple hidden onChange={handleFileInput} />
      <input ref={adrInputRef} type="file" accept="audio/*,video/*" multiple hidden onChange={handleFileInput} />

      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px", flexShrink: 0 }}>
        <div style={{ ...cutRoomLabelStyle(colors), margin: 0 }}>Cut Room</div>
        <span style={{ fontSize: "0.58rem", color: colors.textFaint }}>
          Drag T-tries / uploads onto timeline Drop lanes
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(200px, 0.55fr) minmax(280px, 1.45fr)",
          gap: "6px",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", minHeight: 0, overflowY: "auto", paddingRight: "2px" }}>
          {/* VIDEO — first, mirrors timeline */}
          <div style={trackPanelStyle(trackById("video"))}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", marginBottom: "2px" }}>
              <span style={trackLabelStyle(trackById("video"))}>VIDEO »»</span>
              <ImportMenu
                label="Video"
                track={trackById("video")}
                colors={colors}
                trayItems={trayItems}
                uploads={videoUploads}
                onPickFile={() => openFilePicker("video")}
                onPickTray={(item) => addLaneFromTray("video", item)}
                onPickUpload={(asset) => addLaneFromUpload("video", asset)}
              />
            </div>
            {editor.videoClips.length > 0 && (
              <ul style={{ margin: "0 0 2px", padding: 0, listStyle: "none", maxHeight: "56px", overflowY: "auto" }}>
                {editor.videoClips.map((clip, idx) => (
                  <li
                    key={clip.id}
                    draggable
                    onDragStart={(e) => {
                      if (e.target?.closest?.("button")) {
                        e.preventDefault()
                        return
                      }
                      setEditorDragPayload(e.dataTransfer, { type: "track", trackId: "video", index: idx })
                    }}
                    title="Drag onto VIDEO lane under the monitor"
                    style={{
                      fontSize: "0.55rem",
                      color: colors.text,
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      background: "rgba(0,0,0,0.35)",
                      border: "1px solid rgba(77, 163, 255, 0.45)",
                      marginBottom: "2px",
                      cursor: "grab",
                      userSelect: "none",
                    }}
                  >
                    <span aria-hidden style={{ color: trackById("video").accent, fontWeight: 900 }}>⠿</span>
                    <span style={{ width: "10px", color: trackById("video").accent, fontWeight: 800 }}>{idx + 1}</span>
                    <span style={{ flex: 1, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", pointerEvents: "none" }}>
                      {clip.label}
                    </span>
                    <button type="button" onClick={() => moveClip(idx, -1)} onMouseDown={(e) => e.stopPropagation()} style={tinyBtn(colors)} aria-label="Move up">↑</button>
                    <button type="button" onClick={() => moveClip(idx, 1)} onMouseDown={(e) => e.stopPropagation()} style={tinyBtn(colors)} aria-label="Move down">↓</button>
                    <button type="button" onClick={() => removeClip(idx)} onMouseDown={(e) => e.stopPropagation()} style={tinyBtn(colors, true)} aria-label="Remove">✕</button>
                  </li>
                ))}
              </ul>
            )}
            <UploadDragChips
              uploads={videoUploads}
              colors={colors}
              onDragStart={(asset, e) =>
                setEditorDragPayload(e.dataTransfer, { type: "upload", assetId: asset.id })
              }
            />
            <StudioClipPicker
              generations={studioGenerations}
              selectedIds={selectedStudioIds}
              onToggle={toggleStudioSelection}
              onToggleAll={toggleAllStudio}
              onAddOne={addStudioClipById}
              alreadyQueuedIds={queuedGenerationIds}
              colors={colors}
            />
            {selectedStudioIds.length > 0 && (
              <button type="button" onClick={addSelectedStudioClips} style={accentBtn(colors, true)}>
                + {selectedStudioIds.length} to VIDEO
              </button>
            )}
          </div>

          {/* MUSIC */}
          <div style={trackPanelStyle(trackById("music"))}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
              <span style={trackLabelStyle(trackById("music"))}>MUSIC »»</span>
              <ImportMenu
                label="Add"
                track={trackById("music")}
                colors={colors}
                trayItems={isAdmin ? trayItems : []}
                uploads={isAdmin ? audioUploads : []}
                onPickFile={() => openFilePicker("music")}
                onPickTray={(item) => addLaneFromTray("music", item)}
                onPickUpload={(asset) => addLaneFromUpload("music", asset)}
                allowUpload={isAdmin}
                allowTray={isAdmin}
                libraryTracks={musicLibraryTracks}
                onPickLibrary={addMusicFromLibrary}
                libraryTitle="NEONSOX music library"
              />
            </div>
            {editor.music ? (
              <div
                draggable
                onDragStart={(e) =>
                  setEditorDragPayload(e.dataTransfer, { type: "track", trackId: "music", index: 0 })
                }
                title="Drag onto MUSIC timeline"
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.55rem", fontWeight: 700, cursor: "grab" }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{editor.music.label}</span>
                <button type="button" onClick={() => persist({ ...editor, music: null })} onMouseDown={(e) => e.stopPropagation()} style={tinyBtn(colors, true)}>✕</button>
              </div>
            ) : null}
            <UploadDragChips
              uploads={isAdmin ? audioUploads : []}
              colors={colors}
              onDragStart={(asset, e) =>
                setEditorDragPayload(e.dataTransfer, { type: "upload", assetId: asset.id })
              }
            />
            <label style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px", fontSize: "0.52rem", fontWeight: 700, color: colors.textMuted }}>
              {editor.musicVolume}%
              <input
                type="range"
                min={5}
                max={100}
                value={editor.musicVolume}
                onChange={(e) => persist({ ...editor, musicVolume: Number(e.target.value) })}
                style={{ flex: 1, accentColor: trackById("music").accent, height: "12px" }}
              />
            </label>
            {!isAdmin && (
              <p style={{ margin: "2px 0 0", fontSize: "0.48rem", color: colors.textFaint }}>
                Licensed NEONSOX beds only · custom bed? Email ceo@neonsox.com
              </p>
            )}
          </div>

          {/* VOICE */}
          <div style={trackPanelStyle(trackById("voice"))}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
              <span style={trackLabelStyle(trackById("voice"))}>VOICE »»</span>
              <ImportMenu
                label="Add"
                track={trackById("voice")}
                colors={colors}
                trayItems={trayItems}
                uploads={audioUploads}
                onPickFile={() => openFilePicker("voice")}
                onPickTray={(item) => addLaneFromTray("voice", item)}
                onPickUpload={(asset) => addLaneFromUpload("voice", asset)}
              />
            </div>
            {editor.voice ? (
              <div
                draggable
                onDragStart={(e) =>
                  setEditorDragPayload(e.dataTransfer, { type: "track", trackId: "voice", index: 0 })
                }
                title="Drag onto VOICE timeline"
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.55rem", fontWeight: 700, cursor: "grab" }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{editor.voice.label}</span>
                <button type="button" onClick={() => persist({ ...editor, voice: null })} onMouseDown={(e) => e.stopPropagation()} style={tinyBtn(colors, true)}>✕</button>
              </div>
            ) : null}
            <UploadDragChips
              uploads={audioUploads}
              colors={colors}
              onDragStart={(asset, e) =>
                setEditorDragPayload(e.dataTransfer, { type: "upload", assetId: asset.id })
              }
            />
          </div>

          {/* SFX */}
          <div style={trackPanelStyle(trackById("sfx"))}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
              <span style={trackLabelStyle(trackById("sfx"))}>SFX »»</span>
              <ImportMenu
                label="Add"
                track={trackById("sfx")}
                colors={colors}
                trayItems={trayItems}
                uploads={[...audioUploads, ...videoUploads]}
                onPickFile={() => openFilePicker("sfx")}
                onPickTray={(item) => addLaneFromTray("sfx", item)}
                onPickUpload={(asset) => addLaneFromUpload("sfx", asset)}
              />
            </div>
            {(editor.sfxClips || []).map((clip, idx) => (
              <div
                key={clip.id}
                draggable
                onDragStart={(e) =>
                  setEditorDragPayload(e.dataTransfer, { type: "track", trackId: "sfx", index: idx })
                }
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.52rem", fontWeight: 700, cursor: "grab" }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.label}</span>
                <button type="button" onClick={() => removeFromTrack("sfx", idx)} onMouseDown={(e) => e.stopPropagation()} style={tinyBtn(colors, true)}>✕</button>
              </div>
            ))}
            <UploadDragChips
              uploads={[...audioUploads, ...videoUploads]}
              colors={colors}
              onDragStart={(asset, e) =>
                setEditorDragPayload(e.dataTransfer, { type: "upload", assetId: asset.id })
              }
            />
          </div>

          {/* FOLEY */}
          <div style={trackPanelStyle(trackById("foley"))}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
              <span style={trackLabelStyle(trackById("foley"))}>FOLEY »»</span>
              <ImportMenu
                label="Add"
                track={trackById("foley")}
                colors={colors}
                trayItems={trayItems}
                uploads={audioUploads}
                onPickFile={() => openFilePicker("foley")}
                onPickTray={(item) => addLaneFromTray("foley", item)}
                onPickUpload={(asset) => addLaneFromUpload("foley", asset)}
              />
            </div>
            {(editor.foleyClips || []).map((clip, idx) => (
              <div
                key={clip.id}
                draggable
                onDragStart={(e) =>
                  setEditorDragPayload(e.dataTransfer, { type: "track", trackId: "foley", index: idx })
                }
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.52rem", fontWeight: 700, cursor: "grab" }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.label}</span>
                <button type="button" onClick={() => removeFromTrack("foley", idx)} onMouseDown={(e) => e.stopPropagation()} style={tinyBtn(colors, true)}>✕</button>
              </div>
            ))}
            <UploadDragChips
              uploads={audioUploads}
              colors={colors}
              onDragStart={(asset, e) =>
                setEditorDragPayload(e.dataTransfer, { type: "upload", assetId: asset.id })
              }
            />
          </div>

          {/* ADR */}
          <div style={trackPanelStyle(trackById("adr"))}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
              <span style={trackLabelStyle(trackById("adr"))}>ADR »»</span>
              <ImportMenu
                label="Add"
                track={trackById("adr")}
                colors={colors}
                trayItems={trayItems}
                uploads={audioUploads}
                onPickFile={() => openFilePicker("adr")}
                onPickTray={(item) => addLaneFromTray("adr", item)}
                onPickUpload={(asset) => addLaneFromUpload("adr", asset)}
              />
            </div>
            {(editor.adrClips || []).map((clip, idx) => (
              <div
                key={clip.id}
                draggable
                onDragStart={(e) =>
                  setEditorDragPayload(e.dataTransfer, { type: "track", trackId: "adr", index: idx })
                }
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.52rem", fontWeight: 700, cursor: "grab" }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.label}</span>
                <button type="button" onClick={() => removeFromTrack("adr", idx)} onMouseDown={(e) => e.stopPropagation()} style={tinyBtn(colors, true)}>✕</button>
              </div>
            ))}
            <UploadDragChips
              uploads={audioUploads}
              colors={colors}
              onDragStart={(asset, e) =>
                setEditorDragPayload(e.dataTransfer, { type: "upload", assetId: asset.id })
              }
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "auto", paddingTop: "2px" }}>
            <NeonButton size="sm" onClick={handleRender} disabled={!editor.videoClips.length || rendering || uploading}>
              {rendering ? "Stitching…" : "Stitch"}
            </NeonButton>
            <NeonButton size="sm" variant="secondary" onClick={exportToTray} disabled={!editor.lastRender?.url}>
              Export
            </NeonButton>
          </div>
          {(msg || uploading) && (
            <p style={{ margin: 0, fontSize: "0.58rem", color: colors.accent, fontWeight: 700, textShadow: `0 0 6px ${colors.glow}` }}>
              {uploading ? "Uploading…" : msg}
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minHeight: 0, overflow: "hidden" }}>
          <div
            style={{
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid rgba(56, 189, 248, 0.5)",
              background: colors.surfaceAlt,
              boxShadow: "0 0 14px rgba(56, 189, 248, 0.2)",
              flex: "0 0 auto",
            }}
          >
            <div style={{ ...neonTitleStyle(colors), padding: "3px 6px 0", margin: 0 }}>Preview</div>
            <div style={{ width: "100%", height: "min(28vh, 200px)", maxHeight: "200px" }}>
              {previewUrl ? (
                <video
                  key={previewUrl}
                  src={previewUrl}
                  controls
                  style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", background: "#000" }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.textFaint,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  Add clips → Stitch → preview here
                </div>
              )}
            </div>
            <div style={{ padding: "2px 6px", fontSize: "0.55rem", fontWeight: 700, color: colors.textMuted }}>
              {editor.lastRender
                ? `${editor.lastRender.clipCount} clip(s) rendered`
                : editor.videoClips.length
                  ? `${editor.videoClips.length} queued`
                  : "Empty"}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <EditingBayTimeline
              tracks={timelineTracks}
              onReorder={reorderTrack}
              onMoveClip={moveClipAcrossTracks}
              onRemoveClip={removeFromTrack}
              onAddFromDrag={addFromDrag}
              colors={colors}
              compact
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function accentBtn(colors, block = false) {
  return {
    display: block ? "block" : "inline-block",
    width: block ? "100%" : undefined,
    marginBottom: block ? "3px" : undefined,
    padding: "3px 6px",
    borderRadius: "5px",
    border: `1px solid ${colors.accent}`,
    background: colors.accentSoft,
    color: colors.accent,
    fontSize: "0.58rem",
    fontWeight: 800,
    cursor: "pointer",
    textShadow: `0 0 6px ${colors.glow}`,
  }
}

function tinyBtn(colors, danger = false) {
  return {
    padding: "0 3px",
    borderRadius: "3px",
    border: `1px solid ${danger ? "rgba(255,107,107,0.5)" : colors.border}`,
    background: colors.bg,
    color: danger ? "#ff8a8a" : colors.textMuted,
    fontSize: "0.55rem",
    cursor: "pointer",
    lineHeight: 1.2,
  }
}

/** Compact upload chips you can drag onto matching timeline lanes. */
function UploadDragChips({ uploads = [], colors, onDragStart }) {
  if (!uploads.length) return null
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", marginTop: "2px" }}>
      {uploads.slice(0, 6).map((asset) => (
        <span
          key={asset.id}
          draggable
          onDragStart={(e) => onDragStart?.(asset, e)}
          title={`Drag “${asset.label}” onto a matching track`}
          style={{
            maxWidth: "72px",
            padding: "1px 4px",
            borderRadius: "4px",
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            color: colors.textMuted,
            fontSize: "0.48rem",
            fontWeight: 700,
            cursor: "grab",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {asset.label}
        </span>
      ))}
    </div>
  )
}
