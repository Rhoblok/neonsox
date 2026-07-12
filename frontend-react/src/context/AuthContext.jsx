import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "../lib/supabase"

const AuthContext = createContext(null)

const FLAGS_KEY = "neonsox-flags"

// Admin preview overrides (optional manual toggles on /admin). Payment truth
// comes from Supabase profiles.has_membership / has_campaign.
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

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, has_membership, has_campaign")
    .eq("id", userId)
    .single()
  if (error || !data) return null
  return data
}

function roleIsAdmin(role, email) {
  return role === "admin" || isAdminEmail(email)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileRole, setProfileRole] = useState(null)
  const [membershipFromDb, setMembershipFromDb] = useState(false)
  const [campaignFromDb, setCampaignFromDb] = useState(false)
  const [profileReady, setProfileReady] = useState(false)
  // Admin-only preview overrides (localStorage); ignored for normal members.
  const [adminOverrides, setAdminOverrides] = useState(readFlags)

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

  // Load role + payment flags from Supabase profiles.
  useEffect(() => {
    if (!user) {
      setProfileRole(null)
      setMembershipFromDb(false)
      setCampaignFromDb(false)
      setProfileReady(true)
      return
    }

    let active = true
    setProfileReady(false)

    fetchProfile(user.id).then((profile) => {
      if (!active) return
      if (profile) {
        setProfileRole(profile.role || null)
        setMembershipFromDb(!!profile.has_membership)
        setCampaignFromDb(!!profile.has_campaign)
      }
      if (isAdminEmail(user.email)) {
        setAdminOverrides({ hasMembership: true, hasCampaign: true })
      }
      setProfileReady(true)
    })

    return () => {
      active = false
    }
  }, [user])

  const isAdmin = !!user && roleIsAdmin(profileRole, user.email)

  // Known admin email: unlocked immediately so refresh never flashes "locked".
  const hasMembership = isAdmin
    ? isAdminEmail(user?.email)
      ? true
      : adminOverrides.hasMembership
    : membershipFromDb
  const hasCampaign = isAdmin
    ? isAdminEmail(user?.email)
      ? true
      : adminOverrides.hasCampaign
    : campaignFromDb

  useEffect(() => {
    if (isAdmin && !isAdminEmail(user?.email)) {
      setAdminOverrides({ hasMembership: true, hasCampaign: true })
    } else if (!user) {
      setAdminOverrides({ hasMembership: false, hasCampaign: false })
    }
  }, [isAdmin, user])

  useEffect(() => {
    if (isAdmin) {
      window.localStorage.setItem(FLAGS_KEY, JSON.stringify(adminOverrides))
    } else if (!user) {
      window.localStorage.removeItem(FLAGS_KEY)
    }
  }, [adminOverrides, isAdmin, user])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: (email || "").trim(),
      password,
    })
    if (error) return { ok: false, error: error.message }
    const profile = await fetchProfile(data.user.id)
    if (profile) {
      setProfileRole(profile.role || null)
      setMembershipFromDb(!!profile.has_membership)
      setCampaignFromDb(!!profile.has_campaign)
    }
    return { ok: true, isAdmin: roleIsAdmin(profile?.role, data.user?.email) }
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
    setProfileRole(null)
    setMembershipFromDb(false)
    setCampaignFromDb(false)
  }

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const profile = await fetchProfile(user.id)
    if (!profile) return
    setProfileRole(profile.role || null)
    setMembershipFromDb(!!profile.has_membership)
    setCampaignFromDb(!!profile.has_campaign)
  }, [user])

  const setHasMembership = (val) => {
    if (isAdmin) setAdminOverrides((f) => ({ ...f, hasMembership: val }))
  }
  const setHasCampaign = (val) => {
    if (isAdmin) setAdminOverrides((f) => ({ ...f, hasCampaign: val }))
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
    hasMembership,
    hasCampaign,
    profileReady,
    refreshProfile,
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
