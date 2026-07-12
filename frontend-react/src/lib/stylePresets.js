/** Runway-style visual presets for Palette Schema ad generation. */

function labelFromId(id) {
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

// Muted swatches: rainbow variety + neutral earthtones (lower saturation).
const SWATCH_PAIRS = [
  ["#5c4a3a", "#8f7358"], // umber / clay
  ["#4a5244", "#7a8572"], // moss / sage
  ["#6b5c4f", "#a3927e"], // taupe / sand
  ["#3e4a52", "#64737d"], // slate / steel
  ["#4a5568", "#718096"], // blue-gray
  ["#5a4f6e", "#867a9a"], // dusty violet
  ["#6b4a5a", "#9a7088"], // dusty rose
  ["#7a4f4f", "#a67373"], // terracotta
  ["#6b5a3a", "#9a8555"], // ochre / wheat
  ["#3d5a4a", "#5f8268"], // forest / fern
  ["#4a5d6b", "#6d8494"], // denim / sky
  ["#455a64", "#607d8b"], // teal-gray
  ["#5d4e37", "#8b7355"], // brown / khaki
  ["#4e4a45", "#787068"], // charcoal / stone
  ["#6a5acd", "#8b84c9"], // soft indigo
  ["#2f6b6d", "#4a9094"], // deep teal
  ["#7b5e57", "#a8867c"], // sienna / blush clay
  ["#556b2f", "#7a9444"], // olive / leaf
  ["#8b6914", "#b8922e"], // amber / honey
  ["#5c4033", "#826454"], // espresso / walnut
  ["#36454f", "#536878"], // charcoal blue
  ["#6b7c8c", "#94a3b8"], // cool gray-blue
  ["#7c6f64", "#a89888"], // warm gray
  ["#4a6741", "#6d8c62"], // pine / sage green
  ["#8b4789", "#a86ea6"], // muted plum
  ["#2c5282", "#4a7ab8"], // navy / medium blue
  ["#744210", "#9c6920"], // bronze
  ["#1a535c", "#2d7a86"], // deep cyan
  ["#5c4d7a", "#7d6b9e"], // muted purple
  ["#8b7355", "#b09a78"], // tan / linen
  ["#3c3c3c", "#5a5a5a"], // monochrome gray
  ["#6b8e23", "#8fad3c"], // olive drab
  ["#704214", "#94602a"], // sepia / rust
  ["#4682b4", "#6a9fc9"], // steel blue
  ["#808000", "#a3a352"], // olive gold
  ["#8b4513", "#a86530"], // saddle brown
  ["#483d8b", "#6a5fae"], // dark slate blue
  ["#2e8b57", "#45a872"], // sea green
  ["#bc8f8f", "#d4aaaa"], // rosy brown
  ["#778899", "#95a7b8"], // light slate
  ["#cd853f", "#dba564"], // peru / sand gold
]

function gradientForId(id) {
  const seed = id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const [a, b] = SWATCH_PAIRS[seed % SWATCH_PAIRS.length]
  return `linear-gradient(145deg, ${a} 0%, ${b} 100%)`
}

const RAW = [
  ["cute_isometric", "Soft isometric 3D product scenes", "3D"],
  ["neon", "Electric neon-lit environments", "Environment"],
  ["low_poly", "Minimal low-poly 3D look", "3D"],
  ["metallic", "Polished metallic surfaces", "Product"],
  ["cute_character", "Friendly illustrated characters", "3D"],
  ["cute_avatar", "Avatar-style character portraits", "Portrait"],
  ["origami", "Folded paper aesthetic", "3D"],
  ["mecha", "Mechanical sci-fi styling", "3D"],
  ["animated_character", "Animated character focus", "3D"],
  ["clay_model", "Hand-sculpted clay texture", "3D"],
  ["wood_carving", "Carved wood craftsmanship", "3D"],
  ["minimal_balloon", "Minimal balloon-sculpted forms", "3D"],
  ["stone_carving", "Stone sculpture texture", "3D"],
  ["plastic_bricks", "Modular brick-built look", "3D"],
  ["fluffy", "Soft plush tactile surfaces", "3D"],
  ["multicolor_mecha", "Vivid multicolor mecha", "3D"],
  ["mythical", "Fantasy mythical atmosphere", "Cinematic"],
  ["indoor", "Interior studio environments", "Environment"],
  ["outdoor", "Natural outdoor settings", "Environment"],
  ["bokeh", "Shallow depth with bokeh blur", "Cinematic"],
  ["black_and_white", "Classic monochrome contrast", "Cinematic"],
  ["close_up", "Tight macro product framing", "Cinematic"],
  ["advertising_testimonial", "Testimonial-style ad framing", "Advertising"],
  ["cyberpunk", "Neon dystopian city mood", "Environment"],
  ["fish_eye", "Wide fisheye lens distortion", "Cinematic"],
  ["studio_shot", "Clean professional studio lighting", "Product"],
  ["wet_plate", "Vintage wet-plate photography", "Cinematic"],
  ["motion_blur", "Dynamic motion blur energy", "Cinematic"],
  ["instant_photo", "Instant film snapshot feel", "Cinematic"],
  ["moody_portrait", "Dark moody portrait lighting", "Portrait"],
  ["bold_portrait", "High-contrast bold portraits", "Portrait"],
  ["water_action", "Splash and water action shots", "Cinematic"],
  ["sunset", "Golden-hour sunset warmth", "Environment"],
  ["brutalist_product", "Bold brutalist product staging", "Product"],
  ["summer_product", "Bright summery product styling", "Product"],
  ["advertising_product", "Classic product advertising", "Advertising"],
  ["nautical_product", "Coastal nautical product theme", "Product"],
  ["advertising_podium", "Podium hero product reveal", "Advertising"],
  ["framed", "Gallery-framed composition", "Advertising"],
  ["hieroglyph", "Ancient carved motif styling", "Cinematic"],
  ["people_street_photography", "Real NYC street scene — people on city sidewalks", "Portrait"],
]

export const STYLE_PRESETS = RAW.map(([id, description, category]) => ({
  id,
  label: labelFromId(id),
  description,
  category,
  gradient: gradientForId(id),
}))

export const STYLE_CATEGORIES = [...new Set(STYLE_PRESETS.map((p) => p.category))]

export function getStylePreset(id) {
  return STYLE_PRESETS.find((p) => p.id === id) || null
}
