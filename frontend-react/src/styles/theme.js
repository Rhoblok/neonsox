// NeonSox design tokens. Two palettes (dark = "night", light = "day") matching the
// existing landing page, plus shared accent/spacing tokens. The active palette is
// served by ThemeContext via the useTheme() hook.

// Shared across both modes — the NeonSox blue-neon accent family.
const shared = {
  accent: "#38bdf8",       // sky-blue neon (primary accent)
  accentDeep: "#0f9ed5",   // deeper blue for text-on-light
  glow: "#7dd3fc",         // glow halo color
  danger: "#ff3b30",       // red neon (errors / tagline)
  peach: "#ffb48a",        // logo peach
}

export const palettes = {
  dark: {
    ...shared,
    bg: "#121416",
    bgGradient: "linear-gradient(to bottom, #121416 0%, #1a233a 100%)",
    surface: "#1a1f2e",
    surfaceAlt: "#222a3d",
    border: "rgba(255, 255, 255, 0.10)",
    borderStrong: "rgba(255, 255, 255, 0.18)",
    accentSoft: "rgba(56, 189, 248, 0.14)",
    text: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.70)",
    textFaint: "rgba(255, 255, 255, 0.45)",
    shadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
    glowShadow: "0 0 18px rgba(56, 189, 248, 0.55)",
  },
  light: {
    ...shared,
    bg: "#f4efea",
    bgGradient: "linear-gradient(to bottom, #f4efea 0%, #d8f7ff 100%)",
    surface: "#ffffff",
    surfaceAlt: "#eef7fa",
    border: "rgba(0, 0, 0, 0.10)",
    borderStrong: "rgba(0, 0, 0, 0.18)",
    accentSoft: "rgba(15, 158, 213, 0.12)",
    text: "#0c1c30",
    textMuted: "#555555",
    textFaint: "#888888",
    shadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    glowShadow: "0 0 18px rgba(125, 211, 252, 0.6)",
  },
}

// Mode-independent tokens.
export const tokens = {
  radius: { sm: "8px", md: "12px", pill: "999px" },
  font: {
    sans: "'Exo 2', system-ui, sans-serif",       // futuristic body / UI
    display: "'Orbitron', 'Exo 2', sans-serif",   // sci-fi display / wordmark
  },
  maxWidth: "1100px",
}

export default palettes
