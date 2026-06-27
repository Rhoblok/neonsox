import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import NeonButton from "./NeonButton"
import Wordmark from "./Wordmark"
import ThemeToggle from "./ThemeToggle"

export default function Login() {
  const navigate = useNavigate()
  const { colors, tokens } = useTheme()
  const { signIn } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    const res = await signIn(email, password)
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error || "Could not sign in. Check your credentials.")
      return
    }
    navigate(res.isAdmin ? "/admin" : "/member")
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: tokens.radius.sm,
    color: colors.text,
    fontSize: "0.95rem",
    boxSizing: "border-box",
    fontFamily: "inherit",
    marginBottom: "14px",
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.bg,
        backgroundImage: colors.bgGradient,
        padding: "20px",
        fontFamily: tokens.font.sans,
      }}
    >
      <div style={{ position: "fixed", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: tokens.radius.md,
          boxShadow: colors.shadow,
          padding: "36px 32px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <Wordmark size="1.8rem" withTM />
          </Link>
          <h1 style={{ color: colors.text, fontSize: "1.4rem", margin: "20px 0 4px" }}>Welcome back</h1>
          <p style={{ color: colors.textMuted, fontSize: "0.9rem", margin: 0 }}>Log in to your NeonSox account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: "0.82rem", color: colors.textFaint, fontWeight: 600, marginBottom: "6px" }}>
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />

          <label style={{ display: "block", fontSize: "0.82rem", color: colors.textFaint, fontWeight: 600, marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />

          {error && (
            <div style={{ color: colors.danger, fontSize: "0.85rem", marginBottom: "14px" }}>{error}</div>
          )}

          <NeonButton type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Log in"}
          </NeonButton>
        </form>

        <p style={{ textAlign: "center", color: colors.textMuted, fontSize: "0.88rem", marginTop: "20px" }}>
          Need an account?{" "}
          <Link to="/signup" style={{ color: colors.accent, fontWeight: 700, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
