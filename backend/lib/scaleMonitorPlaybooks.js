/**
 * Exact step-by-step upgrade playbooks for the admin Scale Monitor.
 * Written in plain language — no jargon.
 */

function fmtUsd(n) {
  return `$${Math.round(n).toLocaleString("en-US")}`
}

function tierSteps({ serviceLabel, portalUrl, portalLabel, planName, planCost, envVar, envFile, extraSteps = [] }) {
  const steps = [
    `Open ${portalLabel}: ${portalUrl}`,
    `Sign in with the account you use for NEONSOX.`,
    `Go to Billing or Subscription.`,
    `Select the ${planName} plan (${planCost}).`,
    `Complete payment and wait for the confirmation email.`,
  ]
  if (envVar) {
    steps.push(`If your API key changed, copy the new key from the developer settings page.`)
    steps.push(`Open ${envFile} on your computer and update ${envVar}= with the new key.`)
    steps.push(`Save the file, then restart the backend server (close the terminal window and run node server.js again).`)
  }
  steps.push(`Come back here and tap each step below, then press CONFIRM UPGRADE COMPLETE.`)
  extraSteps.forEach((s, i) => steps.splice(steps.length - 1 - extraSteps.length + i, 0, s))
  return steps.map((text, i) => ({ number: i + 1, text }))
}

function spendSteps({ serviceLabel, portalUrl, portalLabel, amount, budgetLine, envVar, envFile }) {
  return [
    { number: 1, text: `Open ${portalLabel}: ${portalUrl}` },
    { number: 2, text: `Sign in to your ${serviceLabel} account.` },
    { number: 3, text: `Go to Billing, Credits, or Usage.` },
    { number: 4, text: `Your estimated spend this month is about ${fmtUsd(amount)}. Add credits or raise your budget to at least ${budgetLine}.` },
    { number: 5, text: `Complete the purchase and save your receipt for your records.` },
    ...(envVar
      ? [
          { number: 6, text: `If keys changed, update ${envVar} in ${envFile} and restart the backend server.` },
          { number: 7, text: `Generate one test video from the Dashboard to confirm credits are working.` },
          { number: 8, text: `Mark each step done below, then press CONFIRM UPGRADE COMPLETE.` },
        ]
      : [
          { number: 6, text: `Mark each step done below, then press CONFIRM UPGRADE COMPLETE.` },
        ]),
  ]
}

