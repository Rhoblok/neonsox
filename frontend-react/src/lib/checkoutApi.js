const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4242"

/** Tell the backend to verify this Stripe checkout and flip membership/campaign flags. */
export async function confirmCheckoutSession(sessionId, userId) {
  const res = await fetch(`${API_BASE}/api/checkout/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userId }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || "Could not confirm payment.")
  }
  return data
}
