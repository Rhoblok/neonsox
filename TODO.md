# NEONSOX — To-Do

_Last updated: 2026-07-13 (hyperlocal geo-targeting + trend engine master plan)_

## Product focus (locked)
- Subscribers **download the ad** and post/run campaigns **anywhere they choose** (including Meta, on their own — **NEONSOX does not integrate Meta/Facebook/Instagram**).
- NEONSOX differentiator: **trend-aware timing + metrics + strategic outlook** — ride public conversation waves, then post the right ad at the right moment.
- Social **Post to** buttons: only where clear API path grants **real per-user posting rights**.
- Build in **delicate steps** — each phase must work end-to-end before the next (IVF model: test viability per embryo).

---

## ✅ Done (Palette Studio + Admin)
- [x] Full ad pipeline: Runway clip → voice & music → Palette Editor text overlay
- [x] Voice tone + Male/Female gender (single brand voice from `.env`)
- [x] Music volume slider + full clip length fix
- [x] Editable Company Name in Palette Editor + Skip (optional) for Step 6
- [x] Export to Socials Tray → scroll + left-column tray with big preview
- [x] Social platform selectors under exported ad
- [x] Download or copy link for exported ad from tray
- [x] UI polish: short labels, smaller buttons, removed Live summary sidebar
- [x] Server startup / port-in-use messaging
- [x] **6-step studio labels** — all steps visible, blink until done
- [x] **Admin Scale Monitor** — subscriber thresholds, playbooks, confirm + localStorage
- [x] **Supa-Pulse** — admin login + `/admin` Ping → `POST /api/admin/supabase-ping`

### Cloud clips + cross-device
- [x] `docs/supabase-studio-cloud.sql` — `studio_states` table + `campaign-clips` bucket
- [x] Backend uploads clips after generate / mix / overlay (`clipCloudStorage.js`)
- [x] Frontend syncs studio state + Socials Tray to Supabase when logged in
- [x] Playback prefers cloud URLs (works across devices)

### Accessibility (baseline)
- [x] `prefers-reduced-motion` — step blink uses underline instead of animation
- [x] Global `:focus-visible` rings + screen-reader-only utility class
- [x] Dashboard tab ARIA (`tablist` / `tab` / `tabpanel`)
- [x] Studio step progress — `nav`, ordered list, `aria-current="step"`

### Stability fixes (Jul 12)
- [x] Campaign lock flash on refresh — gate palette on `profileReady` + `campaignReady`
- [x] Studio hydration guard — no lock banner until cloud sync matches campaign key
- [x] Text overlay flash duration — `flashSeconds` (2/4/6s on screen, not start time)
- [x] Smoke checks — `npm run smoke` at repo root

### Editor Tray (Dashboard tab 3 — **Editing Bay**)
- [x] **Editing Bay** tab — left **Cut Room** + right **Preview monitor**
- [x] Stitch videos, upload music/voice, import from Socials Tray or studio tries
- [x] Multi-select studio tries + multi-file video upload
- [x] Neon glow UI pass on Cut Room
- [x] Drag-and-drop **Editing Bay timeline** under preview (Music / Video / Voice / SFX / Foley / ADR)
- [x] Music licensing — subscribers pick **NEONSOX library only**; admin may upload custom beds
- [x] Creator Music gate designed (Profile ack + grant + fingerprint + admin review) — **self-serve uploads PAUSED**
- [ ] Re-enable self-serve creator uploads + AudD when ready for contributors
- [ ] Ship official NEONSOX bed audio files into `NEONSOX_MUSIC_LIBRARY` urls
- [ ] **Special effects** render path — Runway / Pika API (lane UI ready)
- [ ] **ADR** render path — ElevenLabs dub (lane UI ready)
- [ ] **Foley** render path — ElevenLabs SFX (lane UI ready)
- [ ] Editor project sync to Supabase (localStorage only today)
- [ ] Trim handles on timeline clips (v2)

**Creator music library:** Self-serve uploads **paused**. Subscribers = NEONSOX library only. Custom beds via email to founder → admin approve/upload. SQL + API remain for later (`docs/supabase-creator-music.sql`). AudD trial not required right now.

---

## 🔜 Next

