/**
 * Base pattern for proprietary per-platform adapters.
 * Each adapter implements connect (if OAuth), post, and optional refresh.
 */

/** @typedef {import('../types.js').SocialPostPayload} SocialPostPayload */
/** @typedef {import('../types.js').SocialPostResult} SocialPostResult */

/**
 * @param {SocialPlatformId} platformId
 * @returns {SocialPostResult}
 */
export function notConfigured(platformId) {
  return {
    ok: false,
    status: "not_configured",
    error: `${platformId} posting is not wired yet. Add API keys and adapter in backend/lib/social/adapters/.`,
  }
}

/**
 * @param {SocialPostPayload} _payload
 * @returns {Promise<SocialPostResult>}
 */
export async function postStub(_payload) {
  return notConfigured(_payload.platform)
}
