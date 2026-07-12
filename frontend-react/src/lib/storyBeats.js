/** Shared story sentence splitting for summary + voice scripts. */
export function sentenceBeats(text) {
  const raw = String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)

  const merged = []
  for (const s of raw) {
    if (merged.length && /^(but|and|then|so|with|while|as)\b/i.test(s)) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${s}`
    } else {
      merged.push(s)
    }
  }
  return merged
}