### Campaign & billing
- [x] Finish Supabase toggle test (Chunks 5–6 from prior list) — see RUN.md §3 + `docs/supabase-profiles.sql` + `backend/scripts/check-profile.mjs`
- [ ] **Stripe checkout test (local)** — backend + frontend running → Pricing → Subscribe → Success page confirms automatically (RUN.md §3). **No Stripe CLI required.**
- [ ] Real Stripe webhook (production) — Stripe Dashboard webhook URL → `/api/webhook` (backup; optional for local)
- [x] Pricing: show “Active” / disable Subscribe when already subscribed

### Socials Tray — posting (locked order)

**Rule:** Every platform must grant **real per-user posting rights** before we call it done (no founder `.env` shortcuts in production).

**Done (dev only):** Telegram posts via founder `TELEGRAM_*` in `.env` — proves pipeline, not subscriber product.

#### Session 1 — Telegram BYO bot wizard
- [ ] Run `docs/supabase-social-connections.sql` if not done
- [ ] 3-step wizard UI (Member + Socials Tray): “requires 3 extra steps”
  - Step 1: Guided BotFather (`/newbot`) — **their** bot
  - Step 2: Paste **their** bot token → encrypt in `social_connections`
  - Step 3: Add bot as admin on **their** channel → verify `channel_id`
- [ ] Refactor post adapter: read per-user token + channel from DB (not `.env`)
- [ ] `POST /api/social/telegram/link` + disconnect
- [ ] Post disabled until linked; Member shows real connection count

#### Session 2 — Bluesky
- [ ] User: Settings → App password at bsky.app
- [ ] Connect UI: handle + app password (guided, one-time)
- [ ] `adapters/bluesky.js` — post video + caption to **their** account
- [ ] `test-bluesky.mjs` → Socials Tray **Post to bluesky**

#### Session 3 — reddit
- [ ] Reddit OAuth — user connects **their** account
- [ ] Market map → suggested subreddits (`r/Germany`, `r/india`, etc.)
- [ ] Subreddit picker on post (with “check sub rules” note)
- [ ] `adapters/reddit.js` — submit to chosen sub
- [ ] Caption helper: less spammy, local-business tone

**After all three:** tier post quotas, `social_posts` history, honest Pricing/Member copy.

**Groundwork already in repo:** `backend/lib/social/`, `socialRoutes.js`, `socialApi.js`, `SocialsTrayPanel.jsx` Post UI.

---

### Trend engine — “ride the wave” (master plan, post-connect)

**You can build this.** Platform **For You** algorithms are proprietary; **public trend + text data** is not. NEONSOX listens → scores sentiment/urgency → triggers **subscriber-owned** posts (organic first).

**Two different mechanisms (do not mix in marketing):**

| Type | What it is | NEONSOX phase |
|------|------------|---------------|
| **Organic post** | Video/caption to connected account (Telegram, Bluesky, reddit) | **Phase A** — core product |
| **Paid ad toggle** | Flip pre-approved Reddit/TikTok/Google campaign PAUSED → ACTIVE | **Phase C** — optional later |

**Excluded forever:** Meta / Instagram / Facebook APIs (ads or organic automation).

#### Phase A — Trend listener + auto organic post (NEONSOX-owned, JS/Node)
_Prerequisite: Sessions 1–3 (connect + post works per user)._

- [ ] `backend/lib/trends/` — ingestion adapters (start with **reddit** + **Google Trends**; add X if API budget allows)
- [ ] `trend_watchers` table — subscriber keywords, industry, linked `campaign_key`, target subreddits from market map
- [ ] `node-cron` job (e.g. every 15–30 min) — fetch mentions/posts for tracked keywords
- [ ] Sentiment + urgency score — start `sentiment` npm or LLM mini-classifier (“positive / urgent 1–10”)
- [ ] Spike rule — volume up + sentiment above threshold → **auto `POST /api/social/post`** using that user’s connection
- [ ] Subscriber controls — keyword list, min score, cooldown (no flip-flop every hour), max posts/day
- [ ] Dashboard — replace mock Speedometer/Trends with **real watcher status** (“Watching r/Germany · eco socks · last spike 2h ago”)

