import { supabase } from "./supabase"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4242"

async function adminAuthHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Sign in as admin to view the Scale Monitor.")
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
