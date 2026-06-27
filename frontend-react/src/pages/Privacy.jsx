import Layout from "../components/Layout"
import { useTheme } from "../context/ThemeContext"

const SECTIONS = [
  { heading: "1. Information We Collect", body: "We collect the information you provide when you create an account, subscribe, or build a campaign — including your name, email, billing details, and connected account data." },
  { heading: "2. How We Use Your Information", body: "Your data powers your dashboard: analytics, campaign delivery, and account management. We never sell your personal information to third parties." },
  { heading: "3. Payments", body: "Payments are processed securely through Stripe. NeonSox does not store your full card details on our servers." },
  { heading: "4. Data Security", body: "We use industry-standard encryption and access controls to protect your information in transit and at rest." },
  { heading: "5. Your Rights", body: "You may request access to, correction of, or deletion of your personal data at any time by contacting our support team." },
  { heading: "6. Contact", body: "Questions about this policy? Reach us at privacy@neonsox.com." },
]

export default function Privacy() {
  const { colors, tokens } = useTheme()

  return (
    <Layout maxWidth="780px">
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
        Legal
      </span>

      <h1 style={{ fontSize: "2.2rem", margin: "0 0 8px", color: colors.text }}>Privacy Policy</h1>
      <p style={{ color: colors.textFaint, marginBottom: "40px" }}>
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      {SECTIONS.map((s) => (
        <section key={s.heading} style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "1.15rem", color: colors.text, margin: "0 0 8px" }}>{s.heading}</h2>
          <p style={{ color: colors.textMuted, margin: 0, lineHeight: 1.65 }}>{s.body}</p>
        </section>
      ))}
    </Layout>
  )
}