**Best platforms for Phase A (organic + listening):**

| Platform | Trend / listen data | Auto organic post | Notes |
|----------|---------------------|-------------------|--------|
| **reddit** | Excellent — subreddit posts, search API | Yes (Session 3) | r/Germany, r/india = location proxy |
| **Bluesky** | Good — public firehose/search (AT Protocol) | Yes (Session 2) | Growing, no Meta |
| **Telegram** | Channel analytics limited | Yes (wizard) | Trends via keywords in channels user owns |
| **Google Trends** | Excellent — search intent before social | N/A (listen only) | Free; feeds spike detection |
| **X** | Good trends API | Possible | **Expensive** API tiers — phase later |
| **TikTok** | Trends tools exist | Organic post needs audit | Hard; paid toggle separate |

#### Phase B — Insights UI (subscriber-facing, plain English)
- [ ] “Why we posted now” — one sentence when auto-trigger fires
- [ ] “Wait” / “Pause watcher” — subscriber override
- [ ] Link trend spike to **their** exported ad in Socials Tray (pre-staged, not generated on the fly)

#### Phase C — Paid ad PAUSED → ACTIVE (optional, no Meta)
_Only after organic loop proven. Subscriber creates ad **on Reddit/TikTok/Google natively**, keeps PAUSED; NEONSOX flips ACTIVE on spike._

- [ ] Reddit Ads API — `configured_status` ACTIVE/PAUSED
- [ ] TikTok Marketing API — `operation_status` ENABLE/DISABLE
- [ ] Google Ads API — campaign ENABLED/PAUSED
- [ ] Strict lifetime budgets on native platforms (guardrail against runaway spend)
- [ ] Min 24–48h active window once triggered (avoid learning-phase churn)

**Not proprietary:** keyword volume, public posts, Google Trends, sentiment on public text.  
**Proprietary:** TikTok FYP ranking, Instagram feed — we **do not** need those to time **organic** posts.

---

### Hyperlocal geo-targeting — “lunch rush in Bangalore” (master plan)

**Yes — geographic targeting is fully possible** without Meta. Ad networks let you restrict delivery to states, cities, or metro areas. NEONSOX combines **where** (geo) + **when** (time window) + **what people are saying** (sentiment) to flip the right pre-staged campaign or organic post.

**Example use case (India food courier):** A bike-based team-lunch courier launching in India listens for corporate lunch intent in Maharashtra vs Karnataka, runs only 11:00–13:30 IST, and activates Mumbai or Bangalore campaigns when localized chatter spikes — showcasing the new service at peak need.

**What we do NOT do:** GPS tracking of individuals. We target **ad groups / organic posts mapped to cities** using public regional data + subscriber-declared markets (already on market map).

#### Geo listeners (how to isolate regional lunch / local intent)

| Source | Geo signal | Example (India courier) |
|--------|------------|-------------------------|
| **Google Trends** | Country + subregion (state) | Spike for “office lunch delivery”, “dabba service”, “team lunch order” in Maharashtra / Karnataka |
| **reddit** | City / region subreddits | `r/bangalore`, `r/mumbai`, `r/delhi`, `r/india` — heat, late delivery, corporate lunch threads |
| **Bluesky** | Keyword + optional location tag in post | Growing; phase after reddit |
| **Time window** | Subscriber timezone (IST +5:30) | Lunch watcher only runs 11:00–13:30 local; dinner rush separate profile |

**Language nuance (India + beyond):** Sentiment keyword packs must include **Romanized / blended phrasing** — e.g. “lunch skip ho gaya”, “order late ho gaya”, “office canteen”, not English-only. Tie to `languages` already saved from market map (Hindi, English, Kannada, etc. as we expand).

#### Subscriber ad architecture (one paused campaign per geo branch)

Subscriber sets up **on Google / Reddit / TikTok natively** (NEONSOX stores IDs only):

| Branch | Geo target (native platform) | NEONSOX stores | Default state |
|--------|------------------------------|----------------|---------------|
| Mumbai | Maharashtra / Mumbai metro | `google_geo_criterion_id`, `campaign_id`, `customer_id` | PAUSED |
| Bangalore | Karnataka / Bangalore | same | PAUSED |
| Gurgaon/Delhi NCR | Delhi NCR | same | PAUSED |

