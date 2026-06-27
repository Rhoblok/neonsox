import Header from "./Header"
import Footer from "./Footer"
import { useTheme } from "../context/ThemeContext"

// Page shell: theme-aware Header + Footer wrapping page content. Background follows
// the active day/night palette to match the landing page.
export default function Layout({ children, maxWidth }) {
  const { colors, tokens } = useTheme()

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: colors.bg,
        backgroundImage: colors.bgGradient,
        color: colors.text,
        fontFamily: tokens.font.sans,
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      <Header />
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: maxWidth || tokens.maxWidth,
          margin: "0 auto",
          padding: "48px 32px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}
