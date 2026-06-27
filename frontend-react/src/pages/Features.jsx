import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import Card from "../components/Card"
import NeonButton from "../components/NeonButton"
import { useTheme } from "../context/ThemeContext"

const FEATURES = [
  { icon: "📈", title: "Engagement Analytics", body: "Track impressions, clicks, and sentiment in real time across every campaign." },
  { icon: "🛰️", title: "Dynamic Feed Monitor", body: "Watch personal, industry, and trending data pipelines update live." },
  { icon: "🎯", title: "Industry Odometer", body: "See where your brand sentiment sits on the spectrum at a glance." },
  { icon: "🗓️", title: "Campaign Calendar", body: "Schedule launches and never miss a tier execution window." },
  { icon: "🎨", title: "Palette Schema Builder", body: "Design campaigns with a guided form and connect checkout instantly." },
  { icon: "🛍️", title: "Campaign Shop", body: "Unlock extra promotional distribution nodes into trending streams." },
]

export default function Features() {
  const navigate = useNavigate()
  const { colors, tokens } = useTheme()

  return (
    <Layout>
      <span
        style={{
          display: "inline-block",
          background: colors.accentSoft,
          color: colors.accent,
          padding: "6px 14px",
          borderRadius: tokens.radius.pill,
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "20px",
        }}
      >
        Features
      </span>

      <h1 style={{ fontSize: "2.4rem", margin: "0 0 16px", lineHeight: 1.15, color: colors.text }}>
        Everything you need to <span style={{ color: colors.accent }}>run the show</span>.
      </h1>
      <p style={{ color: colors.textMuted, fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "640px", marginBottom: "40px" }}>
        One dashboard, two tabs, zero clutter. NeonSox gives you the tools to plan,
        launch, and measure campaigns without juggling a dozen apps.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "48px",
        }}
      >
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <div style={{ fontSize: "1.8rem", marginBottom: "12px" }}>{f.icon}</div>
            <h3 style={{ margin: "0 0 8px", color: colors.text, fontWeight: 700 }}>{f.title}</h3>
            <p style={{ color: colors.textMuted, margin: 0, lineHeight: 1.55 }}>{f.body}</p>
          </Card>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <NeonButton size="lg" onClick={() => navigate("/pricing")}>
          Get Started
        </NeonButton>
      </div>
    </Layout>
  )
}
