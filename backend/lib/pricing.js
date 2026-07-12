/** Runway API credit costs — server-side only. $0.01 per credit. */

const CREDITS_PER_SECOND = {
  gen4_turbo: 5,
  gen4_5: 12,
  "gen4.5": 12,
  "veo3.1_fast": 10,
  "veo3.1": 20,
}

export function calculateClipCost(model, durationSeconds, audioEnabled = false) {
  let creditsPerSecond = CREDITS_PER_SECOND[model] ?? 12

  if (model === "veo3.1" && audioEnabled) creditsPerSecond = 40
  if (model === "veo3.1_fast" && audioEnabled) creditsPerSecond = 15

  const costCredits = creditsPerSecond * durationSeconds
  return {
    costCredits,
    costUSD: costCredits * 0.01,
  }
}
