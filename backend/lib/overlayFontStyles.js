import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const FONTS_DIR = path.join(__dirname, "..", "assets", "fonts")

/** 20 bundled Google Font styles — not system/basic fonts. */
export const OVERLAY_FONT_STYLES = [
  { id: "bebas-neue", label: "Poster Tall", file: "BebasNeue-Regular.ttf" },
  { id: "oswald", label: "Condensed", file: "Oswald-Bold.ttf" },
  { id: "anton", label: "Heavy Block", file: "Anton-Regular.ttf" },
  { id: "pacifico", label: "Surf Script", file: "Pacifico-Regular.ttf" },
  { id: "righteous", label: "Retro Wave", file: "Righteous-Regular.ttf" },
  { id: "bangers", label: "Comic Hero", file: "Bangers-Regular.ttf" },
  { id: "lobster", label: "Bold Script", file: "Lobster-Regular.ttf" },
  { id: "orbitron", label: "Sci-Fi", file: "Orbitron-Bold.ttf", shadowx: 3, shadowy: 3, shadowcolor: "0x004466" },
  { id: "comfortaa", label: "Soft Round", file: "Comfortaa-Bold.ttf" },
  { id: "fredoka", label: "Bubble", file: "Fredoka-Bold.ttf" },
  { id: "abril-fatface", label: "Editorial", file: "AbrilFatface-Regular.ttf" },
  { id: "cinzel", label: "Luxury", file: "Cinzel-Bold.ttf" },
  { id: "russo-one", label: "Industrial", file: "RussoOne-Regular.ttf" },
  { id: "staatliches", label: "Berlin Poster", file: "Staatliches-Regular.ttf" },
  { id: "monoton", label: "Neon Strip", file: "Monoton-Regular.ttf" },
  { id: "bungee", label: "Urban", file: "Bungee-Regular.ttf" },
  { id: "shrikhand", label: "Spice Pop", file: "Shrikhand-Regular.ttf" },
  { id: "alfa-slab", label: "Slab Punch", file: "AlfaSlabOne-Regular.ttf" },
  { id: "caveat", label: "Handwritten", file: "Caveat-Bold.ttf" },
  { id: "black-ops", label: "Tactical", file: "BlackOpsOne-Regular.ttf" },
]

export function resolveFontFile(styleId) {
  const style = OVERLAY_FONT_STYLES.find((s) => s.id === styleId) || OVERLAY_FONT_STYLES[0]
  const fullPath = path.join(FONTS_DIR, style.file)
  if (fs.existsSync(fullPath)) return { style, path: fullPath }
  for (const fallback of OVERLAY_FONT_STYLES) {
    const p = path.join(FONTS_DIR, fallback.file)
    if (fs.existsSync(p)) return { style: fallback, path: p }
  }
  return { style, path: null }
}

export function resolveFontStyle(styleId) {
  const { style } = resolveFontFile(styleId)
  return {
    shadowx: style.shadowx ?? 0,
    shadowy: style.shadowy ?? 0,
    shadowcolor: style.shadowcolor ?? "black",
    borderw: style.borderw ?? 5,
    bordercolor: style.bordercolor ?? "black",
  }
}

export function bundledFontsStatus() {
  const missing = OVERLAY_FONT_STYLES.filter((s) => !fs.existsSync(path.join(FONTS_DIR, s.file)))
  return {
    fontsDir: FONTS_DIR,
    total: OVERLAY_FONT_STYLES.length,
    installed: OVERLAY_FONT_STYLES.length - missing.length,
    missing: missing.map((m) => m.file),
  }
}
