/** Map internal errors to short, user-safe messages (never expose .env or config hints). */

const AUDIO_UNAVAILABLE =
  "Voice and music aren't available right now. Please try again in a few minutes."

export function publicAudioError(message = "") {
  const m = String(message || "").toLowerCase()

  if (!m) return AUDIO_UNAVAILABLE
  if (m.includes("disabled") || m.includes("elevenlabs_audio_enabled") || m.includes("audio_mix_disabled")) return AUDIO_UNAVAILABLE
  if (m.includes("male_voice_not_configured")) {
    return "Male voice isn't available yet. Try Female for now."
  }
  if (m.includes("elevenlabs_api_key") || m.includes("elevenlabs_voice_id")) return AUDIO_UNAVAILABLE
  if (m.includes("missing narration") || m.includes("missing videourl")) {
    return "Add a script and choose a clip before adding voice and music."
  }
  if (m.includes("could not download video")) {
    return "We couldn't load your clip. Try generating again, then add voice and music."
  }
  if (m.includes("elevenlabs tts") || m.includes("text-to-speech")) {
    return "We couldn't generate the voiceover. Try a different voice style or try again."
  }
  if (m.includes("elevenlabs music") || m.includes("music failed")) {
    return "Voice was added but background music couldn't be generated. You can try again."
  }
  if (m.includes("timeout") || m.includes("network") || m.includes("fetch")) {
    return "That took too long. Please check your connection and try again."
  }

  return "Something went wrong adding voice and music. Please try again."
}

export function publicOverlayError(message = "") {
  const m = String(message || "").toLowerCase()

  if (!m) return "We couldn't add your on-screen text. Please try again."
  if (m.includes("ffmpeg") || m.includes("fontfile") || m.includes("drawtext")) {
    return "We couldn't add your on-screen text right now. Please try again in a few minutes."
  }
  if (m.includes("fonts missing") || m.includes("fetch-overlay-fonts")) {
    return "Text styles are still loading. Please try again shortly."
  }
  if (m.includes("missing company")) {
    return "Add your company name in Step 1 first."
  }
  if (m.includes("missing videourl") || m.includes("could not download")) {
    return "We couldn't load your clip. Generate or select a clip, then try again."
  }
  if (m.includes("timeout") || m.includes("network")) {
    return "That took too long. Check your connection and try again."
  }

  return "We couldn't add your on-screen text. Please try again."
}