On spike in **that** region + time window + urgency score → flip **only** that branch to ACTIVE/ENABLED. All others stay PAUSED (budget guardrail).

**Google Ads:** Use official **Geotargeting Criterion IDs** (integers), not raw strings like “Bangalore”. Store in DB; lookup table from Google’s geotargets CSV.

**Reddit Ads:** Target by location interest / subreddit context; organic reddit posts go to city subs from market map suggestions.

#### NEONSOX data model (extends trend engine)

- [ ] `geo_branches` table — `user_id`, `campaign_key`, `region_label`, `country_code`, `state_province`, `timezone`, `google_geo_criterion_id`, optional `reddit_geo_target`, `platform`, `external_campaign_id`, `external_customer_id`, `default_status` (PAUSED)
- [ ] `trend_watchers` — add `geo_branch_id`, `local_keywords[]`, `time_windows[]` (e.g. lunch IST), `min_urgency`, `target_subreddits[]`
- [ ] Link to existing **market map** — `home_country`, `target_markets`, `target_languages` from `campaigns` / `campaignSetupStorage` → auto-suggest branches + subreddits + keyword packs
- [ ] India state/province picker on market map (Maharashtra, Karnataka, Delhi NCR, etc.) — extend beyond US/Canada-only today

#### Implementation phases (JS/Node)

**Phase A+ (organic, geo-aware)** — after Sessions 1–3:
- [ ] `backend/lib/trends/googleTrends.js` — regional interest by `geo` param (country + subregion)
- [ ] `backend/lib/trends/redditGeo.js` — poll city subreddits from branch config
- [ ] `evaluateLocalDemand(branch)` — time window + volume spike + sentiment/urgency
- [ ] Auto-post to **city subreddit** or **Telegram channel** for that branch (organic)

**Phase C+ (paid, geo-aware)** — after organic geo loop proven:
- [ ] `@google-ads/google-ads-api` — per-branch `ENABLED` / `PAUSED` by `campaign_id` + geo already set in native ad group
- [ ] Reddit Ads API — geo-targeted campaign status flip
- [ ] Cron: tighter interval before lunch rush (e.g. every 10 min 10:30–14:00 local only)
- [ ] Auto-pause when wave dies (save subscriber budget; min 24h active once on — same rule as Phase C)

#### Honest boundaries (arrive at “no” yourself — documented)

| Claim | Verdict |
|-------|---------|
| Target ads to specific Indian cities | **Yes** — Google / Reddit / TikTok geo targeting |
| Listen to lunch sentiment by province | **Yes** — Trends + city reddits + time windows |
| Flip paused campaign when local spike hits | **Yes** — status API only; ad pre-approved |
| Track individual workers’ GPS at lunch | **No** — not needed; don’t build |
| Meta/Instagram geo ads via NEONSOX | **No** — excluded by policy |
| Generate new ad creative on the spike | **No** — trend dies before review; pre-stage only |
| Google Trends “official API” | **Partial** — use supported libraries / RSS-style ingestion; rate-limit carefully |
| Guaranteed DoorDash-scale takeover | **Unknown** — product aids timing; subscriber still runs ops |

**Already in repo (geo groundwork):** market map (`/markets`), 30 countries incl. India, languages on brief + export, `campaigns` Supabase sync. **Not yet:** city-level branches, criterion IDs, geo watchers, IST lunch windows.

---

### AI video quality
- [ ] Cat leg / body glitch in street scene — tighten Runway strict mode + character continuity prompts; consider re-gen with Prevent AI mistakes ON

### Analytics & insights (core differentiator — feeds Phase A/B above)
- [ ] Replace Dashboard mock metrics with **trend watcher + post log** data
- [ ] Plain-language campaign insights (“what’s working / what to change”)
- [ ] Strategic launch outlook (timing suggestions from watcher, not fake speedometer)

