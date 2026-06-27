# NEONSOX — To-Do (Next Session)

_Last updated: 2026-06-23_

## Design order: A → B → C → D
- [x] **A) Pricing / Join Us** — tiers, 60-day duration, "Benefits" wording, base benefits
- [x] **B) Member page** — glowing NEONSOX™ sign, status cards, announcements, checklist
- [ ] **C) Dashboard** — in progress (see below)
- [ ] **D) Marketing pages** — final content pass on About, Features, Privacy

---

## C) Dashboard polish
- [x] Build out the **Palette Schema** campaign builder — tier-aware platform limits, goal, content focus, live summary panel, "saved" state
- [x] Make the dashboard modules feel alive:
  - [x] mini sparkline chart for Engagement Analytics
  - [x] needle gauge for the Industry Speedometer
  - [x] real calendar grid for Campaign Calendar
- [x] Wizard is now **remembered** (localStorage) with a "↻ Re-run setup" button
- [ ] TODO: verify unlocked Palette Schema builder while logged in as admin (auto-review blocks automated login)
- [ ] Consider: animate the sparkline / live-update metrics; wire Campaign Feed to real data

## D) Marketing pages
- [ ] Final content pass on **About**, **Features**, **Privacy**

---

## Plumbing (when ready for real users)
- [x] **Real authentication** (Supabase) — /login + /signup pages, session-backed
      AuthContext, route guards on /member /dashboard /admin
- [ ] Migrate admin check from email-match to a **Supabase role + Row-Level Security**
      (true server-side authorization)
- [ ] Replace admin/preview flags with **real Stripe subscription + campaign status**
- [ ] **Backend guard** — reject campaign-tier checkout unless membership is active
- [ ] **Stripe webhook** to auto-flip `hasMembership` / `hasCampaign` after checkout
- [ ] Optional: real **2FA** (current 2FA modal was removed in favor of Supabase login)
- [ ] Make the **landing page responsive** — 3-column layout collapses on narrow screens

## Auth notes
- Admin = whoever logs in with `VITE_ADMIN_EMAIL` (frontend convenience only;
  real authorization must move to Supabase RLS — see above).
- Signup handles email confirmation either way: shows "check your email" if it's ON
  in Supabase, logs straight in if it's OFF. Keep it ON for production.

---

## Admin login (reference)
- URL: `/admin` (Control Panel) — links to every page + preview unlock toggles
- Credentials live in `frontend-react/.env` (`VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD`) — gitignored, not stored here
- 2FA: any 6 digits (placeholder)
