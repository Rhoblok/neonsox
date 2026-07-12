/** Verify Supabase JWT and ensure caller is an admin (role or ADMIN_EMAIL). */

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ""
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in as admin to view this." })
  }

  const token = header.slice(7).trim()
  const supabase = req.app.locals.getSupabase?.()
  if (!supabase) {
    return res.status(503).json({ error: "Server is missing Supabase configuration." })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ error: "Session expired — sign in again." })
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
  const userEmail = (user.email || "").trim().toLowerCase()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError && profileError.code !== "PGRST116") {
    return res.status(500).json({ error: "Could not verify admin access." })
  }

  const isAdmin = profile?.role === "admin" || (!!adminEmail && userEmail === adminEmail)
  if (!isAdmin) {
    return res.status(403).json({ error: "Admin access only." })
  }

  req.adminUser = user
  return next()
}
