import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import Card from "../components/Card"
import NeonButton from "../components/NeonButton"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import ScaleMonitorPanel from "../components/admin/ScaleMonitorPanel"
import CreatorMusicReviewPanel from "../components/admin/CreatorMusicReviewPanel"
import SupabaseKeepalivePanel from "../components/admin/SupabaseKeepalivePanel"

const APP_PAGES = [
  { label: "Landing Page", path: "/", desc: "Public marketing home" },
  { label: "Pricing / Join Us", path: "/pricing", desc: "Membership + campaign tiers" },
  { label: "Success", path: "/success", desc: "Post-checkout confirmation" },
  { label: "Member Portal", path: "/member", desc: "Member home & onboarding" },
  { label: "Profile", path: "/profile", desc: "Account details & subscription" },
  { label: "Dashboard", path: "/dashboard", desc: "Wizard → analytics folder" },
  { label: "About", path: "/about", desc: "Marketing — about" },
  { label: "Features", path: "/features", desc: "Marketing — features" },
  { label: "Privacy", path: "/privacy", desc: "Marketing — privacy" },
  { label: "Terms", path: "/terms", desc: "Terms of Service + acceptable use" },
]

export default function Admin() {
  const navigate = useNavigate()
  const { colors, tokens } = useTheme()
  const {
    isAdmin,
    user,
    loading,
    signOut,
    hasMembership,
    hasCampaign,
    setHasMembership,
    setHasCampaign,
  } = useAuth()

  // Wait for the session to resolve before deciding access (avoids a flash).
  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "60px 20px", color: colors.textMuted }}>Loading…</div>
      </Layout>
    )
  }

  // Gate: only admins can view the control panel.
  if (!isAdmin) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "2.4rem", marginBottom: "12px" }}>🔒</div>
          <h1 style={{ color: colors.text, margin: "0 0 10px" }}>Admin access required</h1>
          <p style={{ color: colors.textMuted, maxWidth: "440px", margin: "0 auto 24px", lineHeight: 1.6 }}>
            Sign in with the admin account to open the control panel.
          </p>
          <NeonButton size="lg" onClick={() => navigate("/login")}>Go to Login</NeonButton>
        </div>
      </Layout>
    )
  }

  const Toggle = ({ on, onChange, label, desc }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "14px 0", borderBottom: `1px solid ${colors.border}` }}>
      <div>
        <div style={{ color: colors.text, fontWeight: 700, fontSize: "0.95rem" }}>{label}</div>
        <div style={{ color: colors.textFaint, fontSize: "0.82rem" }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!on)}
        aria-pressed={on}
        style={{
          width: "52px",
          height: "28px",
          borderRadius: tokens.radius.pill,
          border: "none",
          cursor: "pointer",
          position: "relative",
          background: on ? colors.accent : colors.surfaceAlt,
          transition: "background 0.2s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: on ? "27px" : "3px",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  )

  return (
    <Layout>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "8px" }}>
        <div>
          <span
            style={{
              display: "inline-block",
              background: colors.accentSoft,
              color: colors.accent,
              padding: "6px 14px",
              borderRadius: tokens.radius.pill,
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "14px",
            }}
          >
            ⚡ Admin
          </span>
          <h1 style={{ fontSize: "2.2rem", margin: "0 0 8px", color: colors.text }}>Control Panel</h1>
          <p style={{ color: colors.textMuted, margin: 0 }}>
            Signed in as <strong style={{ color: colors.accent }}>{user.email}</strong>
          </p>
        </div>
        <NeonButton variant="ghost" onClick={async () => { await signOut(); navigate("/") }}>
          Log out
        </NeonButton>
      </div>

      <SupabaseKeepalivePanel />

      <ScaleMonitorPanel />

      <CreatorMusicReviewPanel />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "28px" }}>
        {/* Preview toggles */}
        <Card>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.15rem", color: colors.text }}>Preview unlocks</h2>
          <p style={{ color: colors.textFaint, fontSize: "0.85rem", margin: "0 0 8px" }}>
            Flip these to preview locked vs. unlocked experiences across the app.
          </p>
          <Toggle
            on={hasMembership}
            onChange={setHasMembership}
            label="Membership active"
            desc="Unlocks campaign tiers on the Pricing page"
          />
          <Toggle
            on={hasCampaign}
            onChange={setHasCampaign}
            label="Campaign purchased"
            desc="Unlocks the Palette Schema builder in the Dashboard"
          />
        </Card>

        {/* Page directory */}
        <Card>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.15rem", color: colors.text }}>All pages</h2>
          <p style={{ color: colors.textFaint, fontSize: "0.85rem", margin: "0 0 12px" }}>
            Jump to any part of the app.
          </p>
          <div style={{ display: "grid", gap: "8px" }}>
            {APP_PAGES.map((p) => (
              <button
                key={p.path}
                onClick={() => navigate(p.path)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  textAlign: "left",
                  padding: "12px 14px",
                  background: colors.surfaceAlt,
                  border: `1px solid ${colors.border}`,
                  borderRadius: tokens.radius.sm,
                  cursor: "pointer",
                }}
              >
                <span>
                  <span style={{ display: "block", color: colors.text, fontWeight: 700, fontSize: "0.92rem" }}>{p.label}</span>
                  <span style={{ color: colors.textFaint, fontSize: "0.78rem" }}>{p.desc}</span>
                </span>
                <span style={{ color: colors.accent, fontWeight: 700 }}>→</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