export function getServicePlaybook(serviceId, ctx) {
  const { subscribers, level, nextPlan, upgradeAtSubs, estimatedMonthlyUsd, generations, posts } = ctx

  if (level === "ok") {
    return {
      summary: "No action needed — you're under the threshold.",
      steps: [{ number: 1, text: "Nothing to do right now. Check back when your member count grows." }],
    }
  }

  const playbooks = {
    elevenlabs: () => {
      const plan = nextPlan || "the next higher plan"
      return {
        summary: `Upgrade ElevenLabs to ${plan} before you pass ${upgradeAtSubs?.toLocaleString()} paying members.`,
        steps: tierSteps({
          serviceLabel: "ElevenLabs",
          portalUrl: "https://elevenlabs.io",
          portalLabel: "ElevenLabs",
          planName: plan.replace(/\s*\(.*\)/, ""),
          planCost: plan.match(/\([^)]+\)/)?.[0]?.slice(1, -1) || "see pricing page",
          envVar: "ELEVENLABS_API_KEY",
          envFile: "backend/.env",
          extraSteps: [
            `You currently have ${subscribers.toLocaleString()} paying members. The next tier kicks in around ${upgradeAtSubs?.toLocaleString()} members.`,
          ],
        }),
      }
    },

    runway: () => ({
      summary: `Add Runway video credits now — estimated API spend is ${fmtUsd(estimatedMonthlyUsd)}/month at your current member count.`,
      steps: spendSteps({
        serviceLabel: "Runway",
        portalUrl: "https://dev.runwayml.com",
        portalLabel: "Runway Developer Portal",
        amount: estimatedMonthlyUsd,
        budgetLine: fmtUsd(Math.ceil(estimatedMonthlyUsd * 1.25)),
        envVar: "RUNWAY_API_KEY",
        envFile: "backend/.env",
      }).concat([
        {
          number: 9,
          text: `You need enough credits for about ${Math.round(generations).toLocaleString()} video generations per month (3.5 tries × 35% of members buying campaigns).`,
        },
      ]),
    }),

    "supabase-db": () => ({
      summary: `Upgrade Supabase to Team/Enterprise ($599+/mo) before you reach 10,000 paying members. You are at ${subscribers.toLocaleString()} now.`,
      steps: [
        { number: 1, text: "Open https://supabase.com/dashboard in your browser." },
        { number: 2, text: "Click your NEONSOX project." },
        { number: 3, text: "Go to Project Settings (gear icon) → Billing." },
        { number: 4, text: "Click Upgrade and choose Team or Enterprise ($599/month or higher)." },
        { number: 5, text: "Enter payment details and confirm the upgrade." },
        { number: 6, text: "No code changes are required — your SUPABASE_URL and keys stay the same." },
        { number: 7, text: "Mark each step done below, then press CONFIRM UPGRADE COMPLETE." },
      ],
    }),

    storage: () => ({
      summary: `Increase video and asset storage — upgrade around ${upgradeAtSubs?.toLocaleString()} members (currently ${subscribers.toLocaleString()}).`,
      steps: [
        { number: 1, text: "Open https://supabase.com/dashboard → your project → Storage." },
        { number: 2, text: "Check how full your bucket is under Storage usage." },
        { number: 3, text: "Go to Settings → Billing and raise your plan or add storage add-ons." },
        { number: 4, text: "If clips are mostly on your backend server, upgrade that host's disk size in your hosting dashboard (Railway, Render, or VPS provider)." },
        { number: 5, text: "Delete old test videos from backend/tmp/media if you need space immediately." },
        { number: 6, text: "Mark each step done below, then press CONFIRM UPGRADE COMPLETE." },
      ],
    }),

    compute: () => ({
      summary: `Scale your backend server for video processing — target upgrade around ${upgradeAtSubs?.toLocaleString()} members.`,
      steps: [
        { number: 1, text: "Open the dashboard where your backend runs (Railway, Render, Fly.io, or your VPS provider)." },
        { number: 2, text: "Find the NEONSOX backend service (the one running node server.js)." },
        { number: 3, text: "Upgrade to the next CPU/RAM tier — video and voice processing needs more power as members grow." },
        { number: 4, text: "Redeploy or restart the service after upgrading." },
        { number: 5, text: "Run one test campaign (generate + voice + text overlay) to confirm it still works." },
        { number: 6, text: "Mark each step done below, then press CONFIRM UPGRADE COMPLETE." },
      ],
    }),

    vercel: () => ({
      summary: `Raise your Vercel hosting plan before traffic spikes past ${upgradeAtSubs?.toLocaleString()} members.`,
      steps: [
        { number: 1, text: "Open https://vercel.com/dashboard" },
        { number: 2, text: "Select your NEONSOX frontend project." },
        { number: 3, text: "Go to Settings → Billing → Change plan." },
        { number: 4, text: `Upgrade to ${nextPlan || "Pro with extra bandwidth"} (${nextPlan?.match(/\([^)]+\)/)?.[0]?.slice(1, -1) || "see pricing"}).` },
        { number: 5, text: "Confirm payment — your site redeploys automatically, no code changes needed." },
        { number: 6, text: "Mark each step done below, then press CONFIRM UPGRADE COMPLETE." },
      ],
    }),

    "auth-mau": () => ({
      summary: `Budget for Supabase Auth overages — you are approaching 100,000 monthly active users (${subscribers.toLocaleString()} paying members now).`,
      steps: [
        { number: 1, text: "Open https://supabase.com/dashboard → your project → Settings → Billing." },
        { number: 2, text: "Review Auth MAU usage under Usage." },
        { number: 3, text: "Add budget for ~$65/month MAU overage or upgrade to a plan with higher included MAU." },
        { number: 4, text: "Set a billing alert email in Supabase so you get warned before overages surprise you." },
        { number: 5, text: "Mark each step done below, then press CONFIRM UPGRADE COMPLETE." },
      ],
    }),

    egress: () => ({
      summary: `Increase bandwidth budget — video downloads will cost more as you pass ${upgradeAtSubs?.toLocaleString()} members.`,
      steps: [
        { number: 1, text: "Open Supabase dashboard → Settings → Usage and check egress/bandwidth." },
        { number: 2, text: "Open your Vercel dashboard → Usage and check bandwidth there too." },
        { number: 3, text: "Upgrade whichever service is closest to its limit." },
        { number: 4, text: "Optional: enable video CDN caching later to reduce repeat downloads." },
        { number: 5, text: "Mark each step done below, then press CONFIRM UPGRADE COMPLETE." },
      ],
    }),

    reddit: () => ({
      summary:
        level === "overdue"
          ? `You have ${subscribers.toLocaleString()} members — subscribe to Reddit's commercial API ($1,000/mo) before enabling Reddit posts.`
          : `Plan ahead: at ${upgradeAtSubs} members you'll need Reddit's commercial API ($1,000/mo).`,
      steps: [
        { number: 1, text: "Open https://www.reddit.com/dev/api/ and read the commercial API terms." },
        { number: 2, text: "Apply for Reddit commercial API access with your business details." },
        { number: 3, text: "When approved, subscribe at $1,000/month." },
        { number: 4, text: "Save API credentials securely — do NOT put them in frontend code." },
        { number: 5, text: "Add Reddit API keys to backend/.env when posting is wired up (ask your developer)." },
        { number: 6, text: "Do NOT turn on Reddit posting in the app until this is paid and configured." },
        { number: 7, text: "Mark each step done below, then press CONFIRM UPGRADE COMPLETE." },
      ],
    }),

    "x-api": () => ({
      summary: `Add budget for X posting — estimated ${fmtUsd(estimatedMonthlyUsd)}/month at current volume.`,
      steps: [
        { number: 1, text: "Open https://developer.x.com and sign in." },
        { number: 2, text: "Go to your app → Billing or purchase post credits." },
        { number: 3, text: `Add enough credits for about ${Math.round(posts * 0.25).toLocaleString()} X posts per month (~${fmtUsd(estimatedMonthlyUsd)}).` },
        { number: 4, text: "Set a spending cap or alert if X offers one." },
        { number: 5, text: "Do NOT enable X posting in NEONSOX until posting is wired and credits are loaded." },
        { number: 6, text: "Mark each step done below, then press CONFIRM UPGRADE COMPLETE." },
      ],
    }),

    "unified-social": () => ({
      summary: `Budget for Bluesky, Telegram, Discord, and TikTok posting — estimated ${fmtUsd(estimatedMonthlyUsd)}/month.`,
      steps: [
        { number: 1, text: "List which social platforms you will launch first (Bluesky, Telegram, Discord, TikTok)." },
        { number: 2, text: "For each platform, create a developer account and note the monthly API cost." },
        { number: 3, text: `Budget at least ${fmtUsd(Math.ceil(estimatedMonthlyUsd * 1.2))}/month for ~${Math.round(posts * 0.75).toLocaleString()} posts across those platforms.` },
        { number: 4, text: "Save all API keys in backend/.env only — never in the frontend." },
        { number: 5, text: "Do NOT enable posting buttons until keys are configured and tested." },
        { number: 6, text: "Mark each step done below, then press CONFIRM UPGRADE COMPLETE." },
      ],
    }),
  }

  const fn = playbooks[serviceId]
  if (!fn) {
    return {
      summary: "Review this service and upgrade before member count grows further.",
      steps: [{ number: 1, text: "Contact your hosting provider and raise the plan for this service." }],
    }
  }
  return fn()
}

export function serviceAlertKey(service) {
  return `${service.id}:${service.upgradeAtSubs ?? service.nextPlan ?? service.level}`
}
