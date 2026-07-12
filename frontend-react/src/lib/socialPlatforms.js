/** Social platforms available for posting from Socials Tray. */
export const SOCIAL_PLATFORMS = [
  { id: "x", label: "X", authType: "oauth2", supportsMedia: true, supportsLink: true },
  { id: "telegram", label: "Telegram", authType: "bot_token", supportsMedia: true, supportsLink: true },
  { id: "reddit", label: "reddit", authType: "oauth2", supportsMedia: true, supportsLink: true },
  { id: "bluesky", label: "bluesky", authType: "oauth2", supportsMedia: true, supportsLink: true },
  { id: "discord", label: "discord", authType: "webhook", supportsMedia: true, supportsLink: true },
  { id: "tiktok", label: "tiktok", authType: "oauth2", supportsMedia: true, supportsLink: false },
  { id: "signal", label: "signal", authType: "none", supportsMedia: false, supportsLink: false },
]

export function platformById(id) {
  return SOCIAL_PLATFORMS.find((p) => p.id === id) || null
}
