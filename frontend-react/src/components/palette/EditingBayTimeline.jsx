import { useState } from "react"

/** Track order: VIDEO first, then audio lanes — Cut Room mirrors this. */
export const TIMELINE_TRACKS = [
  {
    id: "video",
    label: "VIDEO",
    accent: "#4da3ff",
    fill: "rgba(77, 163, 255, 0.2)",
    border: "rgba(77, 163, 255, 0.75)",
    accepts: ["video"],
    pattern: "film",
  },
  {
    id: "music",
    label: "MUSIC",
    accent: "#ff6bb5",
    fill: "rgba(255, 107, 181, 0.22)",
    border: "rgba(255, 107, 181, 0.7)",
    accepts: ["music", "audio"],
    pattern: "beads",
  },
  {
    id: "voice",
    label: "VOICE",
    accent: "#ffc14d",
    fill: "rgba(255, 193, 77, 0.22)",
    border: "rgba(255, 193, 77, 0.75)",
    accepts: ["voice", "audio", "adr"],
    pattern: "blocks",
  },
  {
    id: "sfx",
    label: "SFX",
    accent: "#a78bfa",
    fill: "rgba(167, 139, 250, 0.18)",
    border: "rgba(167, 139, 250, 0.55)",
    accepts: ["sfx", "video", "audio"],
    pattern: "blocks",
  },
  {
    id: "foley",
    label: "FOLEY",
    accent: "#34d399",
    fill: "rgba(52, 211, 153, 0.18)",
    border: "rgba(52, 211, 153, 0.55)",
    accepts: ["foley", "audio"],
    pattern: "blocks",
  },
  {
    id: "adr",
    label: "ADR",
    accent: "#fb923c",
    fill: "rgba(251, 146, 60, 0.18)",
    border: "rgba(251, 146, 60, 0.55)",
    accepts: ["adr", "voice", "audio"],
    pattern: "blocks",
  },
]

export const EDITOR_DND_MIME = "application/x-neonsox-editor"

export function trackById(id) {
  return TIMELINE_TRACKS.find((t) => t.id === id) || TIMELINE_TRACKS[0]
}

/** Write a structured drag payload (JSON + text fallback). */
export function setEditorDragPayload(dataTransfer, payload) {
  const json = JSON.stringify(payload)
  try {
    dataTransfer.setData(EDITOR_DND_MIME, json)
  } catch {
    /* some browsers reject custom types */
  }
  dataTransfer.setData("text/plain", json)
  // Must include whatever dropEffect the timeline uses, or the browser cancels the drop.
  dataTransfer.effectAllowed = "copyMove"
}

export function readEditorDragPayload(dataTransfer) {
  const raw =
    (typeof dataTransfer.getData === "function" &&
      (dataTransfer.getData(EDITOR_DND_MIME) || dataTransfer.getData("text/plain"))) ||
    ""
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && parsed.type) return parsed
  } catch {
    /* legacy "trackId:index" */
  }
  const [trackId, idxRaw] = raw.split(":")
  const index = Number(idxRaw)
  if (trackId && !Number.isNaN(index)) return { type: "track", trackId, index }
  return null
}

function clipKind(clip) {
  return String(clip?.kind || "video").toLowerCase()
}

function canDropOnTrack(track, clip) {
  if (!clip) return false
  return track.accepts.includes(clipKind(clip))
}

function Filmstrip({ accent }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        height: "100%",
        alignItems: "stretch",
        padding: "3px 2px",
      }}
      aria-hidden
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            border: `1px solid ${accent}`,
            borderRadius: "2px",
            background: "rgba(0,0,0,0.25)",
            position: "relative",
          }}
        >
          <span style={perf(accent, "top")} />
          <span style={perf(accent, "bottom")} />
        </div>
      ))}
    </div>
  )
}

function perf(accent, edge) {
  return {
    position: "absolute",
    [edge]: "2px",
    left: "2px",
    right: "2px",
    height: "3px",
    background: `repeating-linear-gradient(90deg, ${accent} 0 3px, transparent 3px 6px)`,
    opacity: 0.7,
  }
}

