import { calculateClipCost } from "./pricing.js"
import {
  buildRunwayPrompt,
  buildSafeFallbackPrompt,
  buildMinimalFallbackPrompt,
  isRefundableError,
} from "./runwayPrompt.js"
import {
  createVideoTask,
  extractOutputUrl,
  getCreditBalance,
  pickModel,
  waitForTask,
} from "./runway.js"

async function attemptOnce({ apiKey, version, model, promptText, duration, ratio }) {
  let created
  try {
    created = await createVideoTask({
      apiKey,
      version,
      model,
      promptText,
      duration,
      ratio,
    })
  } catch (err) {
    return { taskId: null, failed: true, error: err.message || "Runway create failed" }
  }

  const taskId = created.id || created.task?.id
  if (!taskId) {
    return { taskId: null, failed: true, error: "Runway did not return a task id" }
  }

  try {
    const finished = await waitForTask({ apiKey, version, taskId })
    const outputUrl = extractOutputUrl(finished)
    if (!outputUrl) {
      return { taskId, failed: true, error: "Runway succeeded but no output URL was returned" }
    }
    return { taskId, outputUrl }
  } catch (err) {
    return { taskId, failed: true, error: err.message || "Runway generation failed" }
  }
}

export async function runGeneration(payload, env = process.env) {
  const apiKey = env.RUNWAY_API_KEY
  if (!apiKey) {
    throw new Error("RUNWAY_API_KEY is not set in backend/.env")
  }

  const version = env.RUNWAY_API_VERSION || "2024-11-06"
  const duration = Math.min(10, Math.max(2, Number(env.RUNWAY_DURATION_SECONDS || 10)))
  const ratio = env.RUNWAY_RATIO || "1280:720"
  const preferredModel = env.RUNWAY_MODEL || "gen4.5"

  const model = pickModel({
    audioEnabled: !!payload.audioEnabled,
    preferred: preferredModel,
  })

  const credits = await getCreditBalance({ apiKey, version })
  const { costCredits } = calculateClipCost(model, duration, !!payload.audioEnabled)
  if (credits !== null && credits < costCredits) {
    return {
      status: "failed",
      error: `Not enough Runway credits (need ~${costCredits}, have ${credits}). Add credits at dev.runwayml.com → Billing.`,
      refundTry: true,
      failureCode: "insufficient_credits",
    }
  }

  const attempts = [
    { label: "primary", prompt: buildRunwayPrompt(payload) },
    { label: "safe", prompt: buildSafeFallbackPrompt(payload) },
    { label: "minimal", prompt: buildMinimalFallbackPrompt(payload) },
  ]

  let lastError = "Runway generation failed"
  let lastTaskId = null

  for (const attempt of attempts) {
    console.log(`Runway attempt [${attempt.label}] model=${model} promptLen=${attempt.prompt.length}`)

    const result = await attemptOnce({
      apiKey,
      version,
      model,
      promptText: attempt.prompt,
      duration,
      ratio,
    })

    if (!result.failed) {
      const { costCredits: creditsUsed, costUSD } = calculateClipCost(model, duration, !!payload.audioEnabled)
      return {
        status: "succeeded",
        taskId: result.taskId,
        model,
        durationSeconds: duration,
        outputUrl: result.outputUrl,
        thumbnailUrl: result.outputUrl,
        costCredits: creditsUsed,
        costUSD,
        promptStrategy: attempt.label,
      }
    }

    lastError = result.error
    lastTaskId = result.taskId
    console.warn(`Runway [${attempt.label}] failed:`, lastError)
  }

  return {
    status: "failed",
    taskId: lastTaskId,
    error: lastError,
    refundTry: isRefundableError(lastError),
    failureCode: /content moderation/i.test(lastError) ? "moderation" : "runway_error",
    costCredits: 0,
    costUSD: 0,
  }
}
