# Running NEONSOX locally (PowerShell)

Both servers run at the same time — open **two separate PowerShell windows**, one for each.
First-time setup only: run `npm install` in each folder, and make sure the `.env` files exist
(they are gitignored; see `.env.example` in each folder for the required keys).

---

## 1. Backend — Stripe API (port 4242)

```powershell
cd "c:\Users\keara\OneDrive\Desktop\neonsox-platform\backend"

# First time only:
npm install

# Start:
npm start
```

- URL: http://localhost:4242
- Needs `backend\.env` with `STRIPE_SECRET_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
- `STRIPE_WEBHOOK_SECRET` is **optional for local testing** — see Chunk B below.
- Leave the window open. Stop with **Ctrl + C**.

### Chunk B — Confirm payment after checkout (no extra apps)

**You do not need Stripe CLI** or any other tool installed on your machine.

When checkout finishes, Stripe sends the user back to `/success?session_id=...`. The Success page calls your backend, which verifies the payment directly with Stripe’s API and updates Supabase.

**Only two windows needed:**

| Window | Command |
|--------|---------|
| Backend | `cd backend` → `npm start` |
| Frontend | `cd frontend-react` → `npm run dev` |

Pre-flight:

```powershell
cd backend
node scripts/check-stripe-env.mjs
```

**Production (later):** add a webhook in the Stripe Dashboard pointing at your live backend `/api/webhook` for backup processing. Not required for local testing.

---

## 3. Supabase toggle test (membership + campaign flags)

**Goal:** After Stripe checkout, Supabase `profiles` flips the right flag and the app shows **Active**.

### One-time: profiles table

If you have not run this yet, open **Supabase Dashboard → SQL Editor** and run the script:

`docs/supabase-profiles.sql`

That creates `profiles`, RLS (read your own row), and auto-creates a row when someone signs up.

### What you need running (2 windows)

| Window | Command |
|--------|---------|
| Backend | `cd backend` → `npm start` |
| Frontend | `cd frontend-react` → `npm run dev` |

`FRONTEND_URL` in `backend\.env` must match your Vite port (usually **5173**).

### Test A — Membership (`has_membership`)

1. Sign up / log in as a **non-admin** test user (not your admin email).
2. Open **Pricing** → **Subscribe** → complete Stripe test checkout (`4242…` card).
3. You land on **/success** — page confirms payment automatically → **Membership: Active**.
4. Open **Pricing** again → should show **Active** (no Subscribe button).
5. **Member portal** → Subscription should say **Active**.

**Verify in PowerShell** (replace email):

```powershell
cd "c:\Users\keara\OneDrive\Desktop\neonsox-platform\backend"
node scripts/check-profile.mjs your-test-user@email.com
```

Expect: `has_membership: true`

Backend window should log: `Profile updated after checkout: <userId> { has_membership: true }` (via `/api/checkout/confirm`).

### Test B — Campaign (`has_campaign`)

Requires **membership already active** (Test A).

1. **Pricing** → **Buy Tier 1** (or 2/3) → complete checkout.
2. **/success** → **Campaign: Active** badge.
3. **Member portal** → Campaign tier no longer "None yet".
4. **Dashboard** → Palette Studio unlocked (if `hasCampaign` gating applies).

```powershell
node scripts/check-profile.mjs your-test-user@email.com
```

Expect: `has_membership: true` and `has_campaign: true`

### If flags stay false

| Check | Fix |
|-------|-----|
| Backend not running | Start `npm start` in `backend` |
| Wrong Vite port | Set `FRONTEND_URL` in `backend\.env` to match terminal (5173 or 5174) |
| No profile row | Run `docs/supabase-profiles.sql` + backfill section |
| Backend log: `without userId` | Checkout must be while logged in (user id sent to Stripe) |
| Success page error | Open browser devtools → Network → check `/api/checkout/confirm` response |

### Admin preview toggles (not a Supabase test)

`/admin` **Preview unlocks** only change **localStorage** for admin — they do **not** update Supabase. Use a normal test account for this checklist.

**Pre-flight:** `FRONTEND_URL` in `backend\.env` must match your Vite port (usually **5173**). No Stripe CLI required.

Quick check:

```powershell
cd backend
node scripts/check-stripe-env.mjs
```

---

## 4. Campaign markets (Supabase)

One-time: run `docs/supabase-campaigns.sql` in Supabase SQL Editor.

That creates the `campaigns` table (one setup row per user). Market map selections (home country, state/province, targets, languages) sync there when you save on `/markets` or edit the campaign on Dashboard.

---

## 5. Cloud clips + cross-device studio (Supabase)

One-time: run `docs/supabase-studio-cloud.sql` in Supabase SQL Editor.

That creates:

- `studio_states` — full Palette studio JSON + Socials Tray per campaign (syncs when logged in)
- `campaign-clips` storage bucket — finished MP4s uploaded by the backend after generate / mix / overlay

**Backend needs:** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `backend\.env` (same as Stripe checkout).

**How it works:**

1. You generate or finish a clip while logged in.
2. Backend uploads the MP4 to Supabase Storage and returns cloud URLs.
3. Frontend saves studio state + tray to `studio_states`.
4. Open the app on another device with the same account → clips and progress restore.

Clips still save to browser localStorage as a fast local cache; cloud is the source of truth when signed in.

---

## 5b. Creator Music Library (licensing gate)

**Current policy:** Self-serve creator uploads are **paused**. Subscribers pick NEONSOX library beds only. Custom beds = email founder → admin upload/approve.

SQL/API for the full gate still exist (`docs/supabase-creator-music.sql`) for when you re-enable contributors. AudD is optional and not required while uploads are paused.

---

**If cloud is not set up:** app keeps working with localStorage only (same as before).

---

## 2. Frontend — React app (port 5173)

```powershell
cd "c:\Users\keara\OneDrive\Desktop\neonsox-platform\frontend-react"

