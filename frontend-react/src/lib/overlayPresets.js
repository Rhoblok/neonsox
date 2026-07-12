import { getFontStyle } from "./overlayFontStyles"

export const DEFAULT_CLIP_SECONDS = 10
export const OVERLAY_FLASH_START = 0.35

export const OVERLAY_COLORS = [
  { id: "yellow", label: "Yellow", hex: "#FFEB3B", ffmpeg: "0xFFEB3B" },
  { id: "white", label: "White", hex: "#FFFFFF", ffmpeg: "white" },
  { id: "cyan", label: "Cyan", hex: "#00E5FF", ffmpeg: "0x00E5FF" },
  { id: "orange", label: "Orange", hex: "#FF9800", ffmpeg: "0xFF9800" },
  { id: "red", label: "Red", hex: "#FF5252", ffmpeg: "0xFF5252" },
  { id: "pink", label: "Pink", hex: "#FF4081", ffmpeg: "0xFF4081" },
  { id: "lime", label: "Lime", hex: "#C6FF00", ffmpeg: "0xC6FF00" },
  { id: "blue", label: "Blue", hex: "#448AFF", ffmpeg: "0x448AFF" },
  { id: "purple", label: "Purple", hex: "#B388FF", ffmpeg: "0xB388FF" },
  { id: "gold", label: "Gold", hex: "#FFD700", ffmpeg: "0xFFD700" },
  { id: "coral", label: "Coral", hex: "#FF6E40", ffmpeg: "0xFF6E40" },
  { id: "mint", label: "Mint", hex: "#69F0AE", ffmpeg: "0x69F0AE" },
  { id: "neon", label: "Neon Green", hex: "#39FF14", ffmpeg: "0x39FF14" },
]

export const OVERLAY_SIZES = [
  { id: "s", label: "S", fontSize: 40, previewRem: "1.05rem" },
  { id: "m", label: "M", fontSize: 54, previewRem: "1.35rem" },
  { id: "l", label: "L", fontSize: 68, previewRem: "1.65rem" },
]

export const OVERLAY_POSITIONS = [
  { id: "bottom", label: "Bottom", yExpr: "h*0.78" },
  { id: "middle", label: "Middle", yExpr: "h*0.45" },
  { id: "top", label: "Top", yExpr: "h*0.15" },
]

export const OVERLAY_PULSE = [
  { id: "off", label: "Off", hz: 0 },
  { id: "slow", label: "Slow", hz: 1.0 },
  { id: "fast", label: "Fast", hz: 2.0 },
]

/** How long the company name stays on screen (not when it starts). */
export const OVERLAY_FLASH_FOR = [
  { id: 2, label: "2 sec" },
  { id: 4, label: "4 sec" },
  { id: 6, label: "6 sec" },
]

export function normalizeFlashSeconds(style = {}) {
  const raw = style.flashSeconds ?? style.flashAt
  const n = Number(raw)
  return OVERLAY_FLASH_FOR.some((f) => f.id === n) ? n : 4
}

export function resolveFlashTiming(style = {}, clipDurationSeconds = DEFAULT_CLIP_SECONDS) {
  const flashDuration = normalizeFlashSeconds(style)
  const flashStart = OVERLAY_FLASH_START
  const flashEnd = flashStart + flashDuration
  const onScreenSeconds = flashDuration
  const sweepSeconds = Math.min(1.1, onScreenSeconds * 0.55)
  return { flashStart, flashEnd, onScreenSeconds, sweepSeconds, flashDuration }
}

export function resolveOverlayStyle(style = {}) {
  const color = OVERLAY_COLORS.find((c) => c.id === style.color) || OVERLAY_COLORS[0]
  const size = OVERLAY_SIZES.find((s) => s.id === style.size) || OVERLAY_SIZES[1]
  const position = OVERLAY_POSITIONS.find((p) => p.id === style.position) || OVERLAY_POSITIONS[0]
  const pulse = OVERLAY_PULSE.find((p) => p.id === style.pulse) || OVERLAY_PULSE[1]
  const fontStyle = getFontStyle(style.fontStyle)
  return { color, size, position, pulse, fontStyle }
}

export const DEFAULT_OVERLAY_STYLE = {
  color: "yellow",
  size: "m",
  position: "bottom",
  pulse: "slow",
  fontStyle: "bebas-neue",
  flashAt: 4,
}
