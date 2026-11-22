/** Verify Supabase JWT for any signed-in member. */

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in to continue." })
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

  req.authUser = user
  req.authToken = token
  return next()
}
