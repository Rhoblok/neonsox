import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext(null)

const USER_KEY = "neonsox-user"
const FLAGS_KEY = "neonsox-flags"

// Single built-in admin account. Lets you walk every part of the app and unlock
// the membership-gated and campaign-gated views. Wire to real auth (Supabase /
// Stripe) later — this is a dev/owner account only.
//
// Credentials are read from env vars so the literal values stay out of the repo.
// Set VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD in frontend-react/.env (gitignored).
// NOTE: Vite bakes VITE_ vars into the bundle, so this is not a true secret —
// the real fix is server-side auth (on the roadmap).
const ADMIN = {
  email: (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase(),
  password: import.meta.env.VITE_ADMIN_PASSWORD || "",
  name: "Admin",
  role: "admin",
}

function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJSON(USER_KEY, null))

  // Preview flags: which gated experiences are unlocked. Admin can flip these in
  // the control panel to preview both locked and unlocked states.
  const [flags, setFlags] = useState(() =>
    readJSON(FLAGS_KEY, { hasMembership: false, hasCampaign: false })
  )

  useEffect(() => {
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user))
    else window.localStorage.removeItem(USER_KEY)
  }, [user])

  useEffect(() => {
    window.localStorage.setItem(FLAGS_KEY, JSON.stringify(flags))
  }, [flags])

  const login = (email, password) => {
    const e = (email || "").trim().toLowerCase()
    // Require configured credentials; never match on empty env vars.
    if (!ADMIN.email || !ADMIN.password) {
      return { ok: false, error: "Admin login is not configured. Set VITE_ADMIN_* in .env." }
    }
    if (e === ADMIN.email && password === ADMIN.password) {
      const u = { email: ADMIN.email, name: ADMIN.name, role: ADMIN.role }
      setUser(u)
      // Admins start fully unlocked so they can see every app aspect.
      setFlags({ hasMembership: true, hasCampaign: true })
      return { ok: true, user: u }
    }
    return { ok: false, error: "Invalid security credentials." }
  }

  const logout = () => {
    setUser(null)
    setFlags({ hasMembership: false, hasCampaign: false })
  }

  const setHasMembership = (val) => setFlags((f) => ({ ...f, hasMembership: val }))
  const setHasCampaign = (val) => setFlags((f) => ({ ...f, hasCampaign: val }))

  const value = {
    user,
    isAdmin: user?.role === "admin",
    isAuthenticated: !!user,
    login,
    logout,
    hasMembership: flags.hasMembership,
    hasCampaign: flags.hasCampaign,
    setHasMembership,
    setHasCampaign,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

export default AuthContext
