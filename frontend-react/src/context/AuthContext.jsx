import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const AuthContext = createContext(null)

const FLAGS_KEY = "neonsox-flags"

// Admin is determined by matching the owner email for now. This is a frontend
// convenience only — real authorization must be enforced server-side via Supabase
// Row-Level Security / a roles table. (On the roadmap.)
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase()

function readFlags() {
  if (typeof window === "undefined") return { hasMembership: false, hasCampaign: false }
  try {
    const raw = window.localStorage.getItem(FLAGS_KEY)
    return raw ? JSON.parse(raw) : { hasMembership: false, hasCampaign: false }
  } catch {
    return { hasMembership: false, hasCampaign: false }
  }
}

function mapUser(sUser) {
  if (!sUser) return null
  return {
    id: sUser.id,
    email: sUser.email,
    name: sUser.user_metadata?.name || sUser.email?.split("@")[0] || "Member",
  }
}

function isAdminEmail(email) {
  return !!ADMIN_EMAIL && (email || "").trim().toLowerCase() === ADMIN_EMAIL
}

async function fetchProfileRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()
  if (error || !data?.role) return null
  return data.role
}

function roleIsAdmin(role, email) {
  return role === "admin" || isAdminEmail(email)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState(readFlags)
  // Role from the Supabase `profiles` table (server-side source of truth). Falls
  // back to email-match until the profiles table + RLS are set up.
  const [profileRole, setProfileRole] = useState(null)

  // Restore session on load + subscribe to auth changes.
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(mapUser(data.session?.user))
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user))
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Fetch the user's role from `profiles`. Gracefully ignores a missing table so
  // the app keeps working before the migration is run.
  useEffect(() => {
    if (!user) {
      setProfileRole(null)
      return
    }
    let active = true
    fetchProfileRole(user.id).then((role) => {
      if (active) setProfileRole(role)
    })
    return () => {
      active = false
    }
  }, [user])

  const isAdmin = !!user && roleIsAdmin(profileRole, user.email)

  // Admins start fully unlocked; signed-out resets the preview flags.
  useEffect(() => {
    if (isAdmin) setFlags({ hasMembership: true, hasCampaign: true })
    else if (!user) setFlags({ hasMembership: false, hasCampaign: false })
  }, [isAdmin, user])

  useEffect(() => {
    window.localStorage.setItem(FLAGS_KEY, JSON.stringify(flags))
  }, [flags])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: (email || "").trim(),
      password,
    })
    if (error) return { ok: false, error: error.message }
    const role = await fetchProfileRole(data.user.id)
    setProfileRole(role)
    return { ok: true, isAdmin: roleIsAdmin(role, data.user?.email) }
  }

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email: (email || "").trim(),
      password,
      options: { data: { name: (name || "").trim() } },
    })
    if (error) return { ok: false, error: error.message }
    // When email confirmation is ON, no session is returned until the user confirms.
    return { ok: true, needsConfirmation: !data.session }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const value = {
    user,
    isAdmin,
    isAuthenticated: !!user,
    loading,
    signIn,
    signUp,
    signOut,
    profileRole,
    hasMembership: flags.hasMembership,
    hasCampaign: flags.hasCampaign,
    setHasMembership: (val) => setFlags((f) => ({ ...f, hasMembership: val })),
    setHasCampaign: (val) => setFlags((f) => ({ ...f, hasCampaign: val })),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

export default AuthContext
