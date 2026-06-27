import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import Card from "../components/Card"
import NeonButton from "../components/NeonButton"
import { useTheme } from "../context/ThemeContext"

const VALUES = [
  { title: "Slick", body: "Every campaign looks like it belongs on a billboard in Times Square." },
  { title: "Simple", body: "No agencies, no jargon. Pick a tier, design, and launch in minutes." },
  { title: "Smart", body: "Real-time analytics and curated feeds keep your spend working." },
]

export default function About() {
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
        About NeonSox
      </span>

      <h1 style={{ fontSize: "2.4rem", margin: "0 0 16px", lineHeight: 1.15, color: colors.text }}>
        Advertising that <span style={{ color: colors.accent }}>glows</span>.
      </h1>
      <p style={{ color: colors.textMuted, fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "640px", marginBottom: "40px" }}>
        NeonSox is a marketing platform built for creators and small businesses who want
        big-brand campaigns without the big-brand budget. We blend bold design with
        self-serve simplicity so anyone can light up their audience.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "48px",
        }}
      >
        {VALUES.map((v) => (
          <Card key={v.title} title={v.title}>
            <p style={{ color: colors.textMuted, margin: 0, lineHeight: 1.55 }}>{v.body}</p>
          </Card>
        ))}
      </div>

      <Card
        highlight
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}
      >
        <div>
          <h3 style={{ margin: "0 0 6px", color: colors.text }}>Ready to launch?</h3>
          <p style={{ margin: 0, color: colors.textMuted }}>Pick a plan and start your first campaign today.</p>
        </div>
        <NeonButton size="lg" onClick={() => navigate("/pricing")}>
          View Pricing
        </NeonButton>
      </Card>
    </Layout>
  )
}
