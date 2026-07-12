/** ffmpeg drawtext style maps (mirrors frontend overlayPresets.js). */

export const DEFAULT_CLIP_SECONDS = 10
export const OVERLAY_FLASH_START = 0.35

const FLASH_FOR_SECONDS = [2, 4, 6]

export function normalizeFlashSeconds(style = {}) {
  const raw = style.flashSeconds ?? style.flashAt
  const n = Number(raw)
  return FLASH_FOR_SECONDS.includes(n) ? n : 4
}

export function resolveFlashTiming(style = {}, clipDurationSeconds = DEFAULT_CLIP_SECONDS) {
  const flashDuration = normalizeFlashSeconds(style)
  const flashStart = OVERLAY_FLASH_START
  const flashEnd = flashStart + flashDuration
  const onScreenSeconds = flashDuration
  const sweepSeconds = Math.min(1.1, onScreenSeconds * 0.55)
  return { flashStart, flashEnd, onScreenSeconds, sweepSeconds, flashDuration }
}

const COLORS = {
  yellow: "0xFFEB3B",
  white: "white",
  cyan: "0x00E5FF",
  orange: "0xFF9800",
  red: "0xFF5252",
  pink: "0xFF4081",
  lime: "0xC6FF00",
  blue: "0x448AFF",
  purple: "0xB388FF",
  gold: "0xFFD700",
  coral: "0xFF6E40",
  mint: "0x69F0AE",
  neon: "0x39FF14",
}

const SIZES = { s: 40, m: 54, l: 68 }

const POSITIONS = {
  bottom: "h*0.78",
  middle: "h*0.45",
  top: "h*0.15",
}

const PULSE_HZ = { off: 0, slow: 1.0, fast: 2.0 }

export function resolveOverlayStyle(style = {}) {
  return {
    fontcolor: COLORS[style.color] || COLORS.yellow,
    fontsize: SIZES[style.size] || SIZES.m,
    y: POSITIONS[style.position] || POSITIONS.bottom,
    pulseHz: PULSE_HZ[style.pulse] ?? PULSE_HZ.slow,
    fontStyle: style.fontStyle || "bebas-neue",
  }
}
