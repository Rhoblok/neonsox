const TTS_MODEL = "eleven_flash_v2_5"
const MUSIC_MODEL = "music_v1"

export { musicPromptForMood, resolveVoiceId, voiceTtsSettings } from "./audioPresets.js"

export async function synthesizeSpeech({ text, voiceId, apiKey, stability = 0.5, similarityBoost = 0.75 }) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: TTS_MODEL,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
      },
    }),
  })

  if (!res.ok) {
    const detail = await readError(res)
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${detail}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

export async function composeMusic({ prompt, lengthMs, apiKey }) {
  const res = await fetch("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      prompt,
      music_length_ms: lengthMs,
      model_id: MUSIC_MODEL,
      force_instrumental: true,
    }),
  })

  if (!res.ok) {
    const detail = await readError(res)
    throw new Error(`ElevenLabs music failed (${res.status}): ${detail}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

async function readError(res) {
  try {
    const body = await res.json()
    return body.detail?.message || body.detail?.status || JSON.stringify(body.detail || body)
  } catch {
    return res.statusText
  }
}