### Localization & targeting
- [x] **Country selector** — home country + 30 markets with languages + flags
- [x] **Target geographic market selector** — interactive map at `/markets`, worldwide toggle, save + return to Palette Schema
- [x] **Self-reported state/province** — US + Canada on market map (for privacy compliance path)
- [x] **Campaign setup persisted to Supabase** — `docs/supabase-campaigns.sql` + sync on Dashboard / market map save
- [x] **Markets on export + generate brief** — home country, region, targets, languages in Socials Tray + Runway brief payload
- [ ] **India / EU state-province expansion** — Maharashtra, Karnataka, etc. for hyperlocal branches (see Hyperlocal geo-targeting)
- [ ] **City → subreddit + geo criterion map** — e.g. Bangalore → `r/bangalore` + Google criterion `1007740`
- [ ] **Localized keyword packs** — Hinglish / Romanized urgency phrases per market language

### Compliance (legal & accessibility — not built yet)

**Privacy (self-reported location — no IP tracking):**
- [ ] `privacyRegimes.js` — map country + state/province → notice blocks (GDPR/UK, CCPA/CPRA, PIPEDA, LGPD, etc.)
- [ ] Expand `Privacy.jsx` — base policy + dynamic addenda from declared location
- [ ] `PrivacyNotice` component — signup, export, footer summaries
- [ ] Signup checkbox — agree to **Terms + Privacy** (Terms only today)
- [ ] Store consent on `profiles` — `privacy_consented_at`, `declared_country`, `declared_region`
- [ ] Attorney review before launch (automated text is a product aid, not legal advice)

**Accessibility:**
- [x] `prefers-reduced-motion` — disable blinking step indicators when requested
- [x] Keyboard focus rings (`:focus-visible`) on interactive controls
- [x] Dashboard tabs + studio step progress ARIA (baseline)
- [ ] WCAG 2.1 AA audit — full keyboard nav, form errors, color contrast
- [ ] Screen reader pass — market map, Socials Tray (deeper pass)
- [ ] Document reference frameworks — ADA (US), EN 301 549 (EU), AODA (Canada)

### Trust, legal & safety
- [x] **Fraud / abuse disclaimer** — ban policy; cooperation with law enforcement (plain language)
  - [x] Signup checkbox + link to Terms
  - [x] Terms of Service page (footer, pricing, signup, landing)
  - [x] Reminder line before Export to Socials Tray
- [x] Terms of Service page (linked from signup, pricing, footer)
- [ ] Privacy Policy linked at signup (see Compliance section above)

### Security hardening
- [ ] Rate limiting on `/api/campaigns/*` and `/api/checkout` (prevent abuse / cost blowups)
- [ ] Production CORS lockdown (only your Vercel domain)
- [ ] Supabase RLS audit on `profiles` (members can only read own row)
- [ ] Security headers on backend (Helmet or equivalent)
- [ ] Stripe Radar + block disposable emails at signup (optional)
- [ ] Content moderation / admin review queue for exported ads (optional phase 2)

### Polish
- [x] Git commit for Palette Studio work
- [ ] Marketing pages content pass

---

## Reference

### Run locally
- **Frontend:** `npm run dev` in `frontend-react` → **http://localhost:5173** (or 5174)
- **Backend:** `node server.js` in `backend` → **http://localhost:4242**
- **ElevenLabs:** `ELEVENLABS_VOICE_ID` + `ELEVENLABS_VOICE_ID_MALE` in `backend/.env`
- **Run app:** see `RUN.md`

### Competitor snapshot (verify pricing on their sites before marketing)
| Tool | Typical entry | ~5 min brief→video? | Video + voice + text + export? | Analytics / strategy? |
|------|---------------|---------------------|------------------------------|------------------------|
| **NEONSOX** | $9.99/mo + $99–199 campaign | Yes (built) | Yes | Planned (your differentiator) |
| Creatify | ~$33–39/mo | Partial — clip focus | Partial | Limited |
| Arcads | ~$77–110/mo | Partial — UGC actor clips | No — asset only | Limited |
| AdCreative.ai | ~$249/mo for video | Partial | Partial — video on high tiers | Ad scoring on high tiers |
| HeyGen | ~$29/mo | Partial — avatars | No full campaign flow | No |
| Superscale / ad studios | Varies | Claims end-to-end | Closer combo | Some reporting |

Most competitors sell **a clip or a dashboard**. Few sell **brief → finished ad → insights** at **$9.99 + campaign tier**.