# First time only:
npm install

# Start:
npm run dev
```

- URL: http://localhost:5173 or **http://localhost:5174** (Vite uses the next free port — check the terminal output for the actual URL).
- Needs `frontend-react\.env` (Stripe publishable key, Supabase, and `VITE_ADMIN_*`).
- Stop with **Ctrl + C**.

---

## Notes
- Order doesn't matter, but Stripe checkout needs **both** servers running.
- Changed a `.env` file? **Restart** that server so it reloads the values.
- **Admin login:** landing page → Log-in → email/password from `frontend-react\.env` →
  any 6-digit 2FA code → lands on `/admin` (control panel with preview unlock toggles).
- **Supa-Pulse (free tier keepalive):** signing in as admin (and opening `/admin`) calls
  `POST /api/admin/supabase-ping`, which touches REST + Auth + `profiles` so the project
  does not pause for inactivity. Admin shows a **Supa-Pulse** card with a **Ping** button and last-fed time.

---

## 6. Stability — stop fix-one / break-another

Regressions happened because many Palette changes landed quickly **without automated checks or a short test pass between fixes**. Use this every time we change the studio.

### Automated smoke (2 minutes)

From the repo root:

```powershell
cd "c:\Users\keara\OneDrive\Desktop\neonsox-platform"
npm run smoke
```

This runs:

1. Frontend production **build** (catches compile crashes)
2. **Frontend smoke** — failed tries stay visible, no auto “your ad”, tone changes scripts, long story auto-trims
3. **Backend smoke** — Runway prompt stays within 1000 chars after trim
4. **Supabase health** — project online, core tables + storage bucket reachable (needs `backend/.env`)

If smoke fails, **do not** call the fix done until it passes.

### Manual 5-minute checklist (Palette)

After smoke passes, with both servers running and logged in as your test user:

| # | Check | Pass? |
|---|--------|-------|
| 1 | Dashboard → Palette tab loads (no blank page) | |
| 2 | **My story** field is editable | |
| 3 | Change **Tone** → browse script ideas → lines feel different | |
| 4 | Clip nest shows tries; **Change pick** clears “YOUR AD” | |
| 5 | **Generate Video** still enabled when tries remain | |

### Rules for future changes

1. **One problem per fix** — avoid mixing prompt rules + cloud sync + UI in one go.
2. **Run `npm run smoke` before and after** every Palette session.
3. **Git commit** after smoke + checklist pass (keeps a known-good snapshot).
4. **Restart backend** after prompt/backend changes before testing generate.
5. **Hard refresh** (`Ctrl + Shift + R`) after frontend changes.

### When something breaks

Note **what you clicked**, the **error text**, and **which try slot** — that narrows fixes fast without undoing unrelated work.

