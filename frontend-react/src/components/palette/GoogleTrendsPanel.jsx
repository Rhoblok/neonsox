import { useState } from "react"
import { useTheme } from "../../context/ThemeContext"

const TIME_FILTERS = [
  { id: "4h", label: "4 hours" },
  { id: "24h", label: "24 hours" },
  { id: "48h", label: "48 hours" },
  { id: "7d", label: "7 days" },
]

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "news", label: "News" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Entertainment" },
  { id: "tech", label: "Tech" },
  { id: "business", label: "Business" },
]

const REGIONS = [
  { id: "US", label: "United States" },
  { id: "IN", label: "India" },
  { id: "GB", label: "United Kingdom" },
  { id: "DE", label: "Germany" },
  { id: "BR", label: "Brazil" },
  { id: "JP", label: "Japan" },
  { id: "AU", label: "Australia" },
  { id: "CA", label: "Canada" },
]

const MOCK_SPIKES = {
  all: [
    { topic: "NeonLaunch", rise: "+420%" },
    { topic: "CreatorEconomy", rise: "+180%" },
    { topic: "GlowUpMarketing", rise: "+95%" },
  ],
  news: [
    { topic: "Local election turnout", rise: "+210%" },
    { topic: "Supply chain update", rise: "+88%" },
  ],
  sports: [
    { topic: "Playoff bracket", rise: "+310%" },
    { topic: "Transfer window", rise: "+140%" },
  ],
  entertainment: [
    { topic: "Festival lineup", rise: "+260%" },
    { topic: "Streaming premiere", rise: "+120%" },
  ],
  tech: [
    { topic: "AI video ads", rise: "+390%" },
    { topic: "Short-form editing", rise: "+175%" },
  ],
  business: [
    { topic: "Small business grants", rise: "+150%" },
    { topic: "Local delivery surge", rise: "+110%" },
  ],
}

function chipStyle(colors, active) {
  return {
    padding: "5px 10px",
    borderRadius: "999px",
    border: `1px solid ${active ? colors.accent : colors.border}`,
    background: active ? colors.accentSoft : colors.bg,
    color: active ? colors.accent : colors.textMuted,
    fontSize: "0.7rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: active ? `0 0 8px ${colors.glow}` : "none",
  }
}

export default function GoogleTrendsPanel() {
  const { colors } = useTheme()
  const [timeFilter, setTimeFilter] = useState("24h")
  const [category, setCategory] = useState("all")
  const [region, setRegion] = useState("US")

  const spikes = MOCK_SPIKES[category] || MOCK_SPIKES.all

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: colors.textFaint,
              marginBottom: "6px",
            }}
          >
            Time
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {TIME_FILTERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeFilter(t.id)}
                style={chipStyle(colors, timeFilter === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: colors.textFaint,
              marginBottom: "6px",
            }}
          >
            Category
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                style={chipStyle(colors, category === c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="gt-region"
            style={{
              display: "block",
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: colors.textFaint,
              marginBottom: "6px",
            }}
          >
            Country / region
          </label>
          <select
            id="gt-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "220px",
              padding: "7px 10px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.text,
              fontSize: "0.8rem",
              fontFamily: "inherit",
            }}
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: "12px" }}>
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: colors.textFaint,
            marginBottom: "6px",
          }}
        >
          Spikes · past {TIME_FILTERS.find((t) => t.id === timeFilter)?.label}
        </div>
        {spikes.map((s) => (
          <div
            key={s.topic}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              padding: "8px 0",
              borderBottom: `1px solid ${colors.border}`,
              fontSize: "0.82rem",
              color: colors.textMuted,
            }}
          >
            <span>
              # {s.topic}
            </span>
            <span style={{ color: colors.accent, fontWeight: 800, textShadow: `0 0 8px ${colors.glow}` }}>
              {s.rise}
            </span>
          </div>
        ))}
        <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: colors.textFaint, fontStyle: "italic" }}>
          Preview filters — live Google Trends feed wires in Phase A.
        </p>
      </div>
    </div>
  )
}
