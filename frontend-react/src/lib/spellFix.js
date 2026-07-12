/** Lightweight typo fixes for brief fields and AI summary (no API cost). */

const TYPO_MAP = {
  shoppinng: "shopping",
  shoping: "shopping",
  resturant: "restaurant",
  resturants: "restaurants",
  restaraunt: "restaurant",
  buiness: "business",
  businesss: "business",
  janitoral: "janitorial",
  advertisment: "advertisement",
  advertisments: "advertisements",
  corparate: "corporate",
  professinal: "professional",
  cleanng: "cleaning",
  bookng: "booking",
  svae: "save",
  aqcuisition: "acquisition",
  loosly: "loosely",
  aquisition: "acquisition",
  acquistion: "acquisition",
  recieve: "receive",
  occured: "occurred",
  bookkings: "bookings",
}

function applyCase(original, fixed) {
  if (original === original.toUpperCase()) return fixed.toUpperCase()
  if (original[0] === original[0]?.toUpperCase()) {
    return fixed.charAt(0).toUpperCase() + fixed.slice(1)
  }
  return fixed
}

export function fixSpelling(text) {
  if (!text || typeof text !== "string") return text

  let result = text.replace(/\b([A-Za-z]+)\b/g, (word) => {
    const lower = word.toLowerCase()
    if (TYPO_MAP[lower]) return applyCase(word, TYPO_MAP[lower])
    return word
  })

  result = result.replace(/\b([A-Za-z]*)([A-Za-z])\2{2,}([A-Za-z]*)\b/g, (_, pre, ch, post) => {
    const word = `${pre}${ch}${ch}${post}`
    const lower = word.toLowerCase()
    if (TYPO_MAP[lower]) return applyCase(word, TYPO_MAP[lower])
    return `${pre}${ch}${ch}${post}`
  })

  return result
}

export function fixSpellingList(text) {
  if (!text) return text
  return text
    .split(",")
    .map((part) => fixSpelling(part.trim()))
    .join(", ")
}
