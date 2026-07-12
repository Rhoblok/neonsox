import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Card from "../components/Card"
import NeonButton from "../components/NeonButton"
import ThemeToggle from "../components/ThemeToggle"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { confirmCheckoutSession } from "../lib/checkoutApi"

export default function Success() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const { colors, tokens } = useTheme()
  const { isAuthenticated, loading, user, hasMembership, hasCampaign, refreshProfile } = useAuth()
  const [syncing, setSyncing] = useState(true)
  const [confirmError, setConfirmError] = useState("")

  useEffect(() => {
    if (loading) return undefined
    if (!isAuthenticated) {
      navigate("/login")
      return undefined
    }

    let cancelled = false

    async function syncPayment() {
      setConfirmError("")
      try {
        if (sessionId && user?.id) {
          await confirmCheckoutSession(sessionId, user.id)
        }
      } catch (err) {
        if (!cancelled) {
          setConfirmError(err.message || "Could not confirm payment.")
        }
      }

      if (cancelled) return

      await refreshProfile()
      if (!cancelled) setSyncing(false)
    }

    syncPayment()

    return () => {
      cancelled = true
    }
  }, [loading, isAuthenticated, navigate, refreshProfile, sessionId, user?.id])

  useEffect(() => {
    if (hasMembership || hasCampaign) setSyncing(false)
  }, [hasMembership, hasCampaign])

  const confirmed = hasMembership || hasCampaign

  let message = "Confirming your payment…"
  if (confirmed && hasCampaign && hasMembership) {
    message = "Membership and campaign tier are active. Head to your member portal to finish setup."
  } else if (confirmed && hasMembership) {
    message = "Your membership is active. You can add a campaign tier anytime from Pricing."
  } else if (confirmed && hasCampaign) {
    message = "Your campaign tier is active. Open the Dashboard to build your ad."
  } else if (confirmError) {
    message = confirmError
  } else if (!syncing) {
    message =
      "Payment received. If your status does not update, make sure the backend is running on port 4242 and try Member Portal again."
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: colors.bg,
        backgroundImage: colors.bgGradient,
        fontFamily: tokens.font.sans,
      }}
    >
      <div style={{ position: "fixed", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>

      <Card style={{ maxWidth: "480px", width: "100%", textAlign: "center", padding: "40px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: colors.accentSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
          }}
        >
          {syncing && !confirmed ? "⏳" : confirmError && !confirmed ? "⚠️" : "🎉"}
        </div>
        <h1 style={{ margin: "0 0 10px", color: colors.text, fontSize: "1.6rem" }}>
          {syncing && !confirmed ? "Almost there…" : confirmError && !confirmed ? "Check payment status" : "Payment successful"}
        </h1>
        <p style={{ color: colors.textMuted, lineHeight: 1.6, margin: "0 0 16px" }}>{message}</p>

        {(hasMembership || hasCampaign) && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 700,
                background: hasMembership ? colors.accentSoft : colors.surfaceAlt,
                color: hasMembership ? colors.accent : colors.textFaint,
                border: `1px solid ${hasMembership ? colors.accent : colors.border}`,
              }}
            >
              Membership: {hasMembership ? "Active" : "Pending"}
            </span>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 700,
                background: hasCampaign ? colors.accentSoft : colors.surfaceAlt,
                color: hasCampaign ? colors.accent : colors.textFaint,
                border: `1px solid ${hasCampaign ? colors.accent : colors.border}`,
              }}
            >
              Campaign: {hasCampaign ? "Active" : "Not yet"}
            </span>
          </div>
        )}

        <NeonButton size="lg" fullWidth onClick={() => navigate(hasCampaign ? "/dashboard" : "/member")}>
          Continue
        </NeonButton>
      </Card>
    </div>
  )
}
