# NEONSOX — To-Do

_Last updated: 2026-07-12 (lock flash fix + social API groundwork)_

## Product focus (locked)
- Subscribers **download the ad** and post/run campaigns **anywhere they choose** (including Meta, on their own).
- NEONSOX differentiator: **metrics, feed insights, and strategic campaign outlook** — not game-network or store integrations.
- Social **Post to** buttons: only where clear API path (pay → code → platform executes).

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

---

## 🔜 Next

### Campaign & billing
- [x] Finish Supabase toggle test (Chunks 5–6 from prior list) — see RUN.md §3 + `docs/supabase-profiles.sql` + `backend/scripts/check-profile.mjs`
- [ ] **Stripe checkout test (local)** — backend + frontend running → Pricing → Subscribe → Success page confirms automatically (RUN.md §3). **No Stripe CLI required.**
- [ ] Real Stripe webhook (production) — Stripe Dashboard webhook URL → `/api/webhook` (backup; optional for local)
- [x] Pricing: show “Active” / disable Subscribe when already subscribed

### Socials Tray — posting (A + B + C per platform)
**Groundwork added (Jul 12):** `docs/supabase-social-connections.sql`, `backend/lib/social/`, `backend/lib/socialRoutes.js`, `frontend-react/src/lib/socialApi.js`, platform metadata in `socialPlatforms.js`.

**Next session build order:**
1. Run `supabase-social-connections.sql` in Supabase
2. First adapter end-to-end (suggest **Bluesky** or **Discord webhook** — simplest)
3. OAuth connect flow: `GET /api/social/:platform/connect` + callback
4. Wire **Post to** buttons in `SocialsTrayPanel.jsx` (selected platform chips only)
5. Enforce tier post quotas from campaign tier
6. Replace Member fake `connectedAccounts` with real API count

- [ ] Wire **Post to** platform buttons where API access is paid + documented (start with clearest path, e.g. Bluesky or X)

### AI video quality
- [ ] Cat leg / body glitch in street scene — tighten Runway strict mode + character continuity prompts; consider re-gen with Prevent AI mistakes ON

### Analytics & insights (core differentiator)
- [ ] Replace Dashboard mock metrics with real or staged feed performance data
- [ ] Plain-language campaign insights (“what’s working / what to change”)
- [ ] Strategic launch outlook (timing, platform mix suggestions from feed data)

### Localization & targeting
- [x] **Country selector** — home country + 30 markets with languages + flags
- [x] **Target geographic market selector** — interactive map at `/markets`, worldwide toggle, save + return to Palette Schema
- [x] **Self-reported state/province** — US + Canada on market map (for privacy compliance path)
- [x] **Campaign setup persisted to Supabase** — `docs/supabase-campaigns.sql` + sync on Dashboard / market map save
- [x] **Markets on export + generate brief** — home country, region, targets, languages in Socials Tray + Runway brief payload

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
