import { Link, useLocation } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import ThemeToggle from "./ThemeToggle"
import Wordmark from "./Wordmark"

const NAV_LINKS = [
  { label: "Features", path: "/features" },
  { label: "Pricing", path: "/pricing" },
  { label: "About", path: "/about" },
]

export default function Header() {
  const { pathname } = useLocation()
  const { colors, tokens, isDark } = useTheme()

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        background: isDark ? "rgba(18, 20, 22, 0.85)" : "rgba(244, 239, 234, 0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <Link to="/" style={{ textDecoration: "none" }}>
        <Wordmark size="1.5rem" withTM />
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "26px" }}>
        {NAV_LINKS.map((link) => {
          const active = pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: active ? colors.accent : colors.textMuted,
                transition: "color 0.2s ease",
              }}
            >
              {link.label}
            </Link>
          )
        })}

        <Link
          to="/pricing"
          style={{
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "#06121c",
            background: colors.accent,
            padding: "9px 20px",
            borderRadius: tokens.radius.sm,
            boxShadow: colors.glowShadow,
          }}
        >
          Join Us
        </Link>

        <ThemeToggle />
      </nav>
    </header>
  )
}
