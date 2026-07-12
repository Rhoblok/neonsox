/** Supported markets + primary ad languages for localization targeting. */

export const WORLDWIDE_ID = "worldwide"
export const US_MARKET_ID = "us"

/** ISO 3166-1 alpha-2 → regional indicator flag emoji. */
export function countryFlagEmoji(flagCode) {
  if (!flagCode || flagCode.length !== 2) return ""
  return flagCode
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("")
}

export const MARKET_COUNTRIES = [
  {
    id: "us",
    label: "United States",
    code: "US",
    flagCode: "US",
    region: "North America",
    map: { x: 22, y: 36 },
    languages: ["English", "Spanish"],
  },
  {
    id: "mx",
    label: "Mexico",
    code: "MX",
    flagCode: "MX",
    region: "North America",
    map: { x: 20, y: 44 },
    languages: ["Spanish"],
  },
  {
    id: "ca",
    label: "Canada",
    code: "CAN",
    flagCode: "CA",
    region: "North America",
    map: { x: 21, y: 28 },
    languages: ["English", "French"],
  },
  {
    id: "uk",
    label: "United Kingdom",
    code: "UK",
    flagCode: "GB",
    region: "Europe",
    map: { x: 48, y: 30 },
    languages: ["English"],
  },
  {
    id: "de",
    label: "Germany",
    code: "DE",
    flagCode: "DE",
    region: "Europe",
    map: { x: 51, y: 32 },
    languages: ["German"],
  },
  {
    id: "nl",
    label: "Netherlands",
    code: "NL",
    flagCode: "NL",
    region: "Europe",
    map: { x: 50, y: 30 },
    languages: ["Dutch"],
  },
  {
    id: "be",
    label: "Belgium",
    code: "BE",
    flagCode: "BE",
    region: "Europe",
    map: { x: 49.5, y: 31 },
    languages: ["Dutch", "French", "German"],
  },
  {
    id: "ie",
    label: "Ireland",
    code: "IE",
    flagCode: "IE",
    region: "Europe",
    map: { x: 47, y: 29 },
    languages: ["English", "Irish"],
  },
  {
    id: "ch",
    label: "Switzerland",
    code: "CH",
    flagCode: "CH",
    region: "Europe",
    map: { x: 50.5, y: 35 },
    languages: ["German", "French", "Italian"],
  },
  {
    id: "fr",
    label: "France",
    code: "FR",
    flagCode: "FR",
    region: "Europe",
    map: { x: 49, y: 34 },
    languages: ["French"],
  },
  {
    id: "es",
    label: "Spain",
    code: "ES",
    flagCode: "ES",
    region: "Europe",
    map: { x: 48, y: 37 },
    languages: ["Spanish", "Catalan"],
  },
  {
    id: "au",
    label: "Australia",
    code: "AU",
    flagCode: "AU",
    region: "Asia-Pacific",
    map: { x: 82, y: 76 },
    languages: ["English"],
  },
  {
    id: "nz",
    label: "New Zealand",
    code: "NZ",
    flagCode: "NZ",
    region: "Asia-Pacific",
    map: { x: 90, y: 84 },
    languages: ["English", "Māori"],
  },
  {
    id: "jp",
    label: "Japan",
    code: "JP",
    flagCode: "JP",
    region: "Asia-Pacific",
    map: { x: 85, y: 38 },
    languages: ["Japanese"],
  },
  {
    id: "kr",
    label: "South Korea",
    code: "KR",
    flagCode: "KR",
    region: "Asia-Pacific",
    map: { x: 83.5, y: 37 },
    languages: ["Korean"],
  },
  {
    id: "sg",
    label: "Singapore",
    code: "SG",
    flagCode: "SG",
    region: "Asia-Pacific",
    map: { x: 78, y: 56 },
    languages: ["English", "Mandarin", "Malay", "Tamil"],
  },
  {
    id: "hk",
    label: "Hong Kong",
    code: "HK",
    flagCode: "HK",
    region: "Asia-Pacific",
    map: { x: 82, y: 44 },
    languages: ["Cantonese", "English"],
  },
  {
    id: "in",
    label: "India",
    code: "IN",
    flagCode: "IN",
    region: "Asia-Pacific",
    map: { x: 72, y: 48 },
    languages: ["Hindi", "English"],
  },
  {
    id: "br",
    label: "Brazil",
    code: "BR",
    flagCode: "BR",
    region: "Latin America",
    map: { x: 32, y: 64 },
    languages: ["Portuguese"],
  },
  {
    id: "cr",
    label: "Costa Rica",
    code: "CR",
    flagCode: "CR",
    region: "Latin America",
    map: { x: 23, y: 52 },
    languages: ["Spanish"],
  },
  {
    id: "sv",
    label: "El Salvador",
    code: "SV",
    flagCode: "SV",
    region: "Latin America",
    map: { x: 21.5, y: 50 },
    languages: ["Spanish"],
  },
  {
    id: "pa",
    label: "Panama",
    code: "PA",
    flagCode: "PA",
    region: "Latin America",
    map: { x: 23.5, y: 53 },
    languages: ["Spanish"],
  },
  {
    id: "co",
    label: "Colombia",
    code: "CO",
    flagCode: "CO",
    region: "Latin America",
    map: { x: 25, y: 58 },
    languages: ["Spanish"],
  },
  {
    id: "cl",
    label: "Chile",
    code: "CL",
    flagCode: "CL",
    region: "Latin America",
    map: { x: 27, y: 80 },
    languages: ["Spanish"],
  },
  {
    id: "pe",
    label: "Peru",
    code: "PE",
    flagCode: "PE",
    region: "Latin America",
    map: { x: 25, y: 62 },
    languages: ["Spanish"],
  },
  {
    id: "uy",
    label: "Uruguay",
    code: "UY",
    flagCode: "UY",
    region: "Latin America",
    map: { x: 29, y: 76 },
    languages: ["Spanish"],
  },
  {
    id: "za",
    label: "South Africa",
    code: "ZA",
    flagCode: "ZA",
    region: "Africa & Middle East",
    map: { x: 54, y: 76 },
    languages: ["English", "Afrikaans", "Zulu"],
  },
  {
    id: "ng",
    label: "Nigeria",
    code: "NG",
    flagCode: "NG",
    region: "Africa & Middle East",
    map: { x: 51, y: 56 },
    languages: ["English"],
  },
  {
    id: "ae",
    label: "United Arab Emirates",
    code: "UAE",
    flagCode: "AE",
    region: "Africa & Middle East",
    map: { x: 59, y: 46 },
    languages: ["Arabic", "English"],
  },
  {
    id: "il",
    label: "Israel",
    code: "IL",
    flagCode: "IL",
    region: "Africa & Middle East",
    map: { x: 56, y: 42 },
    languages: ["Hebrew", "Arabic", "English"],
  },
]

