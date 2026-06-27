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
- Needs `backend\.env` with `STRIPE_SECRET_KEY` (and optional `FRONTEND_URL`).
- Leave the window open. Stop with **Ctrl + C**.

---

## 2. Frontend — React app (port 5173)

```powershell
cd "c:\Users\keara\OneDrive\Desktop\neonsox-platform\frontend-react"

# First time only:
npm install

# Start:
npm run dev
```

- URL: http://localhost:5173 (Vite uses the next free port if 5173 is taken — check the
  terminal output for the actual URL).
- Needs `frontend-react\.env` (Stripe publishable key, Supabase, and `VITE_ADMIN_*`).
- Stop with **Ctrl + C**.

---

## Notes
- Order doesn't matter, but Stripe checkout needs **both** servers running.
- Changed a `.env` file? **Restart** that server so it reloads the values.
- **Admin login:** landing page → Log-in → email/password from `frontend-react\.env` →
  any 6-digit 2FA code → lands on `/admin` (control panel with preview unlock toggles).
