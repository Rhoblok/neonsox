import Layout from "../components/Layout"
import { useTheme } from "../context/ThemeContext"

const SECTIONS = [
  {
    heading: "1. Using NeonSox",
    body: "NeonSox helps you create video ads and manage campaigns. You must provide accurate account information and keep your login secure. You are responsible for everything posted or exported from your account.",
  },
  {
    heading: "2. Acceptable use",
    body: "You may only use NeonSox for lawful products and services. You may not use the platform to promote scams, fake offers, hate, harassment, illegal goods, or anything that deceives or harms the public.",
  },
  {
    heading: "3. Fraud or abuse → ban",
    body: "Fraudulent, abusive, or illegal use of NeonSox results in immediate suspension or permanent ban, without refund.",
  },
  {
    heading: "4. Your content",
    body: "You own the content you provide in your campaign brief. You grant NeonSox permission to process that content to generate ads, voice, and exports for your account. Do not upload material you do not have rights to use.",
  },
  {
    heading: "5. Payments",
    body: "Membership and campaign fees are billed through Stripe. Refunds follow our published refund policy and applicable law. Misuse of the service does not qualify for a refund.",
  },
  {
    heading: "6. Service changes",
    body: "We may update features, limits, or pricing with notice where required. Continued use after changes means you accept the updated Terms.",
  },
  {
    heading: "7. Contact",
    body: "Questions about these Terms? Email legal@neonsox.com.",
  },
]

export default function Terms() {
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

      <h1 style={{ fontSize: "2.2rem", margin: "0 0 8px", color: colors.text }}>Terms of Service</h1>
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
