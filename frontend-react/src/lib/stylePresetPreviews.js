/**
 * Visual previews for style presets (Pexels — royalty-free).
 * Falls back to gradient swatch when image fails to load.
 */

function px(photoId) {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=480&h=288&fit=crop`
}

export const PRESET_PREVIEWS = {
  people_street_photography: {
    image: px(4484071),
    video: "https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4",
    badge: "NYC real street scene",
    sceneCaption: "Real NYC street scene — people crossing a Manhattan crosswalk.",
    alt: "Real NYC street scene with people on city sidewalks",
  },
  neon: { image: px(1486226), alt: "Neon-lit city at night" },
  cyberpunk: { image: px(577585), alt: "Cyberpunk city mood" },
  outdoor: { image: px(2662116), alt: "Natural outdoor setting" },
  indoor: {
    image:
      "https://images.pexels.com/photos/37347/office-freelancer-computer-business-37347.jpeg?auto=compress&cs=tinysrgb&w=480&h=288&fit=crop",
    alt: "Modern interior studio",
  },
  studio_shot: { image: px(90946), alt: "Clean product studio lighting" },
  moody_portrait: { image: px(2379004), alt: "Moody portrait lighting" },
  bold_portrait: { image: px(1858175), alt: "Bold high-contrast portrait" },
  advertising_testimonial: { image: px(3184291), alt: "Testimonial-style talking head" },
  black_and_white: { image: px(374870), alt: "Black and white urban scene" },
  sunset: {
    image:
      "https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=480&h=288&fit=crop",
    alt: "Golden hour sunset",
  },
  bokeh: { image: px(255379), alt: "Shallow depth bokeh lights" },
  cute_isometric: { image: px(6444259), alt: "Soft 3D isometric style" },
  nautical_product: { image: px(1001682), alt: "Coastal nautical mood" },
  advertising_podium: { image: px(5632402), alt: "Product on a hero podium" },
  framed: { image: px(1191710), alt: "Gallery-framed composition" },
  hieroglyph: {
    image:
      "https://images.pexels.com/photos/2363/france-landmark-lights-night-2363.jpeg?auto=compress&cs=tinysrgb&w=480&h=288&fit=crop",
    alt: "Ancient carved stone motifs",
  },
  wood_carving: { image: px(326258), alt: "Carved wood craftsmanship" },
  stone_carving: { image: px(161931), alt: "Stone sculpture texture" },
  plastic_bricks: { image: px(162553), alt: "Modular brick-built look" },
  minimal_balloon: {
    image:
      "https://images.pexels.com/photos/39575/balloon-heart-love-romance-39575.jpeg?auto=compress&cs=tinysrgb&w=480&h=288&fit=crop",
    alt: "Minimal balloon-sculpted forms",
  },
  fluffy: { image: px(4588455), alt: "Soft plush tactile surfaces" },
  clay_model: { image: px(4207900), alt: "Hand-sculpted clay texture" },
  mecha: {
    image:
      "https://images.pexels.com/photos/2150/smartphone-touchscreen-technology-phone.jpg?auto=compress&cs=tinysrgb&w=480&h=288&fit=crop",
    alt: "Mechanical sci-fi styling",
  },
  multicolor_mecha: { image: px(577585), alt: "Vivid multicolor mecha" },
  animated_character: { image: px(6444259), alt: "Animated character focus" },
  cute_character: { image: px(4588455), alt: "Friendly illustrated characters" },
  cute_avatar: { image: px(1858175), alt: "Avatar-style character portraits" },
  low_poly: { image: px(6444259), alt: "Minimal low-poly 3D look" },
  metallic: { image: px(90946), alt: "Polished metallic surfaces" },
  origami: { image: px(41949), alt: "Folded paper aesthetic" },
  mythical: { image: px(7991579), alt: "Fantasy mythical atmosphere" },
  close_up: { image: px(90946), alt: "Tight macro product framing" },
  fish_eye: { image: px(374710), alt: "Wide fisheye lens distortion" },
  wet_plate: { image: px(374870), alt: "Vintage wet-plate photography" },
  motion_blur: { image: px(7991579), alt: "Dynamic motion blur energy" },
  instant_photo: { image: px(255379), alt: "Instant film snapshot feel" },
  water_action: { image: px(1001682), alt: "Splash and water action shots" },
  brutalist_product: { image: px(5632402), alt: "Bold brutalist product staging" },
  summer_product: { image: px(2662116), alt: "Bright summery product styling" },
  advertising_product: { image: px(5632402), alt: "Classic product advertising" },
}

const CATEGORY_FALLBACKS = {
  "3D": { image: px(6444259), alt: "Soft 3D rendered scene" },
  Environment: { image: px(374710), alt: "Urban environment" },
  Product: { image: px(90946), alt: "Product photography" },
  Portrait: { image: px(2379004), alt: "Portrait lighting" },
  Cinematic: { image: px(7991579), alt: "Cinematic film mood" },
  Advertising: { image: px(5632402), alt: "Advertising hero shot" },
}

export function getPresetPreview(presetId, category) {
  if (PRESET_PREVIEWS[presetId]) return PRESET_PREVIEWS[presetId]
  if (category && CATEGORY_FALLBACKS[category]) return CATEGORY_FALLBACKS[category]
  return null
}

/** Shorter card titles — avoids sloppy multi-line wrap in the grid. */
export const PRESET_SHORT_LABELS = {
  people_street_photography: "NYC Real Street Scene",
  advertising_testimonial: "Testimonial",
  advertising_product: "Product Ad",
  advertising_podium: "Podium",
  black_and_white: "B&W Film",
  cute_isometric: "Isometric 3D",
  stone_carving: "Stone Carve",
  wood_carving: "Wood Carve",
  plastic_bricks: "Brick Build",
  multicolor_mecha: "Mecha Vivid",
  animated_character: "Animated",
  summer_product: "Summer Product",
  brutalist_product: "Brutalist",
  motion_blur: "Motion Blur",
  instant_photo: "Instant Film",
  wet_plate: "Wet Plate",
  fish_eye: "Fisheye",
  close_up: "Close-up",
  water_action: "Water Action",
  framed: "Framed",
  hieroglyph: "Hieroglyph",
  low_poly: "Low Poly",
  metallic: "Metallic",
  cute_character: "Cute Char",
  cute_avatar: "Avatar",
  origami: "Origami",
  mecha: "Mecha",
  clay_model: "Clay",
  minimal_balloon: "Balloon",
  fluffy: "Fluffy",
  mythical: "Mythical",
  cyberpunk: "Cyberpunk",
  nautical_product: "Nautical",
  studio_shot: "Studio Shot",
  moody_portrait: "Moody Portrait",
  bold_portrait: "Bold Portrait",
}

export function getPresetShortLabel(presetId, fallbackLabel) {
  return PRESET_SHORT_LABELS[presetId] || fallbackLabel
}
