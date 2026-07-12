/**
 * Slick & Simple voiceover hooks — story-first, then industry templates.
 */

import { buildStoryVoiceHooks, storyFromBrief } from "./storyVoiceHooks.js"

function normalizeIndustry(industry = "") {
  return industry.trim().toLowerCase()
}

function matches(industry, patterns) {
  const n = normalizeIndustry(industry)
  return patterns.some((p) => n.includes(p))
}

function isBriefIndustryText(text = "") {
  const t = text.trim()
  if (!t) return false
  if (t.length > 40) return true
  if (/\b(campaign|social media|acquisition|conversion|on social|advertising)\b/i.test(t)) return true
  if ((t.match(/\b\w+\b/g) || []).length > 5) return true
  return false
}

/** Brand + brief aware profile — company name can override a vague industry line. */
export function voiceProfileKey(industry = "", company = "") {
  const combined = `${industry} ${company}`.toLowerCase()
  if (/\b(neon|sox|sock|socks|apparel|streetwear|fashion|designer)\b/.test(combined)) {
    return "fashion"
  }
  return classifyIndustry(industry)
}

function spokenPhrase(industry, company, profileKey) {
  if (isBriefIndustryText(industry)) {
    if (profileKey === "fashion") return "your look"
    if (profileKey === "marketing") return "your ads"
    if (profileKey === "retail" || profileKey === "ecommerce") return "your shop"
    return HINT_LABELS[profileKey] || "what you do"
  }
  const short = industry.trim()
  if (short.length <= 28) return short.toLowerCase()
  return HINT_LABELS[profileKey] || "what you do"
}

