/** @typedef {'x' | 'telegram' | 'reddit' | 'bluesky' | 'discord' | 'tiktok' | 'signal'} SocialPlatformId */

/** @typedef {'oauth2' | 'bot_token' | 'webhook' | 'none'} SocialAuthType */

/** @typedef {'link' | 'media' | 'text'} SocialPostType */

/**
 * @typedef {Object} SocialPostPayload
 * @property {SocialPlatformId} platform
 * @property {SocialPostType} postType
 * @property {string} mediaUrl
 * @property {string} [caption]
 * @property {string} [companyName]
 * @property {string} [trayItemId]
 * @property {string} [generationId]
 * @property {string} [campaignKey]
 */

/**
 * @typedef {Object} SocialPostResult
 * @property {boolean} ok
 * @property {string} [externalPostId]
 * @property {string} [error]
 * @property {'posted' | 'failed' | 'not_configured'} status
 */

export const SOCIAL_PLATFORM_IDS = [
  "x",
  "telegram",
  "reddit",
  "bluesky",
  "discord",
  "tiktok",
  "signal",
]
