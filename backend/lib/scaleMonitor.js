import { getServicePlaybook } from "./scaleMonitorPlaybooks.js"

export const COST_MODEL = {
  membershipPrice: 9.99,
  avgCampaignPrice: 149,
  campaignsPerSubscriber: 0.35,
  gensPerCampaign: 3.5,
  costPerGeneration: 1.35,
  postsPerCampaign: 100,
  xPostShare: 0.25,
  xCostPerPost: 0.18,
  unifiedCostPer1kPosts: 8.5,
  unifiedPostShare: 0.75,
  redditMonthly: 1000,
}

export const SUBSCRIBER_MILESTONES = [100, 1_000, 5_000, 10_000, 100_000]

function effectiveCampaigns(subscribers) {
  return subscribers * COST_MODEL.campaignsPerSubscriber
}

function estimatedGenerations(subscribers) {
  return effectiveCampaigns(subscribers) * COST_MODEL.gensPerCampaign
}

function estimatedPosts(subscribers) {
  return effectiveCampaigns(subscribers) * COST_MODEL.postsPerCampaign
}

function estimatedRunwayApiSpend(subscribers) {
  return estimatedGenerations(subscribers) * COST_MODEL.costPerGeneration
}

function estimatedXApiSpend(subscribers) {
  const posts = estimatedPosts(subscribers)
  return posts * COST_MODEL.xPostShare * COST_MODEL.xCostPerPost
}

function estimatedUnifiedSocialSpend(subscribers) {
  const posts = estimatedPosts(subscribers)
  return posts * COST_MODEL.unifiedPostShare * (COST_MODEL.unifiedCostPer1kPosts / 1000)
}

function pickTier(tiers, subscribers) {
  for (let i = 0; i < tiers.length; i++) {
    if (subscribers <= tiers[i].maxSubs) {
      return { current: tiers[i], next: tiers[i + 1] || null, index: i }
    }
  }
  return { current: tiers[tiers.length - 1], next: null, index: tiers.length - 1 }
}

/** @returns {'ok'|'watch'|'overdue'} — yellow at 75%+, red at/past threshold */
function alertLevel(subscribers, upgradeAt) {
  if (upgradeAt == null) return "ok"
  if (subscribers >= upgradeAt) return "overdue"
  const watchAt = Math.max(1, Math.floor(upgradeAt * 0.75))
  if (subscribers >= watchAt) return "watch"
  return "ok"
}

/** @returns {'ok'|'watch'|'overdue'} */
function spendAlertLevel(amount, upgradeAt) {
  if (amount >= upgradeAt) return "overdue"
  if (amount >= upgradeAt * 0.75) return "watch"
  return "ok"
}

function tierMessage(serviceName, subscribers, current, next, upgradeAt) {
  const level = alertLevel(subscribers, upgradeAt)
  const headroom = upgradeAt != null ? Math.max(0, upgradeAt - subscribers) : null

  if (level === "overdue") {
    return `You have ${subscribers.toLocaleString()} paying members — upgrade ${serviceName} NOW (at or past the ${upgradeAt?.toLocaleString()} member threshold).`
  }
  if (level === "watch") {
    return `You're at 75%+ of the next threshold — ${headroom?.toLocaleString()} members until ${serviceName} needs ${next?.plan || "a higher plan"}. Time to plan.`
  }
  return `No action needed — you're under the threshold. On ${current.plan}${headroom != null ? ` with ~${headroom.toLocaleString()} members of headroom` : ""}.`
}

function spendMessage(serviceName, amount, upgradeAt) {
  const level = spendAlertLevel(amount, upgradeAt)
  const fmt = (n) => `$${Math.round(n).toLocaleString("en-US")}/mo`

  if (level === "overdue") {
    return `Estimated ${serviceName} spend is ${fmt(amount)} — at or past your ${fmt(upgradeAt)} limit. Upgrade NOW.`
  }
  if (level === "watch") {
    return `Estimated ${serviceName} spend is ${fmt(amount)} — at 75%+ of your ${fmt(upgradeAt)} budget. Time to plan.`
  }
  return `No action needed — estimated ${serviceName} spend is ${fmt(amount)}, under your threshold.`
}

function attachPlaybook(base, ctx) {
  const playbook = getServicePlaybook(base.id, ctx)
  return { ...base, playbookSummary: playbook.summary, steps: playbook.steps }
}

function buildTierService(id, name, category, tiers, subscribers, extra = {}) {
  const { current, next } = pickTier(tiers, subscribers)
  const upgradeAt = next?.upgradeAt ?? null
  const level = alertLevel(subscribers, upgradeAt)

  const base = {
    id,
    name,
    category,
    kind: "tier",
    level,
    currentPlan: current.plan,
    nextPlan: next?.plan || null,
    upgradeAtSubs: upgradeAt,
    headroomSubs: upgradeAt != null ? Math.max(0, upgradeAt - subscribers) : null,
    estimatedMonthlyUsd: current.cost ?? null,
    message: tierMessage(name, subscribers, current, next, upgradeAt),
    action: next?.action || current.action || null,
    ...extra,
  }

  return attachPlaybook(base, {
    subscribers,
    level,
    nextPlan: base.nextPlan,
    upgradeAtSubs: upgradeAt,
    estimatedMonthlyUsd: base.estimatedMonthlyUsd,
    generations: extra.generations,
    posts: extra.posts,
  })
}