function capitalizeSentence(text = "") {
  const t = text.trim()
  if (!t) return t
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}`
}

/** Exact labels from the brief dropdown → voice profile key. */
const DROPDOWN_INDUSTRY_KEYS = {
  "Accounting, Tax & Bookkeeping": "accounting",
  "Legal & Compliance": "legal",
  Consulting: "consulting",
  Insurance: "insurance",
  "Real Estate": "real_estate",
  "Construction & Trades": "construction",
  "Healthcare Providers": "healthcare",
  "Biotech & Life Sciences": "biotech",
  Retailers: "retail",
  "E-Commerce": "ecommerce",
  "Food & Beverage": "food_beverage",
  "Information Technology": "technology",
  "Media & Publishing": "media",
  Logistics: "logistics",
  Manufacturing: "manufacturing",
  "Agriculture (AgTech)": "agriculture",
  "Education (EdTech)": "education",
  "Field Services": "field_services",
  "Janitorial & Commercial Cleaning": "janitorial",
  "Dental Care": "dental",
  "Fitness & Wellness": "fitness",
  "Beauty & Salon": "beauty",
  Automotive: "automotive",
  "Hospitality & Lodging": "hospitality",
  "Pet Services": "pet_services",
  "Childcare & Daycare": "childcare",
  "Events & Photography": "events",
  "Moving & Storage": "moving",
  "Home Security": "security",
  "Solar & Energy": "energy",
}

/** Map free-text or dropdown industry to a voice template key. */
export function classifyIndustry(industry) {
  const trimmed = (industry || "").trim()
  if (DROPDOWN_INDUSTRY_KEYS[trimmed]) return DROPDOWN_INDUSTRY_KEYS[trimmed]

  if (matches(industry, ["janitor", "cleaning", "custodial", "maid", "sanitation", "cleaning cuties"])) {
    return "janitorial"
  }
  if (matches(industry, ["account", "bookkeep", "tax prep", "cpa"])) return "accounting"
  if (matches(industry, ["consult"])) return "consulting"
  if (matches(industry, ["insur"])) return "insurance"
  if (matches(industry, ["law", "legal", "attorney", "compliance"])) return "legal"
  if (matches(industry, ["real estate", "realtor", "property", "realty"])) return "real_estate"
  if (matches(industry, ["construct", "builder", "remodel", "renovation"])) return "construction"
  if (matches(industry, ["plumb", "hvac", "electric", "roof", "handyman"])) return "trades"
  if (matches(industry, ["field service", "pest", "landscap", "lawn", "tree service"])) return "field_services"
  if (matches(industry, ["healthcare", "medical", "clinic", "hospital", "urgent care", "physician"])) {
    return "healthcare"
  }
  if (matches(industry, ["biotech", "life science", "pharma", "laboratory", "lab "])) return "biotech"
  if (matches(industry, ["dental", "dentist", "orthodont"])) return "dental"
  if (matches(industry, ["retail", "boutique", "storefront", "shop"])) return "retail"
  if (matches(industry, ["fashion", "designer", "apparel", "clothing", "sock", "wear", "neon"])) {
    return "fashion"
  }
  if (matches(industry, ["e-commerce", "ecommerce", "online store", "shopify"])) return "ecommerce"
  if (matches(industry, ["restaurant", "food service", "cafe", "coffee", "catering", "food & beverage"])) {
    return "food_beverage"
  }
  if (matches(industry, ["information technology", "software", "saas", "cyber", " it ", "tech support", "msp"])) {
    return "technology"
  }
  if (matches(industry, ["media", "publish", "news", "podcast", "content creator"])) return "media"
  if (matches(industry, ["logistic", "freight", "shipping", "warehouse", "fulfillment", "courier"])) {
    return "logistics"
  }
  if (matches(industry, ["manufactur", "factory", "fabricat", "industrial"])) return "manufacturing"
  if (matches(industry, ["agtech", "agricult", "farm", "crop", "livestock"])) return "agriculture"
  if (matches(industry, ["edtech", "education", "school", "tutor", "training", "course"])) return "education"
  if (matches(industry, ["fitness", "gym", "personal train", "yoga", "crossfit", "pilates"])) return "fitness"
  if (matches(industry, ["salon", "spa", "beauty", "barber", "nail", "cosmetic"])) return "beauty"
  if (matches(industry, ["auto", "mechanic", "car wash", "detailing", "dealership"])) return "automotive"
  if (matches(industry, ["hotel", "hospitality", "motel", "lodging", "bnb", "airbnb"])) return "hospitality"
  if (matches(industry, ["nonprofit", "non-profit", "charity", "foundation"])) return "nonprofit"
  if (matches(industry, ["wedding", "event plan", "photograph", "videograph"])) return "events"
  if (matches(industry, ["pet", "veterinar", "grooming", "dog", "cat"])) return "pet_services"
  if (matches(industry, ["mortgage", "loan", "lending", "credit union", "bank"])) return "financial"
  if (matches(industry, ["marketing", "advertis", "agency", "branding", "seo"])) return "marketing"
  if (matches(industry, ["childcare", "daycare", "preschool"])) return "childcare"
  if (matches(industry, ["moving", "storage", "mover"])) return "moving"
  if (matches(industry, ["security", "alarm", "surveillance"])) return "security"
  if (matches(industry, ["solar", "energy", "utility"])) return "energy"

  return "general"
}

const HOOKS = {
  janitorial: {
    default:
      "Offices, hotels, and storefronts — cleaned spotless so your space always looks its best.",
    "deadpan humor":
      "We handle the mess. You take the credit for how spotless everything looks.",
  },
  accounting: {
    default: "Clean books, clear numbers, and tax season without the stress — we keep it simple.",
  },
  consulting: {
    default: "Practical advice that moves your business forward — strategy you can act on this week.",
  },
  insurance: {
    default: "Coverage that fits your life and budget — protection without the fine-print headache.",
  },
  legal: {
    default: "Clear legal guidance when it matters — confident help from first call to resolution.",
  },
  real_estate: {
    default: "Find the right property faster — local expertise that moves deals forward.",
  },
  construction: {
    default: "Quality builds on schedule — from first estimate to final walkthrough, done right.",
  },
  trades: {
    default: "Licensed pros, done right the first time — schedule service that fits your day.",
  },
  field_services: {
    default: "On-site service when you need it — reliable crews that show up and get it done.",
  },
  healthcare: {
    default: "Care that puts patients first — appointments, follow-ups, and support you can trust.",
  },
  biotech: {
    default: "Science-driven solutions with real-world impact — innovation built for what comes next.",
  },
  dental: {
    default: "Healthy smiles start here — gentle care and appointments that fit your schedule.",
  },
  retail: {
    default: "Quality products and a smooth shopping experience — see what's new in store.",
  },
  ecommerce: {
    default: "Shop online with confidence — fast delivery and products worth coming back for.",
  },
  food_beverage: {
    default: "Fresh flavors and fast service — the kind of experience your customers come back for.",
    "deadpan humor": "The food is great. Pretending you cooked it yourself is optional.",
  },
  technology: {
    default: "Technology that just works — secure, modern tools so your team stays productive.",
  },
  media: {
    default: "Stories that connect with your audience — content that informs, entertains, and sticks.",
  },
  logistics: {
    default: "On time, on track — shipping and fulfillment you can count on when deadlines matter.",
  },
  manufacturing: {
    default: "Built to spec, built to last — precision production for buyers who expect quality.",
  },
  agriculture: {
    default: "Smarter farming, stronger yields — tools and support for growers who feed the future.",
  },
  education: {
    default: "Learning that clicks — programs designed to help students grow with confidence.",
  },
  fitness: {
    default: "Train smarter, feel stronger — programs built for real results you can stick with.",
  },
  beauty: {
    default: "Look and feel your best — book the appointment that fits your style.",
  },
  automotive: {
    default: "Reliable service, honest pricing — get back on the road with confidence.",
  },
  hospitality: {
    default: "Comfortable stays and welcoming service — book the experience your guests remember.",
  },
  nonprofit: {
    default: "Real impact in your community — join us and help move the mission forward.",
  },
  events: {
    default: "Memorable moments, handled end to end — planning and delivery without the chaos.",
  },
  pet_services: {
    default: "Happy pets, happy owners — care and grooming from people who love animals too.",
  },
  financial: {
    default: "Straightforward financing options — clear terms and support through every step.",
  },
  marketing: {
    default: "More visibility, more customers — campaigns that are simple to launch and easy to measure.",
  },
  childcare: {
    default: "Safe, nurturing care you can trust — a place where kids learn, play, and thrive.",
  },
  moving: {
    default: "Stress-free moves, start to finish — careful packing, loading, and delivery on your timeline.",
  },
  security: {
    default: "Protect what matters most — reliable systems and monitoring you can depend on.",
  },
  energy: {
    default: "Lower bills, cleaner power — smart energy solutions for homes and businesses.",
  },
  general: {
    default: null,
  },
}

const HINT_LABELS = {
  janitorial: "janitorial & commercial cleaning",
  accounting: "accounting & bookkeeping",
  consulting: "consulting",
  insurance: "insurance",
  legal: "legal services",
  real_estate: "real estate",
  construction: "construction",
  trades: "home & trade services",
  field_services: "field services",
  healthcare: "healthcare",
  biotech: "biotech & life sciences",
  dental: "dental care",
  retail: "retail",
  marketing: "marketing & ads",
  fashion: "fashion & apparel",
  ecommerce: "e-commerce",
  food_beverage: "food & beverage",
  technology: "technology",
  media: "media & publishing",
  logistics: "logistics & shipping",
  manufacturing: "manufacturing",
  agriculture: "agriculture",
  education: "education",
  fitness: "fitness",
  beauty: "beauty & wellness",
  automotive: "automotive",
  hospitality: "hospitality",
  nonprofit: "nonprofits",
  events: "events & weddings",
  pet_services: "pet services",
  financial: "financial services",
  marketing: "marketing & advertising",
  childcare: "childcare",
  moving: "moving & storage",
  security: "security",
  energy: "energy & solar",
  general: "your industry",
}

function toneKey(adTone = "") {
  return adTone.trim().toLowerCase()
}

export function resolveToneStyle(adTone = "") {
  const t = toneKey(adTone)
  if (t.includes("deadpan")) return "deadpan"
  if (t.includes("serious") && t.includes("funny")) return "serious_funny"
  if (t.includes("warm") || t.includes("friendly")) return "warm"
  if (t.includes("bold") || t.includes("urgent")) return "bold"
  if (t.includes("inspirational")) return "inspirational"
  if (t.includes("playful")) return "playful"
  return "professional"
}

export const TONE_STYLE_LABELS = {
  serious_funny: "serious-funny",
  professional: "professional",
  warm: "warm & friendly",
  bold: "bold & urgent",
  inspirational: "inspirational",
  playful: "playful",
  deadpan: "deadpan",
}

export function toneStyleLabel(style) {
  return TONE_STYLE_LABELS[style] || style || "professional"
}

function isDeadpanTone(adTone = "") {
  return resolveToneStyle(adTone) === "deadpan"
}

function fillIndustry(text, industryLabel = "", profileKey = "general") {
  if (!text.includes("{industry}")) return text
  const label = spokenPhrase(industryLabel, "", profileKey)
  return text.replace(/\{industry\}/g, label)
}

function passesSpokenQuality(script = "") {
  const s = script.toLowerCase()
  if (/advertising campaign on social media/.test(s)) return false
  if (/on social media results/.test(s)) return false
  if (/solid .+ results\. the joke/.test(s) && s.includes("campaign")) return false
  return s.length >= 24
}

/** Deadpan hook lines — browsable script ideas (no LLM). */
const DEADPAN_HOOKS = {
  janitorial: [
    "We handle the mess. You take the credit for how spotless everything looks.",
    "Your floors shine. Your reputation stays clean. We never mention the mop.",
    "Someone made this mess. Luckily, it's not your problem anymore.",
    "Spotless spaces. Zero gossip about how they got that way.",
    "We clean like nobody's watching. Because ideally, nobody was.",
    "Crumbs, spills, chaos — we disappear it. You keep the compliments.",
    "Professional cleaning. Unprofessional amounts of satisfaction.",
    "The bathroom looks amazing. Don't ask questions. Just book us.",
    "We scrub the evidence. You get the wow-this-place-is-spotless moment.",
    "Messy Monday? Not your worry. We were already on it.",
    "Clean enough to impress clients. Casual enough that nobody panics.",
    "Offices, hotels, storefronts — we make the mess someone else's problem.",
  ],
  food_beverage: [
    "The food is great. Pretending you cooked it yourself is optional.",
    "Hot plates. Cold drinks. Zero judgment about how hungry you look.",
    "We feed you well. You nod like you planned this all along.",
    "Fresh flavors, fast service — nobody needs to know you almost ordered takeout.",
    "Come hungry. Leave happy. Tell people you found a hidden gem.",
    "Great meal. Good vibes. We'll skip the lecture about reservations.",
    "Your table's ready. Your appetite's about to be impressed.",
    "Cooking is hard. Sitting down and enjoying this isn't.",
    "Flavor this good deserves a straight face and a second visit.",
    "We make it look easy. You make it look like your idea.",
  ],
  _default: [
    "We do the {industry} work. You take the bow.",
    "Professional {industry} service. Zero unnecessary drama.",
    "Your customers notice the results. We handle everything else.",
    "Reliable {industry} help — quietly, efficiently, on schedule.",
    "The job gets done right. You get the credit. Fair trade.",
    "Simple {industry} service that just works. No speeches required.",
    "We show up. We deliver. You look like you had it handled all along.",
    "Quality {industry} work without the runaround — book and relax.",
    "Trusted locally. Competent always. Humble about it.",
    "Your {industry} problem solved. Your reputation intact.",
    "Straightforward service. Solid results. That's the whole pitch.",
    "We make {industry} easy. You make it look effortless.",
  ],
}

/** Professional hook variants. */
const PROFESSIONAL_HOOKS = {
  janitorial: [
    "Offices, hotels, and storefronts — cleaned spotless so your space always looks its best.",
    "Commercial cleaning that keeps your space guest-ready, every day.",
    "Reliable janitorial crews for offices, retail, and hospitality properties.",
    "Deep cleans and routine service — your space stays sharp without the hassle.",
    "Professional cleaning teams that show up on schedule and leave it spotless.",
    "From floors to restrooms — commercial cleaning built for busy businesses.",
    "Keep your workspace spotless with cleaning service you can count on.",
    "Hotel-grade cleanliness for offices and storefronts in your area.",
    "Trusted janitorial service — consistent results, flexible scheduling.",
    "A cleaner space means a sharper first impression. We deliver both.",
    "Commercial cleaning done right — safe products, trained crews, clear pricing.",
    "Stop worrying about the mess. We handle cleaning so you can run the business.",
  ],
  _default: [
    "Trusted local service — simple, professional, and built around your customers.",
    "Local experts focused on results you can see and trust.",
    "Quality work with clear communication from start to finish.",
    "Professional service that fits your schedule and your budget.",
    "Reliable help — on time, on point, and easy to book.",
    "Your neighbors trust us — see why for yourself.",
    "Straightforward service without the hassle or fine print.",
    "Experienced pros who treat your project like their own.",
    "Better outcomes start with a team that actually shows up.",
    "Premium service without the premium attitude.",
    "From first call to finished job — done properly.",
    "Grow your business with support that keeps customers coming back.",
  ],
}

const SERIOUS_FUNNY_HOOKS = {
  fashion: [
    "Serious style. Silly socks. Brooklyn energy — your feet finally get the punchline.",
    "Fashion-forward neon socks — we take the look seriously, not ourselves.",
    "Bold patterns, straight faces — style that winks without trying too hard.",
    "Your outfit needed a plot twist. These socks are it.",
    "Designer-grade fun — confidence with a little chaos.",
    "We sell statement socks. The statement is: why be boring?",
    "Catwalk attitude, sidewalk price — fashion that gets the joke.",
    "Neon threads for people who dress like they mean it — but still laugh.",
    "Premium socks with a smirk built in — shop the drop.",
    "Style so bright it needs sunglasses. We're fine with that.",
    "The sock drawer upgrade you didn't know you needed — until now.",
    "Fashion meets mischief — for grown-ups who still play.",
  ],
  marketing: [
    "Your feed is loud. Your ad should be louder — in a good way.",
    "Serious strategy, silly-good scroll-stoppers — we plan both.",
    "We take the brief seriously. The thumb-stop? That's the fun part.",
    "Creative that converts — without sounding like every other ad.",
    "Your audience scrolls fast. We give them a reason to pause.",
    "Smart targeting, sharper creative — results you can actually measure.",
    "The campaign is real. The win comes faster than you'd expect.",
    "Professional ads with just enough personality to remember.",
    "We fix the boring parts. You take the credit for the spike in clicks.",
    "Solid results. The joke is how long you waited to launch this.",
    "Serious media buy, light delivery — rare combo, honestly.",
    "No jargon lecture — just ads that land with a little charm.",
  ],
  _default: [
    "We take the work seriously. The results? Surprisingly fun.",
    "No boring pitch — just proof that actually lands.",
    "Real help with a straight face and a sly wink.",
    "The problem is real. The fix is faster than you'd expect.",
    "Professional service with just enough personality to remember.",
    "We solve the headache. You look brilliantly organized.",
    "Done right — the awkward part is how simple we make it.",
    "Competent work, zero ego. Rare combo, honestly.",
    "We show up. You take the win. Everybody wins.",
    "Solid results. The joke is how long you waited to call.",
    "Serious skills, light delivery — that's the whole game.",
    "No lecture. Just results with a little charm.",
  ],
}

const WARM_HOOKS = {
  fashion: [
    "Cozy confidence — {industry} made for people who love getting dressed.",
    "Soft fabrics, bright joy — socks that feel like a hug for your feet.",
    "Welcome to {industry} that celebrates your everyday style.",
    "Friendly fits for cat lovers, creatives, and anyone who colors outside the lines.",
    "Handpicked {industry} with heart — made to make you smile each morning.",
    "Your new favorite pair is waiting — warm, bold, and unmistakably you.",
    "Community-loved {industry} — bright socks, kind service, repeat customers.",
    "Dress happy — {industry} that feels personal from first unboxing.",
    "We knit personality into every pair — gentle quality, loud color.",
    "A welcoming {industry} brand for expressive, everyday wardrobes.",
    "Comfort-first design with room for your whole playful personality.",
    "Shareable style — {industry} gifts that land with a genuine thank-you.",
  ],
  _default: [
    "Friendly service that feels like help from a neighbor.",
    "We're here when you need us — patient, kind, and on your side.",
    "Caring support from a team that listens first.",
    "Your local partner — warm welcomes and steady follow-through.",
    "Comfortable experiences start with people who genuinely care.",
    "We make it feel easy — like talking to someone you already trust.",
    "Hospitality-first — every customer treated like family.",
    "Gentle guidance, strong results — you've got a friend in this.",
    "Welcoming service for every age, budget, and busy schedule.",
    "A softer approach — same quality, more heart.",
    "Community-minded help with a smile built in.",
    "Reliable care that leaves you feeling looked after.",
  ],
}

const BOLD_HOOKS = {
  fashion: [
    "Neon now — limited {industry} drops sell out fast.",
    "Stop scrolling. Start standing out — grab the socks before they're gone.",
    "Bold feet. Bold moves. {industry} built for attention right now.",
    "This drop won't wait — claim your neon pair today.",
    "High-voltage style — {industry} for people who lead, not follow.",
    "Flash sale energy: loud socks, louder confidence — shop today.",
    "Don't blend in tomorrow — upgrade your {industry} drawer tonight.",
    "Act fast — signature {industry} pairs move quicker than you think.",
    "Your outfit's missing voltage. Fix it before the collection sells through.",
    "Demand attention — {industry} with zero apology and full color.",
    "Last call on the brightest {industry} in the drop — move now.",
    "Win the room from the ground up — bold {industry}, immediate impact.",
  ],
  _default: [
    "Act now — {industry} slots disappear faster than you think.",
    "Stop putting off {industry}. Every delay costs you.",
    "Limited availability for {industry} this week — book before it's gone.",
    "Don't settle for mediocre {industry}. Demand better today.",
    "{industry} turnaround that beats the clock — call now.",
    "Your competitors aren't waiting on {industry}. Neither should you.",
    "High-impact {industry} service — fast response, faster results.",
    "Last chance energy: secure your {industry} appointment today.",
    "Bold {industry} moves for brands ready to pull ahead now.",
    "No more excuses — expert {industry} help starts with one call.",
    "Urgent {industry} support when deadlines won't budge.",
    "Win the week with {industry} service that moves at your speed.",
  ],
}

const INSPIRATIONAL_HOOKS = {
  fashion: [
    "Step into color — {industry} for people building a braver personal style.",
    "Every outfit tells a story. Make yours impossible to ignore.",
    "Dream in neon — {industry} that reflects the creative life you're building.",
    "Believe in small details — the right socks can change your whole walk.",
    "Rise to self-expression — {industry} crafted for artists and originals.",
    "Your style journey deserves a spark — start at the feet and go up.",
    "Wear courage — {industry} for makers, movers, and cat-loving creatives.",
    "Transform the ordinary commute into a runway moment — daily.",
    "Purposeful color — {industry} that matches your ambition stitch for stitch.",
    "Shine on purpose — bold design for people becoming their best selves.",
    "The future is bright — dress like you're already living in it.",
    "Inspire your circle — {industry} worth sharing, worth remembering.",
  ],
  _default: [
    "Your next chapter in {industry} starts with one confident step.",
    "Dream bigger — we'll handle the {industry} work that gets you there.",
    "Believe in better {industry} outcomes. We build them every day.",
    "Rise to the vision — {industry} support that matches your ambition.",
    "Transform what's possible with {industry} done with purpose.",
    "Every breakthrough in {industry} begins with someone who said yes.",
    "Elevate your {industry} story — courage meets craftsmanship here.",
    "You're closer than you think — let our {industry} team guide the leap.",
    "Purpose-driven {industry} service for people building something meaningful.",
    "Shine brighter — {industry} excellence that reflects who you're becoming.",
    "The future you want needs {industry} partners who raise the bar.",
    "Inspire confidence with {industry} work that earns applause.",
  ],
}

const PLAYFUL_HOOKS = {
  fashion: [
    "Paws, patterns, and neon — {industry} for humans who still play.",
    "Life's too short for boring socks — pop on something ridiculous and great.",
    "Cat-approved chaos for your feet — {industry} with extra purr.",
    "Sock drawer party — loud colors, soft landing, instant mood boost.",
    "Wear the grin — {industry} that turns sidewalks into runways.",
    "Fun-first footwear — because your shoes deserve entertaining company.",
    "Neon cats? Neon stripes? Yes. {industry} that refuses to whisper.",
    "Bounce in color — playful {industry} for expressive everyday rebels.",
    "Tickle your outfit's funny bone — socks with main-character energy.",
    "Dress like the playlist is already on — bright {industry}, zero boredom.",
    "Collectible joy — {industry} pairs you'll want to show off immediately.",
    "Silly? Maybe. Memorable? Absolutely. Shop the {industry} drop.",
  ],
  _default: [
    "{industry} with extra sparkle — fun to book, even better to experience.",
    "Who said {industry} has to be dull? Not us. Not ever.",
    "Pop in for {industry} that feels like a good time, not a chore.",
    "Colorful {industry} energy — quick wins and happy surprises.",
    "Life's short — pick {industry} that makes you grin.",
    "Playful {industry} pros who take the work seriously, not themselves.",
    "Bounce in. Bounce out. {industry} done with flair.",
    "A little mischief, a lot of {industry} magic.",
    "Fun-first {industry} service — still professional, way less stuffy.",
    "Tickle your curiosity with {industry} worth talking about.",
    "Bright, bouncy {industry} help for brands that don't do boring.",
    "Game on — {industry} that feels fresh every single visit.",
  ],
}

const TONE_HOOK_BANKS = {
  deadpan: DEADPAN_HOOKS,
  professional: PROFESSIONAL_HOOKS,
  serious_funny: SERIOUS_FUNNY_HOOKS,
  warm: WARM_HOOKS,
  bold: BOLD_HOOKS,
  inspirational: INSPIRATIONAL_HOOKS,
  playful: PLAYFUL_HOOKS,
}

function hookVariantsForBrief(industry, adTone, company = "") {
  const key = voiceProfileKey(industry, company)
  const style = resolveToneStyle(adTone)
  const banks = TONE_HOOK_BANKS[style] || PROFESSIONAL_HOOKS
  const bank = banks[key] || banks._default
  return bank
    .map((hook) => fillIndustry(hook, industry, key))
    .filter(passesSpokenQuality)
}

export function assembleNarrationScript({ company = "", hook = "", cta = "" }) {
  const parts = []
  const co = company.trim()
  const hookLine = hook.trim()
  const hookNamesCompany = co && hookLine.toLowerCase().startsWith(co.toLowerCase())

  if (co && !hookNamesCompany) parts.push(`${co}.`)
  if (hookLine) parts.push(hookLine.endsWith(".") ? hookLine : `${hookLine}.`)
  if (cta.trim()) {
    const ctaLine = cta.trim()
    parts.push(ctaLine.endsWith(".") ? ctaLine : `${ctaLine}.`)
  }

  let script = parts.join(" ").replace(/\s+/g, " ").trim()
  script = script.replace(/\. +([a-z])/g, (_, ch) => `. ${ch.toUpperCase()}`)
  return capitalizeSentence(script).slice(0, 280)
}

/** At least 10 full spoken scripts — story hooks first, templates as backup. */
export function buildNarrationScriptVariants(brief) {
  const industry = (brief.industryCustom || brief.industry || "").trim()
  const company = (brief.companyName || brief.brandName || "").trim()
  const deadline = (brief.deadlineOffer || "").trim()
  const tone = brief.adTone || ""
  const story = storyFromBrief(brief)

  if (!industry && !story) return []

  const cta = buildVoiceCta(deadline)
  const style = resolveToneStyle(tone)

  const storyHooks = buildStoryVoiceHooks({ story, tone, company })
  const templateHooks =
    industry && storyHooks.length < 12
      ? hookVariantsForBrief(industry, tone, company).slice(0, Math.max(0, 12 - storyHooks.length))
      : industry
        ? hookVariantsForBrief(industry, tone, company)
        : []

  const orderedHooks = [
    ...storyHooks.map((hook) => ({ hook, source: "story" })),
    ...templateHooks.map((hook) => ({ hook, source: "template" })),
  ]

  const seen = new Set()
  const variants = []

  for (const { hook, source } of orderedHooks) {
    const script = assembleNarrationScript({ company, hook, cta })
    const key = script.toLowerCase()
    if (seen.has(key)) continue
    if (!passesSpokenQuality(script)) continue
    seen.add(key)
    variants.push({ style, hook, script, source })
    if (variants.length >= 12) break
  }

  return variants
}

export const MIN_NARRATION_VARIANTS = 10

/** One plain-language hook line for the industry (+ optional tone variant). */
export function getIndustryVoiceHook(industry, adTone = "") {
  const variants = buildNarrationScriptVariants({
    industryCustom: industry,
    industry,
    adTone,
  })
  if (variants.length) {
    const hook = variants[0].hook
    if (hook) return hook
  }

  const key = classifyIndustry(industry)
  const pack = HOOKS[key] || HOOKS.general
  const tone = toneKey(adTone)

  if (pack[tone]) return pack[tone]
  if (pack.default) return pack.default

  const label = industry.trim()
  return `Trusted ${label} service — simple, professional, and built around your customers.`
}

/** Short spoken CTA — keeps offers punchy for ~10s total runtime. */
export function buildVoiceCta(deadlineOffer = "") {
  const offer = deadlineOffer.trim()
  if (!offer) return "Book today."

  const pct = offer.match(/(\d+)\s*%/)
  if (offer.length > 48 || /\b20\d{2}\b/.test(offer)) {
    if (pct) return `Save ${pct[1]}% — limited time.`
    if (/free/i.test(offer)) return "Claim your free offer today."
    if (/save|off|discount/i.test(offer)) return "Ask about our current offer."
    return "Call now to get started."
  }

  const line = offer.endsWith(".") ? offer.slice(0, -1) : offer
  return `${line.charAt(0).toUpperCase()}${line.slice(1)}.`
}

/** Hint shown under the voice textarea. */
export function narrationHintForIndustry(industry, adTone = "", story = "") {
  if (!industry?.trim() && !story?.trim()) {
    return "Fill in your industry and My Story — we'll draft scripts from your story."
  }
  const key = voiceProfileKey(industry, "")
  const label = HINT_LABELS[key] || industry.trim() || "your brand"
  const toneLabel = toneStyleLabel(resolveToneStyle(adTone))
  if (story.trim().length >= 30) {
    return `${toneLabel} ideas from your My Story — browse ${MIN_NARRATION_VARIANTS}+ options, then pick one.`
  }
  if (isDeadpanTone(adTone)) {
    return `${toneLabel} script ideas for ${label} — browse ${MIN_NARRATION_VARIANTS}+ options, then pick one.`
  }
  return `${toneLabel} script ideas for ${label} — add My Story for sharper lines.`
}

/** All supported voice profile keys (for tests / docs). */
export const VOICE_PROFILE_COUNT = Object.keys(HOOKS).length - 1
