import dotenv from "dotenv"

dotenv.config()

const key = (process.env.ELEVENLABS_API_KEY || "").trim()
const voice = (process.env.ELEVENLABS_VOICE_ID || "").trim()

if (!key) {
  console.log("FAIL: ELEVENLABS_API_KEY missing")
  process.exit(1)
}
if (!voice) {
  console.log("FAIL: ELEVENLABS_VOICE_ID missing")
  process.exit(1)
}

console.log("Key format:", key.startsWith("sk_") ? "sk_ (ElevenLabs)" : "unexpected prefix")
console.log("Key length:", key.length)
console.log("Voice ID length:", voice.length)

const userRes = await fetch("https://api.elevenlabs.io/v1/user", {
  headers: { "xi-api-key": key },
})
if (userRes.ok) {
  console.log("API key check:", "OK")
} else {
  console.log("API key check:", `skipped (${userRes.status} — key may lack user_read; trying TTS next)`)
}

const FREE_DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM" // Rachel — works on many free API plans

async function tryTts(voiceId, label) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: "NEONSOX test. Your voice is connected.",
      model_id: "eleven_flash_v2_5",
    }),
  })
  console.log(`Voice TTS (${label}):`, res.status === 200 ? "OK" : `FAIL (${res.status})`)
  if (!res.ok) {
    try {
      const body = await res.json()
      const detail = body.detail?.message || body.detail?.status || JSON.stringify(body.detail || body)
      if (detail) console.log("  Detail:", String(detail).slice(0, 300))
    } catch {
      /* ignore */
    }
    return null
  }
  return Buffer.from(await res.arrayBuffer())
}

let audio = await tryTts(voice, "your ELEVENLABS_VOICE_ID")
if (!audio && voice !== FREE_DEFAULT_VOICE) {
  console.log("\nTrying built-in default voice (Rachel) for free-tier API...")
  audio = await tryTts(FREE_DEFAULT_VOICE, "Rachel default")
}

if (!audio) {
  console.log("\nFix: use a voice allowed on your plan, or upgrade ElevenLabs.")
  process.exit(1)
}

console.log("Test audio size:", `${Math.round(audio.length / 1024)} KB`)
console.log("ALL PASS")
