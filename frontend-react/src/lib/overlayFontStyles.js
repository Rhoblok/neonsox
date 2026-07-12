/** 20 overlay font styles — preview uses matching Google Fonts in index.html. */

export const OVERLAY_FONT_STYLES = [
  { id: "bebas-neue", label: "Poster Tall", previewFamily: '"Bebas Neue", sans-serif' },
  { id: "oswald", label: "Condensed", previewFamily: '"Oswald", sans-serif', previewWeight: 700 },
  { id: "anton", label: "Heavy Block", previewFamily: '"Anton", sans-serif' },
  { id: "pacifico", label: "Surf Script", previewFamily: '"Pacifico", cursive' },
  { id: "righteous", label: "Retro Wave", previewFamily: '"Righteous", cursive' },
  { id: "bangers", label: "Comic Hero", previewFamily: '"Bangers", cursive' },
  { id: "lobster", label: "Bold Script", previewFamily: '"Lobster", cursive' },
  { id: "orbitron", label: "Sci-Fi", previewFamily: '"Orbitron", sans-serif', previewWeight: 700 },
  { id: "comfortaa", label: "Soft Round", previewFamily: '"Comfortaa", sans-serif', previewWeight: 700 },
  { id: "fredoka", label: "Bubble", previewFamily: '"Fredoka", sans-serif', previewWeight: 700 },
  { id: "abril-fatface", label: "Editorial", previewFamily: '"Abril Fatface", serif' },
  { id: "cinzel", label: "Luxury", previewFamily: '"Cinzel", serif', previewWeight: 700 },
  { id: "russo-one", label: "Industrial", previewFamily: '"Russo One", sans-serif' },
  { id: "staatliches", label: "Berlin Poster", previewFamily: '"Staatliches", sans-serif' },
  { id: "monoton", label: "Neon Strip", previewFamily: '"Monoton", cursive' },
  { id: "bungee", label: "Urban", previewFamily: '"Bungee", cursive' },
  { id: "shrikhand", label: "Spice Pop", previewFamily: '"Shrikhand", cursive' },
  { id: "alfa-slab", label: "Slab Punch", previewFamily: '"Alfa Slab One", serif' },
  { id: "caveat", label: "Handwritten", previewFamily: '"Caveat", cursive', previewWeight: 700 },
  { id: "black-ops", label: "Tactical", previewFamily: '"Black Ops One", cursive' },
]

export function getFontStyle(id) {
  return OVERLAY_FONT_STYLES.find((s) => s.id === id) || OVERLAY_FONT_STYLES[0]
}
