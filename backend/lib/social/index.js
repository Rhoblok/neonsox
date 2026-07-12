import { postStub } from "./adapters/stub.js"

/** @typedef {import('./types.js').SocialPostPayload} SocialPostPayload */
/** @typedef {import('./types.js').SocialPostResult} SocialPostResult */

/**
 * Registry: platform id → post handler.
 * Next session: replace stubs with real adapters (x.js, reddit.js, bluesky.js, …).
 */
const ADAPTERS = {
  x: postStub,
  telegram: postStub,
  reddit: postStub,
  bluesky: postStub,
  discord: postStub,
  tiktok: postStub,
  signal: postStub,
}

/**
 * @param {SocialPostPayload} payload
 * @returns {Promise<SocialPostResult>}
 */
export async function postToSocialPlatform(payload) {
  const platform = payload?.platform
  const handler = ADAPTERS[platform]
  if (!handler) {
    return { ok: false, status: "failed", error: `Unknown platform: ${platform}` }
  }
  return handler(payload)
}

export function listSupportedPlatforms() {
  return Object.keys(ADAPTERS)
}