export const MARKET_BY_ID = Object.fromEntries(MARKET_COUNTRIES.map((c) => [c.id, c]))

/** United States first, then all others A–Z. */
export function sortedMarketCountries(countries = MARKET_COUNTRIES) {
  const us = countries.find((c) => c.id === US_MARKET_ID)
  const rest = countries
    .filter((c) => c.id !== US_MARKET_ID)
    .sort((a, b) => a.label.localeCompare(b.label))
  return us ? [us, ...rest] : rest
}

export const SORTED_MARKET_COUNTRIES = sortedMarketCountries()

export const MARKET_REGIONS = [...new Set(MARKET_COUNTRIES.map((c) => c.region))]

/** Union of languages for selected market ids. */
export function languagesForMarkets(marketIds = []) {
  const set = new Set()
  for (const id of marketIds) {
    const country = MARKET_BY_ID[id]
    if (country) country.languages.forEach((lang) => set.add(lang))
  }
  return [...set].sort()
}

export function formatMarketSummary({ homeCountry, homeRegion = "", targetMarkets = [], worldwideMarkets = false }) {
  if (worldwideMarkets) return "Worldwide"
  const parts = []
  if (homeCountry && MARKET_BY_ID[homeCountry]) {
    const regionLabel = homeRegion ? `, ${homeRegion}` : ""
    parts.push(`Home: ${MARKET_BY_ID[homeCountry].label}${regionLabel}`)
  }
  const targets = targetMarkets
    .map((id) => MARKET_BY_ID[id]?.label)
    .filter(Boolean)
  if (targets.length) parts.push(`Targets: ${targets.join(", ")}`)
  return parts.join(" · ") || "No markets selected"
}

/** Self-reported state / province options by home country id. */
export const REGIONS_BY_COUNTRY = {
  us: [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming", "District of Columbia",
  ],
  ca: [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
    "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
    "Quebec", "Saskatchewan", "Yukon",
  ],
}

export function countryRequiresRegion(countryId) {
  return Array.isArray(REGIONS_BY_COUNTRY[countryId]) && REGIONS_BY_COUNTRY[countryId].length > 0
}

export function regionsForCountry(countryId) {
  return REGIONS_BY_COUNTRY[countryId] || []
}