function buildSpendService(id, name, category, amount, _watchAt, upgradeAt, extra = {}) {
  const level = spendAlertLevel(amount, upgradeAt)
  const base = {
    id,
    name,
    category,
    kind: "spend",
    level,
    currentPlan: "Pay as you go",
    nextPlan: null,
    upgradeAtSubs: null,
    headroomSubs: null,
    estimatedMonthlyUsd: Math.round(amount),
    spendThresholdUsd: upgradeAt,
    message: spendMessage(name, amount, upgradeAt),
    action: extra.action || null,
    ...extra,
  }

  return attachPlaybook(base, {
    subscribers: extra.subscribers,
    level,
    nextPlan: null,
    upgradeAtSubs: null,
    estimatedMonthlyUsd: Math.round(amount),
    generations: extra.generations,
    posts: extra.posts,
  })
}

/**
 * @param {{ members: number, campaignBuyers: number, totalProfiles: number }} counts
 */
export function evaluateScaleMonitor(counts) {
  const subscribers = Math.max(0, counts.members || 0)
  const campaignBuyers = Math.max(0, counts.campaignBuyers || 0)
  const totalProfiles = Math.max(0, counts.totalProfiles || 0)

  const campaigns = effectiveCampaigns(subscribers)
  const generations = estimatedGenerations(subscribers)
  const posts = estimatedPosts(subscribers)
  const runwaySpend = estimatedRunwayApiSpend(subscribers)
  const xSpend = estimatedXApiSpend(subscribers)
  const unifiedSpend = estimatedUnifiedSocialSpend(subscribers)

  const services = [
    buildTierService("elevenlabs", "ElevenLabs voice plan", "AI & media", [
      { maxSubs: 100, plan: "Starter (~$22/mo)", cost: 22, action: "Upgrade to Creator when narration volume grows." },
      { maxSubs: 5_000, plan: "Creator (~$99/mo)", cost: 99, upgradeAt: 5_001, action: "Move to Pro for higher character limits." },
      { maxSubs: 10_000, plan: "Pro (~$299/mo)", cost: 299, upgradeAt: 10_001, action: "Move to Scale for enterprise limits." },
      { maxSubs: Infinity, plan: "Scale (~$990/mo)", cost: 990, action: null },
    ], subscribers),

    buildSpendService(
      "runway",
      "Runway video credits",
      "AI & media",
      runwaySpend,
      150,
      500,
      {
        action: "Buy more Runway API credits before the next campaign wave.",
        usageNote: `~${Math.round(generations).toLocaleString()} generations/mo at current attach rate`,
        subscribers,
        generations,
        posts,
      }
    ),

    buildTierService("supabase-db", "Supabase database", "Infrastructure", [
      { maxSubs: 9_999, plan: "Pro ($25/mo)", cost: 25, action: "Fine until you pass ~10K active members." },
      { maxSubs: Infinity, plan: "Team / Enterprise ($599+/mo)", cost: 599, upgradeAt: 10_000, action: "Upgrade Supabase before DB limits or support needs jump." },
    ], subscribers),

    buildTierService("storage", "Video & asset storage", "Infrastructure", [
      { maxSubs: 100, plan: "Light (~$5/mo)", cost: 5 },
      { maxSubs: 1_000, plan: "Growing (~$15/mo)", cost: 15, upgradeAt: 1_001, action: "Add storage or CDN tier as clip library grows." },
      { maxSubs: 5_000, plan: "Busy (~$55/mo)", cost: 55, upgradeAt: 5_001 },
      { maxSubs: 10_000, plan: "Heavy (~$86/mo)", cost: 86, upgradeAt: 10_001 },
      { maxSubs: Infinity, plan: "Large scale (~$500/mo)", cost: 500, upgradeAt: 100_001 },
    ], subscribers),

    buildTierService("compute", "Backend & video processing", "Infrastructure", [
      { maxSubs: 100, plan: "Starter (~$15/mo)", cost: 15 },
      { maxSubs: 1_000, plan: "Small (~$40/mo)", cost: 40, upgradeAt: 1_001, action: "Scale server/CPU for ffmpeg and API traffic." },
      { maxSubs: 5_000, plan: "Medium (~$110/mo)", cost: 110, upgradeAt: 5_001 },
      { maxSubs: 10_000, plan: "Large (~$210/mo)", cost: 210, upgradeAt: 10_001 },
      { maxSubs: Infinity, plan: "Enterprise (~$960/mo)", cost: 960, upgradeAt: 100_001 },
    ], subscribers),

    buildTierService("vercel", "Frontend hosting (Vercel)", "Infrastructure", [
      { maxSubs: 5_000, plan: "Pro ($20/mo)", cost: 20 },
      { maxSubs: 10_000, plan: "Pro + bandwidth ($50/mo)", cost: 50, upgradeAt: 5_001, action: "Raise Vercel plan when traffic spikes." },
      { maxSubs: Infinity, plan: "High traffic ($200/mo)", cost: 200, upgradeAt: 10_001 },
    ], subscribers),

    buildTierService("auth-mau", "Supabase Auth (MAU)", "Infrastructure", [
      { maxSubs: 99_999, plan: "Included in Pro", cost: 0 },
      { maxSubs: Infinity, plan: "MAU overage (~$65/mo)", cost: 65, upgradeAt: 100_000, action: "Budget for auth overages above 100K monthly active users." },
    ], subscribers),

    buildTierService("egress", "Bandwidth / egress", "Infrastructure", [
      { maxSubs: 100, plan: "Minimal ($0/mo)", cost: 0 },
      { maxSubs: 1_000, plan: "Light (~$5/mo)", cost: 5, upgradeAt: 101 },
      { maxSubs: 5_000, plan: "Moderate (~$15/mo)", cost: 15, upgradeAt: 1_001 },
      { maxSubs: 10_000, plan: "Heavy (~$35/mo)", cost: 35, upgradeAt: 5_001 },
      { maxSubs: Infinity, plan: "Very heavy (~$185/mo)", cost: 185, upgradeAt: 10_001 },
    ], subscribers),

    buildTierService("reddit", "Reddit commercial API", "Social posting", [
      { maxSubs: 499, plan: "Not active yet ($0)", cost: 0, action: "Wait until ~500 members before turning on Reddit posting." },
      { maxSubs: Infinity, plan: "Commercial API ($1,000/mo)", cost: 1000, upgradeAt: 500, action: "Subscribe to Reddit's commercial API before enabling Reddit posts." },
    ], subscribers),

    buildSpendService(
      "x-api",
      "X (Twitter) posting",
      "Social posting",
      xSpend,
      25,
      75,
      {
        action: "Monitor X API spend as post volume grows.",
        usageNote: `~${Math.round(posts * COST_MODEL.xPostShare).toLocaleString()} X posts/mo (estimated)`,
        subscribers,
        generations,
        posts,
      }
    ),

    buildSpendService(
      "unified-social",
      "Bluesky · Telegram · Discord · TikTok",
      "Social posting",
      unifiedSpend,
      40,
      120,
      {
        action: "Budget for unified social posting APIs when campaigns go live.",
        usageNote: `~${Math.round(posts * COST_MODEL.unifiedPostShare).toLocaleString()} posts/mo (estimated)`,
        subscribers,
        generations,
        posts,
      }
    ),
  ]

  const alertCounts = {
    overdue: services.filter((s) => s.level === "overdue").length,
    watch: services.filter((s) => s.level === "watch").length,
    ok: services.filter((s) => s.level === "ok").length,
  }

  const nextMilestone =
    SUBSCRIBER_MILESTONES.find((m) => m > subscribers) || SUBSCRIBER_MILESTONES[SUBSCRIBER_MILESTONES.length - 1]
  const prevMilestone =
    [...SUBSCRIBER_MILESTONES].reverse().find((m) => m <= subscribers) || 0
  const milestoneProgress =
    nextMilestone > prevMilestone
      ? Math.min(100, Math.round(((subscribers - prevMilestone) / (nextMilestone - prevMilestone)) * 100))
      : 100

  const overallLevel =
    alertCounts.overdue > 0 ? "overdue" : alertCounts.watch > 0 ? "watch" : "ok"

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      members: subscribers,
      campaignBuyers,
      totalProfiles,
    },
    projections: {
      effectiveCampaignsPerMonth: Math.round(campaigns * 10) / 10,
      estimatedGenerationsPerMonth: Math.round(generations * 10) / 10,
      estimatedPostsPerMonth: Math.round(posts),
      estimatedRunwayApiUsd: Math.round(runwaySpend),
      estimatedXApiUsd: Math.round(xSpend * 100) / 100,
      estimatedUnifiedSocialUsd: Math.round(unifiedSpend * 100) / 100,
    },
    milestone: {
      current: subscribers,
      previous: prevMilestone,
      next: nextMilestone,
      progressPercent: milestoneProgress,
    },
    overallLevel,
    alertCounts,
    services: services.sort((a, b) => {
      const rank = { overdue: 0, watch: 1, ok: 2 }
      return rank[a.level] - rank[b.level] || a.name.localeCompare(b.name)
    }),
  }
}

export async function fetchSubscriberCounts(supabase) {
  const [membersRes, campaignRes, totalRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("has_membership", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("has_campaign", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ])

  if (membersRes.error) throw new Error(membersRes.error.message)
  if (campaignRes.error) throw new Error(campaignRes.error.message)
  if (totalRes.error) throw new Error(totalRes.error.message)

  return {
    members: membersRes.count ?? 0,
    campaignBuyers: campaignRes.count ?? 0,
    totalProfiles: totalRes.count ?? 0,
  }
}
