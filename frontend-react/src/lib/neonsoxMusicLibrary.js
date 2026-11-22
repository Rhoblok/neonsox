/**
 * NEONSOX-licensed music beds for Editing Bay.
 * Subscribers pick only from this catalog (licensing).
 * Admins may still upload custom files.
 *
 * `url` is filled when bed audio is published to storage / CDN.
 * Picks without a url still reserve the lane (label + license metadata).
 */
export const NEONSOX_MUSIC_LIBRARY = [
  { id: "nsx_upbeat", label: "NEONSOX · Upbeat Pulse", mood: "upbeat", license: "NEONSOX exclusive", url: null },
  { id: "nsx_calm", label: "NEONSOX · Calm Wave", mood: "calm", license: "NEONSOX exclusive", url: null },
  { id: "nsx_bold", label: "NEONSOX · Bold Hit", mood: "bold", license: "NEONSOX exclusive", url: null },
  { id: "nsx_corporate", label: "NEONSOX · Corporate Clean", mood: "corporate", license: "NEONSOX exclusive", url: null },
  { id: "nsx_inspire", label: "NEONSOX · Inspirational Rise", mood: "inspirational", license: "NEONSOX exclusive", url: null },
  { id: "nsx_playful", label: "NEONSOX · Playful Bounce", mood: "playful", license: "NEONSOX exclusive", url: null },
  { id: "nsx_cinematic", label: "NEONSOX · Cinematic Drift", mood: "cinematic", license: "NEONSOX exclusive", url: null },
  { id: "nsx_minimal", label: "NEONSOX · Minimal Grid", mood: "minimal", license: "NEONSOX exclusive", url: null },
  { id: "nsx_funky", label: "NEONSOX · Funky Step", mood: "funky", license: "NEONSOX exclusive", url: null },
  { id: "nsx_elegant", label: "NEONSOX · Elegant Glow", mood: "elegant", license: "NEONSOX exclusive", url: null },
  { id: "nsx_urgent", label: "NEONSOX · Urgent Tick", mood: "urgent", license: "NEONSOX exclusive", url: null },
  { id: "nsx_hopeful", label: "NEONSOX · Hopeful Dawn", mood: "hopeful", license: "NEONSOX exclusive", url: null },
  { id: "nsx_techy", label: "NEONSOX · Tech Pulse", mood: "techy", license: "NEONSOX exclusive", url: null },
  { id: "nsx_acoustic", label: "NEONSOX · Acoustic Warm", mood: "acoustic", license: "NEONSOX exclusive", url: null },
  { id: "nsx_dramatic", label: "NEONSOX · Dramatic Arc", mood: "dramatic", license: "NEONSOX exclusive", url: null },
]

export function getNeonsoxMusicTrack(id) {
  return NEONSOX_MUSIC_LIBRARY.find((t) => t.id === id) || null
}
