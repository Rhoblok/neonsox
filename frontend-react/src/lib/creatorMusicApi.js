import { supabase } from "./supabase"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4242"

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Sign in to continue.")
  return { Authorization: `Bearer ${token}` }
}

async function parse(res) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`)
    err.code = body.code
    err.status = res.status
    throw err
  }
  return body
}

export async function fetchCreatorMusicStatus() {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/creator-music/status`, { headers })
  return parse(res)
}

export async function acceptCreatorMusicTerms() {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/creator-music/terms`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: "{}",
  })
  return parse(res)
}

export async function submitCreatorMusicContribution({ file, title, creditName, licenseGrantAccepted }) {
  const headers = await authHeaders()
  const form = new FormData()
  form.append("file", file)
  form.append("title", title || file.name || "Untitled bed")
  if (creditName) form.append("creditName", creditName)
  form.append("licenseGrantAccepted", licenseGrantAccepted ? "true" : "false")
  const res = await fetch(`${API_BASE}/api/creator-music/contributions`, {
    method: "POST",
    headers,
    body: form,
  })
  return parse(res)
}

export async function fetchCreatorMusicLibrary() {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/creator-music/library`, { headers })
  return parse(res)
}

export async function fetchAdminCreatorMusic(status = "pending") {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/admin/creator-music?status=${encodeURIComponent(status)}`, {
    headers,
  })
  return parse(res)
}

export async function reviewCreatorMusic(id, { review_status, review_notes }) {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/admin/creator-music/${id}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ review_status, review_notes }),
  })
  return parse(res)
}
