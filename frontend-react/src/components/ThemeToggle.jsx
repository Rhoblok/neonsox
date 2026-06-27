import { useTheme } from "../context/ThemeContext"

// Sun/moon day-night toggle, matching the landing page control.
export default function ThemeToggle({ style = {} }) {
  const { isDark, toggle, colors } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="Toggle day / night theme"
      style={{
        background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: `1px solid ${colors.border}`,
        padding: "10px",
        borderRadius: "50%",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.25s ease",
        ...style,
      }}
    >
      {isDark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fdb813" strokeWidth="2.5">
          <circle cx="12" cy="12" r="5" fill="#fdb813" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f9ed5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
