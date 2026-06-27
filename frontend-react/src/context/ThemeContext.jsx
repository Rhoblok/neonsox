import { createContext, useContext, useEffect, useState } from "react"
import { palettes, tokens } from "../styles/theme"

const STORAGE_KEY = "neonsox-theme"

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? saved === "dark" : true // default: night
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light")
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  const value = {
    isDark,
    toggle,
    colors: isDark ? palettes.dark : palettes.light,
    tokens,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx
}

export default ThemeContext
