import Layout from "../components/Layout"
import Card from "../components/Card"
import NeonButton from "../components/NeonButton"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"

const STRIPE_DATA = {
  membership: { id: "price_1TiJgHF2RIMjk7tqxPseEcGr", mode: "subscription" },
  tier1: { id: "price_1TiJlTF2RIMjk7tqYqDM8AoN", mode: "payment" },
  tier2: { id: "price_1TiJnMF2RIMjk7tqB3qQLoGQ", mode: "payment" },
  tier3: { id: "price_1TiJp0F2RIMjk7tqpaRskSB3", mode: "payment" },
}

const MEMBERSHIP = {
  price: "$9.99",
  cadence: "/ month",
  benefits: [
    "Campaign feed (when a campaign is active)",
    "Industry speedometer (sentiment analysis)",
    "Engagement analytics — impressions & clicks",
    "In-app messages",
    "Campaign calendar",
    "Trends",
  ],
  note: "Social platform connections activate when you purchase a campaign tier.",
}

const CAMPAIGN_TIERS = [
  {
    key: "tier1",
    name: "Tier 1",
    price: "$99",
    purpose: "Small founder / consultant campaign.",
    benefits: ["Connect 2 social platforms", "15 link-posts total", "60 text / media posts total"],
  },
  {
    key: "tier2",
    name: "Tier 2",
    price: "$149",
    purpose: "Growth-stage campaign.",
    benefits: ["Connect 3 social platforms", "30 link-posts total", "120 text / media posts total"],
    featured: true,
  },
  {
    key: "tier3",
    name: "Tier 3",
    price: "$199",
    purpose: "Maximum available reach.",
    benefits: ["Connect 4 social platforms", "50 link-posts total", "200 text / media posts total"],
  },
]

export default function Pricing() {
  const { colors, tokens } = useTheme()

  // Membership status comes from auth (admin can unlock to preview). Campaign tiers
  // stay locked until the base membership is active (membership must come first).
  const { hasMembership } = useAuth()

  const handleCheckout = async (priceId, mode) => {
    try {
      const res = await fetch("http://localhost:4242/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Checkout failed — please try again.")
      }
    } catch {
      alert("Could not reach checkout. Is the backend running on port 4242?")
    }
  }

  const Badge = ({ children, tone = "accent" }) => (
    <span
      style={{
        display: "inline-block",
        background: tone === "accent" ? colors.accentSoft : "transparent",
        color: tone === "accent" ? colors.accent : colors.textFaint,
        border: tone === "accent" ? "none" : `1px solid ${colors.border}`,
        padding: "4px 12px",
        borderRadius: tokens.radius.pill,
        fontSize: "0.7rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </span>
  )

  const Yes = () => <span style={{ color: colors.accent, marginRight: "8px", fontWeight: 700 }}>✓</span>

  return (
    <Layout>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <Badge>Join Us</Badge>
        <h1 style={{ fontSize: "2.4rem", margin: "16px 0 12px", color: colors.text }}>
          Pick your <span style={{ color: colors.accent }}>plan</span>
        </h1>
        <p style={{ color: colors.textMuted, fontSize: "1.05rem", maxWidth: "560px", margin: "0 auto", lineHeight: 1.6 }}>
          Start with the monthly membership, then add an optional campaign tier whenever you're ready.
        </p>
      </div>

      {/* Purchase-order rule */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "36px",
          color: colors.textMuted,
          fontSize: "0.9rem",
        }}
      >
        <strong style={{ color: colors.accent }}>1. Membership</strong>
        <span style={{ color: colors.textFaint }}>→</span>
        <strong style={{ color: colors.text }}>2. Optional Campaign Tier</strong>
        <span style={{ color: colors.textFaint }}>→</span>
        <strong style={{ color: colors.text }}>3. Campaign Features</strong>
      </div>

      {/* Membership — required, Step 1 */}
      <Card highlight style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ marginBottom: "10px", display: "flex", gap: "8px" }}>
              <Badge>Required</Badge>
              <Badge tone="muted">Step 1</Badge>
            </div>
            <h2 style={{ margin: "0 0 6px", color: colors.text, fontSize: "1.5rem" }}>Base Membership</h2>
            <p style={{ margin: "0 0 16px", color: colors.textMuted, lineHeight: 1.5 }}>
              Your platform dashboard — the foundation every account needs.
            </p>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: colors.textFaint, marginBottom: "10px" }}>
              Benefits
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px" }}>
              {MEMBERSHIP.benefits.map((f) => (
                <li key={f} style={{ color: colors.textMuted, fontSize: "0.9rem", marginBottom: "8px" }}>
                  <Yes />{f}
                </li>
              ))}
            </ul>
            <p style={{ margin: 0, color: colors.textFaint, fontSize: "0.82rem", fontStyle: "italic" }}>
              {MEMBERSHIP.note}
            </p>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: "180px" }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: colors.text }}>
              {MEMBERSHIP.price}
              <span style={{ fontSize: "0.9rem", color: colors.textFaint, fontWeight: 500 }}> {MEMBERSHIP.cadence}</span>
            </div>
            <NeonButton
              size="lg"
              style={{ marginTop: "12px" }}
              onClick={() => handleCheckout(STRIPE_DATA.membership.id, STRIPE_DATA.membership.mode)}
            >
              Subscribe
            </NeonButton>
          </div>
        </div>
      </Card>

      {/* Campaign tiers — optional, Step 2 */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <Badge tone="muted">Step 2 · Optional add-ons</Badge>
        {!hasMembership && (
          <span style={{ fontSize: "0.85rem", color: colors.textFaint }}>
            🔒 Campaign tiers unlock after your membership is active
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {CAMPAIGN_TIERS.map((tier) => (
          <Card
            key={tier.key}
            style={{
              display: "flex",
              flexDirection: "column",
              opacity: hasMembership ? 1 : 0.85,
              border: tier.featured ? `1px solid ${colors.accent}` : `1px solid ${colors.border}`,
              boxShadow: tier.featured ? colors.glowShadow : colors.shadow,
            }}
          >
            {tier.featured && (
              <div style={{ marginBottom: "12px" }}><Badge>Most popular</Badge></div>
            )}
            <h3 style={{ margin: "0 0 4px", color: colors.text, fontSize: "1.2rem" }}>
              Campaign {tier.name}
            </h3>
            <div style={{ marginBottom: "10px" }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 800, color: colors.text }}>{tier.price}</span>
              <span style={{ fontSize: "0.85rem", color: colors.textFaint }}> one-time · 60 days</span>
            </div>
            <p style={{ margin: "0 0 16px", color: colors.textMuted, lineHeight: 1.5, fontSize: "0.9rem" }}>
              {tier.purpose}
            </p>

            <div
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: colors.textFaint,
                marginBottom: "8px",
              }}
            >
              Benefits
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", flex: 1 }}>
              {tier.benefits.map((b) => (
                <li key={b} style={{ color: colors.textMuted, fontSize: "0.9rem", marginBottom: "8px" }}>
                  <Yes />{b}
                </li>
              ))}
            </ul>

            <NeonButton
              variant={tier.featured ? "primary" : "secondary"}
              fullWidth
              disabled={!hasMembership}
              onClick={() => handleCheckout(STRIPE_DATA[tier.key].id, STRIPE_DATA[tier.key].mode)}
            >
              {hasMembership ? `Buy ${tier.name}` : "Requires Membership"}
            </NeonButton>
          </Card>
        ))}
      </div>
    </Layout>
  )
}
