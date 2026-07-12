import { useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import Layout from "../components/Layout"
import Card from "../components/Card"
import NeonButton from "../components/NeonButton"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"

export default function Profile() {
  const navigate = useNavigate()
  const { colors } = useTheme()
  const { user, isAuthenticated, loading, isAdmin, hasMembership, hasCampaign, refreshProfile } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login")
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    if (isAuthenticated) refreshProfile()
  }, [isAuthenticated, refreshProfile])

  if (loading || !isAuthenticated) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "60px 20px", color: colors.textMuted }}>Loading…</div>
      </Layout>
    )
  }

  const rows = [
    { label: "Display name", value: user?.name || "—" },
    { label: "Email", value: user?.email || "—" },
    { label: "Subscription", value: hasMembership ? "Active" : "Inactive", ok: hasMembership },
    { label: "Campaign tier", value: hasCampaign ? "Active" : "None yet", ok: hasCampaign },
    { label: "Account type", value: isAdmin ? "Admin" : "Member" },
  ]

  return (
    <Layout>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: colors.accent,
            textAlign: "center",
          }}
        >
          Account
        </p>
        <h1 style={{ margin: "0 0 10px", fontSize: "2rem", color: colors.text, textAlign: "center" }}>
          Profile
        </h1>
        <p style={{ color: colors.textMuted, textAlign: "center", margin: "0 0 28px", lineHeight: 1.6 }}>
          Your account details and subscription status.
        </p>

        <Card>
          <dl style={{ margin: 0, padding: 0 }}>
            {rows.map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <dt style={{ margin: 0, fontSize: "0.8rem", color: colors.textFaint, fontWeight: 600 }}>
                  {row.label}
                </dt>
                <dd style={{ margin: 0, fontSize: "0.95rem", color: row.ok === false ? colors.textMuted : colors.text, fontWeight: 700 }}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", marginTop: "24px" }}>
          <NeonButton size="lg" onClick={() => navigate("/member")}>
            Back to Home
          </NeonButton>
          <NeonButton size="lg" variant="ghost" onClick={() => navigate("/pricing")}>
            Manage subscription
          </NeonButton>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.8rem", color: colors.textFaint }}>
          Need help?{" "}
          <Link to="/dashboard" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>
            Open Dashboard
          </Link>
        </p>
      </div>
    </Layout>
  )
}
