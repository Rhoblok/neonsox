import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import Card from "../components/Card"
import NeonButton from "../components/NeonButton"
import Wordmark from "../components/Wordmark"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"

const ANNOUNCEMENTS = [
  { id: "a1", tag: "New", text: "Industry Speedometer now runs live sentiment analysis." },
  { id: "a2", tag: "Tip", text: "Connect your social platforms after purchasing a campaign tier." },
  { id: "a3", tag: "Update", text: "Campaign tiers now run for a full 60 days (2 months)." },
]

export default function Member() {
  const navigate = useNavigate()
  const { colors, tokens } = useTheme()
  const { user, hasMembership, hasCampaign } = useAuth()

  const member = {
    displayName: user?.name || "Member",
    subscriptionStatus: hasMembership ? "Active" : "Inactive",
    connectedAccounts: hasCampaign ? 2 : 0,
    campaignTier: hasCampaign ? "Tier 1 · 60 days" : "None yet",
  }

  const checklist = [
    { id: "verify", label: "Verify your email address", done: true },
    { id: "subscribe", label: "Activate membership subscription", done: hasMembership },
    { id: "campaign", label: "Choose a campaign tier", done: hasCampaign },
    { id: "connect", label: "Connect your social accounts", done: hasCampaign },
    { id: "wizard", label: "Run the setup wizard", done: false },
  ]
  const doneCount = checklist.filter((c) => c.done).length

  const stats = [
    { label: "Subscription", value: member.subscriptionStatus, ok: hasMembership },
    { label: "Connected accounts", value: member.connectedAccounts, ok: member.connectedAccounts > 0 },
    { label: "Campaign tier", value: member.campaignTier, ok: hasCampaign },
  ]

  return (
    <Layout>
      {/* Glowing member sign */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <Wordmark size="3rem" withTM glow />
        <div
          style={{
            display: "inline-block",
            marginTop: "16px",
            background: colors.accentSoft,
            color: colors.accent,
            padding: "6px 14px",
            borderRadius: tokens.radius.pill,
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Member Portal
        </div>
      </div>

      <h1 style={{ fontSize: "2rem", margin: "0 0 10px", color: colors.text, textAlign: "center" }}>
        Welcome back, <span style={{ color: colors.accent }}>{member.displayName}</span>
      </h1>
      <p style={{ color: colors.textMuted, fontSize: "1.02rem", lineHeight: 1.6, maxWidth: "600px", margin: "0 auto 36px", textAlign: "center" }}>
        Your NeonSox hub. Manage your subscription, track your campaign, and jump into setup.
      </p>

      {/* Status cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {stats.map((s) => (
          <Card key={s.label}>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: colors.textFaint, marginBottom: "8px" }}>
              {s.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: s.ok ? colors.accent : colors.textFaint,
                  boxShadow: s.ok ? colors.glowShadow : "none",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: s.ok ? colors.accent : colors.textMuted }}>
                {s.value}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", marginBottom: "36px" }}>
        <NeonButton size="lg" onClick={() => navigate("/dashboard")}>
          Start Setup Wizard
        </NeonButton>
        <NeonButton size="lg" variant="ghost" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </NeonButton>
      </div>

      {/* Two-column: announcements + checklist */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {/* Announcements */}
        <Card>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.15rem", color: colors.text }}>Announcements</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {ANNOUNCEMENTS.map((a) => (
              <li
                key={a.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  padding: "12px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: colors.accent,
                    background: colors.accentSoft,
                    padding: "3px 8px",
                    borderRadius: tokens.radius.pill,
                  }}
                >
                  {a.tag}
                </span>
                <span style={{ color: colors.textMuted, fontSize: "0.9rem", lineHeight: 1.5 }}>{a.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Onboarding checklist */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "1.15rem", color: colors.text }}>Onboarding checklist</h2>
            <span style={{ fontSize: "0.85rem", color: colors.textFaint }}>
              {doneCount} / {checklist.length} complete
            </span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {checklist.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: item.done ? "#06121c" : colors.textFaint,
                    background: item.done ? colors.accent : "transparent",
                    border: item.done ? "none" : `1px solid ${colors.border}`,
                  }}
                >
                  {item.done ? "✓" : ""}
                </span>
                <span style={{ color: item.done ? colors.textFaint : colors.text, textDecoration: item.done ? "line-through" : "none" }}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Layout>
  )
}
