import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import NeonButton from "./NeonButton"
import Wordmark from "./Wordmark"
import ThemeToggle from "./ThemeToggle"

export default function Signup() {
  const navigate = useNavigate()
  const { colors, tokens } = useTheme()
  const { signUp } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (!acceptTerms) {
      setError("Please agree to the Terms of Service to create an account.")
      return
    }
    setSubmitting(true)
    const res = await signUp(email, password, name)
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error || "Could not create your account.")
      return
    }
    if (res.needsConfirmation) {
      setConfirmSent(true) // email confirmation is ON — tell the user to check inbox
    } else {
      navigate("/member") // confirmation OFF — straight in
    }
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

  const labelStyle = { display: "block", fontSize: "0.82rem", color: colors.textFaint, fontWeight: 600, marginBottom: "6px" }

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
          maxWidth: "420px",
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
        </div>

        {confirmSent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.4rem", marginBottom: "12px" }}>📬</div>
            <h1 style={{ color: colors.text, fontSize: "1.3rem", margin: "0 0 10px" }}>Check your email</h1>
            <p style={{ color: colors.textMuted, fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 24px" }}>
              We sent a confirmation link to <strong style={{ color: colors.text }}>{email}</strong>. Click it to
              activate your account, then log in.
            </p>
            <NeonButton fullWidth size="lg" onClick={() => navigate("/login")}>
              Go to Login
            </NeonButton>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h1 style={{ color: colors.text, fontSize: "1.4rem", margin: "0 0 4px" }}>Create your account</h1>
              <p style={{ color: colors.textMuted, fontSize: "0.9rem", margin: 0 }}>Join NeonSox in a few seconds</p>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />

              <label style={labelStyle}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />

              <label style={labelStyle}>Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={inputStyle}
              />

              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                style={inputStyle}
              />

              {error && (
                <div style={{ color: colors.danger, fontSize: "0.85rem", marginBottom: "14px" }}>{error}</div>
              )}

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "16px",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  color: colors.textMuted,
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  style={{ marginTop: "3px", flexShrink: 0 }}
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" style={{ color: colors.accent, fontWeight: 700 }}>
                    Terms of Service
                  </Link>
                  . Fraud or abuse → ban.
                </span>
              </label>

              <NeonButton type="submit" fullWidth size="lg" disabled={submitting || !acceptTerms}>
                {submitting ? "Creating account…" : "Sign up"}
              </NeonButton>
            </form>

            <p style={{ textAlign: "center", color: colors.textMuted, fontSize: "0.88rem", marginTop: "20px" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: colors.accent, fontWeight: 700, textDecoration: "none" }}>
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
