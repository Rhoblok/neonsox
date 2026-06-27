import { useNavigate } from "react-router-dom"
import Card from "../components/Card"
import NeonButton from "../components/NeonButton"
import ThemeToggle from "../components/ThemeToggle"
import { useTheme } from "../context/ThemeContext"

export default function Success() {
  const navigate = useNavigate()
  const { colors, tokens } = useTheme()

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: colors.bg,
        backgroundImage: colors.bgGradient,
        fontFamily: tokens.font.sans,
      }}
    >
      <div style={{ position: "fixed", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>

      <Card style={{ maxWidth: "440px", width: "100%", textAlign: "center", padding: "40px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: colors.accentSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
          }}
        >
          🎉
        </div>
        <h1 style={{ margin: "0 0 10px", color: colors.text, fontSize: "1.6rem" }}>Payment Successful</h1>
        <p style={{ color: colors.textMuted, lineHeight: 1.6, margin: "0 0 24px" }}>
          Your membership is active. Head to your member portal to finish setup.
        </p>
        <NeonButton size="lg" fullWidth onClick={() => navigate("/member")}>
          Continue
        </NeonButton>
      </Card>
    </div>
  )
}