function Beads({ accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%", gap: "6px", padding: "0 6px" }} aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px", flex: 1 }}>
          <span style={{ width: "1px", height: "70%", background: accent, opacity: 0.6 }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", border: `2px solid ${accent}`, background: "transparent" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", border: `2px solid ${accent}`, background: "transparent" }} />
          <span style={{ flex: 1, height: "1px", background: accent, opacity: 0.5 }} />
        </div>
      ))}
    </div>
  )
}

function BlockWave({ accent }) {
  const widths = [18, 28, 14, 34, 22, 16, 30, 20]
  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%", gap: "3px", padding: "0 4px" }} aria-hidden>
      {widths.map((w, i) => (
        <span
          key={i}
          style={{
            width: `${w}%`,
            maxWidth: "40px",
            height: "55%",
            borderRadius: "3px",
            background: accent,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  )
}

function Pattern({ type, accent }) {
  if (type === "film") return <Filmstrip accent={accent} />
  if (type === "beads") return <Beads accent={accent} />
  return <BlockWave accent={accent} />
}

/**
 * Multi-track Editing Bay timeline — drag clips to reorder / move between compatible tracks.
 * Also accepts Cut Room sources: studio tries, uploads, tray items.
 */
export default function EditingBayTimeline({
  tracks,
  onReorder,
  onMoveClip,
  onRemoveClip,
  onAddFromDrag,
  colors,
  compact = false,
}) {
  const [drag, setDrag] = useState(null) // { trackId, index } | { external: true }
  const [over, setOver] = useState(null) // { trackId, index }

  function startDrag(trackId, index, e) {
    setDrag({ trackId, index })
    setEditorDragPayload(e.dataTransfer, { type: "track", trackId, index })
  }

  function allowDrop(trackId, index, e) {
    e.preventDefault()
    e.stopPropagation()
    // Match effectAllowed ("copyMove") so Cut Room → Timeline drops are accepted.
    e.dataTransfer.dropEffect = drag?.trackId ? "move" : "copy"
    setOver({ trackId, index })
  }

  function clearOver(e) {
    // Only clear when leaving the lane itself, not when entering a child chip
    if (e?.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return
    setOver(null)
  }

  function handleDrop(targetTrackId, targetIndex, e) {
    e.preventDefault()
    e.stopPropagation()
    const payload = readEditorDragPayload(e.dataTransfer)
    setDrag(null)
    setOver(null)
    if (!payload) return

    if (payload.type === "studio" || payload.type === "upload" || payload.type === "tray") {
      onAddFromDrag?.(payload, targetTrackId, targetIndex)
      return
    }

    if (payload.type !== "track") return
    const { trackId: fromTrack, index: fromIndex } = payload
    if (fromTrack == null || Number.isNaN(Number(fromIndex))) return

    const fromList = tracks[fromTrack] || []
    const clip = fromList[fromIndex]
    const targetSpec = TIMELINE_TRACKS.find((t) => t.id === targetTrackId)
    if (!clip || !targetSpec || !canDropOnTrack(targetSpec, clip)) return

    if (fromTrack === targetTrackId) {
      onReorder(targetTrackId, fromIndex, targetIndex)
    } else {
      onMoveClip(fromTrack, fromIndex, targetTrackId, targetIndex)
    }
  }

  return (
    <div
      style={{
        marginTop: compact ? "0" : "8px",
        padding: compact ? "4px 6px" : "8px",
        borderRadius: "8px",
        border: "1px solid rgba(255, 214, 64, 0.35)",
        background: "rgba(0,0,0,0.35)",
        boxShadow: "0 0 12px rgba(255, 214, 64, 0.1)",
      }}
    >
      <div
        style={{
          fontSize: compact ? "0.58rem" : "0.65rem",
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#ffd640",
          marginBottom: compact ? "3px" : "6px",
          textShadow: "0 0 10px rgba(255, 214, 64, 0.85), 0 0 22px rgba(255, 200, 0, 0.45)",
        }}
      >
        Timeline
        <span style={{ marginLeft: "8px", fontWeight: 600, letterSpacing: "0.02em", color: colors.textFaint, textTransform: "none", fontSize: "0.52rem" }}>
          Drag studio tries / clips here
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: compact ? "2px" : "5px" }}>
        {TIMELINE_TRACKS.map((spec) => {
          const items = tracks[spec.id] || []
          const laneHot = over?.trackId === spec.id
          return (
            <div
              key={spec.id}
              style={{ display: "grid", gridTemplateColumns: compact ? "52px 1fr" : "72px 1fr", gap: "4px", alignItems: "center" }}
            >
              <div
                style={{
                  fontSize: compact ? "0.52rem" : "0.62rem",
                  fontWeight: 900,
                  letterSpacing: "0.03em",
                  color: spec.accent,
                  textShadow: `0 0 6px ${spec.accent}`,
                  whiteSpace: "nowrap",
                }}
              >
                {spec.label}{compact ? "»" : ">>>>>>"}
              </div>

              <div
                onDragOver={(e) => allowDrop(spec.id, items.length, e)}
                onDragLeave={clearOver}
                onDrop={(e) => handleDrop(spec.id, items.length, e)}
                style={{
                  minHeight: compact ? "26px" : "36px",
                  borderRadius: "5px",
                  border: `1px solid ${laneHot ? spec.accent : spec.border}`,
                  background: laneHot ? `${spec.fill}` : spec.fill,
                  boxShadow: laneHot ? `0 0 12px ${spec.accent}66` : "none",
                  display: "flex",
                  alignItems: "stretch",
                  gap: "3px",
                  padding: "2px",
                  overflowX: "auto",
                  transition: "box-shadow 0.12s, border-color 0.12s",
                }}
              >
                {items.length === 0 ? (
                  <div style={{ flex: 1, position: "relative", minHeight: compact ? "22px" : "30px", pointerEvents: "none" }}>
                    {!compact && <Pattern type={spec.pattern} accent={spec.accent} />}
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.5rem",
                        fontWeight: 700,
                        color: laneHot ? spec.accent : colors.textFaint,
                      }}
                    >
                      {laneHot ? "Release to drop" : "Drop"}
                    </span>
                  </div>
                ) : (
                  items.map((clip, index) => {
                    const isDragging = drag?.trackId === spec.id && drag?.index === index
                    const isOver = over?.trackId === spec.id && over?.index === index
                    return (
                      <div
                        key={clip.id}
                        draggable
                        onDragStart={(e) => startDrag(spec.id, index, e)}
                        onDragEnd={() => {
                          setDrag(null)
                          setOver(null)
                        }}
                        onDragOver={(e) => allowDrop(spec.id, index, e)}
                        onDrop={(e) => handleDrop(spec.id, index, e)}
                        title={`${clip.label} — drag to reorder or move tracks`}
                        style={{
                          flex: "0 0 auto",
                          minWidth: compact ? "64px" : "88px",
                          maxWidth: compact ? "100px" : "140px",
                          height: compact ? "22px" : "30px",
                          borderRadius: "4px",
                          border: `1px solid ${spec.accent}`,
                          background: "rgba(0,0,0,0.45)",
                          cursor: "grab",
                          opacity: isDragging ? 0.45 : 1,
                          outline: isOver ? `2px solid #ffd640` : "none",
                          position: "relative",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          padding: "0 4px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.5rem",
                            fontWeight: 800,
                            color: "#fff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            flex: 1,
                            pointerEvents: "none",
                          }}
                        >
                          {clip.label}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveClip(spec.id, index)
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          aria-label={`Remove ${clip.label}`}
                          style={{
                            width: "12px",
                            height: "12px",
                            padding: 0,
                            border: "none",
                            borderRadius: "2px",
                            background: "transparent",
                            color: "#ff8a8a",
                            fontSize: "0.55rem",
                            cursor: "pointer",
                            lineHeight: "12px",
                            flexShrink: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
