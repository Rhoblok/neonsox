import { supabase } from "./supabase"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4242"

async function adminAuthHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Sign in as admin first.")
  return { Authorization: `Bearer ${token}` }
}

export async function fetchScaleMonitor() {
  const headers = await adminAuthHeaders()
  const res = await fetch(`${API_BASE}/api/admin/scale-monitor`, { headers })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `Scale Monitor unavailable (${res.status})`)
  }
  return body
}

/** Touch Supabase so free-tier projects don't pause from inactivity. */
export async function pingSupabaseKeepalive() {
  const headers = await adminAuthHeaders()
  const res = await fetch(`${API_BASE}/api/admin/supabase-ping`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: "{}",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `Supabase ping failed (${res.status})`)
  }
  return body
}
