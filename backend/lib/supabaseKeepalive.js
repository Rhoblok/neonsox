/**
 * Touch Supabase so free-tier projects don't pause from "inactivity".
 * Hits REST + Auth + a real table read (profiles).
 */
export async function pingSupabase(supabase, { url, serviceKey } = {}) {
  const started = Date.now()
  const checks = []

  const restUrl = (url || process.env.SUPABASE_URL || "").replace(/\/$/, "")
  const key = serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (restUrl && key) {
    try {
      const res = await fetch(`${restUrl}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      checks.push({
        name: "rest",
        ok: res.ok || res.status === 404 || res.status === 401,
        detail: `HTTP ${res.status}`,
      })
    } catch (err) {
      checks.push({ name: "rest", ok: false, detail: err.message || "REST failed" })
    }
  } else {
    checks.push({ name: "rest", ok: false, detail: "Missing SUPABASE_URL or service key" })
  }

  if (!supabase) {
    return {
      ok: false,
      fedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      checks,
      message: "Supabase client not configured.",
    }
  }

  try {
    const { error } = await supabase.from("profiles").select("id").limit(1)
    if (error) {
      checks.push({ name: "profiles", ok: false, detail: error.message })
    } else {
      checks.push({ name: "profiles", ok: true, detail: "select ok" })
    }
  } catch (err) {
    checks.push({ name: "profiles", ok: false, detail: err.message || "profiles query failed" })
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      checks.push({ name: "auth", ok: false, detail: error.message })
    } else {
      checks.push({
        name: "auth",
        ok: true,
        detail: `${data?.users?.length ?? 0} user(s) sampled`,
      })
    }
  } catch (err) {
    checks.push({ name: "auth", ok: false, detail: err.message || "auth failed" })
  }

  const ok = checks.every((c) => c.ok)
  const projectRef =
    (restUrl.match(/https:\/\/([^.]+)\.supabase\.co/) || [])[1] || "unknown"

  return {
    ok,
    fedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    projectRef,
    checks,
    message: ok
      ? "Supabase fed — REST, Auth, and profiles were touched."
      : "Ping finished with errors — project may be paused or misconfigured.",
  }
}
