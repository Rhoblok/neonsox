import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import ThemeToggle from "./ThemeToggle"
import Wordmark from "./Wordmark"

const NAV_LINKS = [
  { label: "Features", path: "/features" },
  { label: "Pricing", path: "/pricing" },
  { label: "About", path: "/about" },
]

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { colors, tokens, isDark } = useTheme()
  const { isAuthenticated, isAdmin, signOut } = useAuth()

  const linkStyle = (active) => ({
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: active ? colors.accent : colors.textMuted,
    transition: "color 0.2s ease",
  })

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

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

      <nav style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        {isAuthenticated ? (
          <>
            <Link to="/" style={linkStyle(pathname === "/")}>Home</Link>
            <Link to="/member" style={linkStyle(pathname === "/member")}>Member</Link>
            <Link to="/dashboard" style={linkStyle(pathname === "/dashboard")}>Dashboard</Link>
            {isAdmin && (
              <Link to="/admin" style={linkStyle(pathname === "/admin")}>Admin</Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                background: "transparent",
                border: `1px solid ${colors.border}`,
                color: colors.textMuted,
                borderRadius: tokens.radius.sm,
                padding: "8px 14px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            {NAV_LINKS.map((link) => (
              <Link key={link.path} to={link.path} style={linkStyle(pathname === link.path)}>
                {link.label}
              </Link>
            ))}
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
          </>
        )}

        <ThemeToggle />
      </nav>
    </header>
  )
}
