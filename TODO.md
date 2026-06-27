# NEONSOX — To-Do

_Last updated: 2026-06-27_

## ✅ Done this session
- [x] Supabase auth (/login, /signup, route guards)
- [x] `profiles` table + admin role in Supabase
- [x] Admin login → `/admin` Control Panel
- [x] Sign out + Home / Member / Dashboard / Admin navigation
- [x] Git commits: secret-safe config, Supabase auth, admin role fix

---

## 🔜 Tomorrow — Stripe phase (do in order: A → B → C)

### Chunk A — Supabase columns for payment status
- [ ] Run SQL in Supabase to add to `profiles`:
  - `has_membership` (boolean, default false)
  - `has_campaign` (boolean, default false)
  - `stripe_customer_id` (text, optional)
- [ ] Verify: Table Editor shows new columns on `profiles`

### Chunk B — Stripe webhook on backend
- [ ] Add webhook endpoint to `backend/server.js`
- [ ] Listen for `checkout.session.completed`
- [ ] Update the user's `profiles` row when payment succeeds
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `backend/.env` (gitignored)
- [ ] Test with Stripe CLI or a test checkout

### Chunk C — App reads real flags from Supabase
- [ ] Update `AuthContext` to load `has_membership` / `has_campaign` from `profiles`
- [ ] Pricing page: enable campaign tiers when membership is true (from DB)
- [ ] Dashboard: unlock Palette Schema when campaign is true (from DB)
- [ ] Admin toggles become optional preview override (or remove later)

---

## Design (later)
- [ ] **D) Marketing pages** — final content pass on About, Features, Privacy
- [ ] **Dashboard polish** — richer widgets, real data, animations
- [ ] **Landing page responsive** — 3-column layout on mobile

---

## Reference
- **Run app:** see `RUN.md` (frontend often on http://localhost:5174)
- **Admin:** log in → lands on `/admin` if `profiles.role = admin`
- **Email confirmation:** OFF for testing, ON before live users (Supabase → Authentication → Email)
