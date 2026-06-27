import { Link } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import Wordmark from "./Wordmark"

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Dashboard", to: "/dashboard" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Privacy Policy", to: "/privacy" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Join Us", to: "/pricing" },
      { label: "Member Portal", to: "/member" },
    ],
  },
]

export default function Footer() {
  const { colors, tokens } = useTheme()

  return (
    <footer
      style={{
        borderTop: `1px solid ${colors.border}`,
        padding: "48px 32px 32px",
        background: "transparent",
      }}
    >
      <div
        style={{
          maxWidth: tokens.maxWidth,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "32px",
        }}
      >
        <div style={{ maxWidth: "260px" }}>
          <div style={{ marginBottom: "10px" }}>
            <Wordmark size="1.3rem" />
          </div>
          <p style={{ color: colors.textFaint, fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
            Slick &amp; simple advertisements. Launch campaigns that glow.
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4
              style={{
                fontSize: "0.75rem",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: colors.text,
                marginBottom: "14px",
              }}
            >
              {col.heading}
            </h4>
            {col.links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: colors.textMuted,
                  textDecoration: "none",
                  marginBottom: "9px",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: tokens.maxWidth,
          margin: "32px auto 0",
          paddingTop: "20px",
          borderTop: `1px solid ${colors.border}`,
          color: colors.textFaint,
          fontSize: "0.8rem",
        }}
      >
        © {new Date().getFullYear()} NeonSox. All rights reserved.
      </div>
    </footer>
  )
}
