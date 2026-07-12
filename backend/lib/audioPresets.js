/**
 * Voice + music presets for ElevenLabs audio mix.
 * Voice styles change delivery tone only — always uses ELEVENLABS_VOICE_ID from env.
 */

export const VOICE_STYLE_DEFS = {
  professional: { stability: 0.5, similarityBoost: 0.75 },
  friendly: { stability: 0.35, similarityBoost: 0.8 },
  bold: { stability: 0.68, similarityBoost: 0.88 },
  warm: { stability: 0.4, similarityBoost: 0.78 },
  calm: { stability: 0.55, similarityBoost: 0.72 },
  energetic: { stability: 0.3, similarityBoost: 0.82 },
  authoritative: { stability: 0.62, similarityBoost: 0.86 },
  conversational: { stability: 0.42, similarityBoost: 0.76 },
  luxury: { stability: 0.48, similarityBoost: 0.8 },
  youthful: { stability: 0.32, similarityBoost: 0.78 },
  documentary: { stability: 0.58, similarityBoost: 0.84 },
  storyteller: { stability: 0.45, similarityBoost: 0.77 },
  confident: { stability: 0.6, similarityBoost: 0.87 },
  soft: { stability: 0.38, similarityBoost: 0.7 },
  punchy: { stability: 0.55, similarityBoost: 0.9 },
}

const MOOD_PROMPT_SUFFIX = " Instrumental only, polished, no vocals, fits a 10-second commercial."

export const MUSIC_MOOD_PROMPTS = {
  upbeat: `Upbeat modern commercial background music.${MOOD_PROMPT_SUFFIX} Energetic, bright, forward-moving.`,
  calm: `Calm professional ambient background music.${MOOD_PROMPT_SUFFIX} Soft, trustworthy, relaxed.`,
  bold: `Bold cinematic commercial background music.${MOOD_PROMPT_SUFFIX} Driving rhythm, confident.`,
  corporate: `Clean corporate background music.${MOOD_PROMPT_SUFFIX} Professional, neutral, trustworthy.`,
  inspirational: `Inspirational uplifting background music.${MOOD_PROMPT_SUFFIX} Hopeful, motivating, warm.`,
  playful: `Playful lighthearted commercial music.${MOOD_PROMPT_SUFFIX} Fun, bouncy, friendly.`,
  cinematic: `Cinematic trailer-style background music.${MOOD_PROMPT_SUFFIX} Epic, sweeping, dramatic build.`,
  minimal: `Minimal modern background music.${MOOD_PROMPT_SUFFIX} Sparse, sleek, contemporary.`,
  funky: `Funky groove-based commercial music.${MOOD_PROMPT_SUFFIX} Rhythmic, cool, upbeat.`,
  elegant: `Elegant refined background music.${MOOD_PROMPT_SUFFIX} Sophisticated, smooth, premium.`,
  urgent: `Urgent fast-paced commercial music.${MOOD_PROMPT_SUFFIX} Time-sensitive, energetic, direct.`,
  hopeful: `Hopeful sunrise-style background music.${MOOD_PROMPT_SUFFIX} Optimistic, gentle rise, warm.`,
  techy: `Modern tech startup background music.${MOOD_PROMPT_SUFFIX} Digital, clean, innovative.`,
  acoustic: `Acoustic organic background music.${MOOD_PROMPT_SUFFIX} Guitar or piano, warm, human.`,
  dramatic: `Dramatic tension-building background music.${MOOD_PROMPT_SUFFIX} Bold, impactful, memorable.`,
}

export function resolveVoiceId(voiceGender = "female", env = process.env) {
  const female = (env.ELEVENLABS_VOICE_ID_FEMALE || env.ELEVENLABS_VOICE_ID || "").trim()
  const male = (env.ELEVENLABS_VOICE_ID_MALE || "").trim()

  if (voiceGender === "male") {
    if (!male) {
      throw new Error("MALE_VOICE_NOT_CONFIGURED")
    }
    return male
  }

  if (!female) {
    throw new Error("ELEVENLABS_VOICE_ID is not set in backend/.env")
  }
  return female
}

export function voiceTtsSettings(voiceStyle) {
  const def = VOICE_STYLE_DEFS[voiceStyle] || VOICE_STYLE_DEFS.professional
  return { stability: def.stability, similarityBoost: def.similarityBoost }
}

export function musicPromptForMood(mood, tone = "") {
  const toneBit = tone ? ` ${tone.toLowerCase()} feel.` : ""
  const base = MUSIC_MOOD_PROMPTS[mood] || MUSIC_MOOD_PROMPTS.upbeat
  return toneBit ? base.replace(MOOD_PROMPT_SUFFIX, `${toneBit}${MOOD_PROMPT_SUFFIX}`) : base
}
