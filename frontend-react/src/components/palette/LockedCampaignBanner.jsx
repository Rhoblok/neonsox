import NeonButton from "../NeonButton"
import { useTheme } from "../../context/ThemeContext"

export default function LockedCampaignBanner({ onBuyNew, triesUsed, triesAllowed, remaining }) {
  const { colors } = useTheme()
  const hasClips = triesUsed > 0

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "16px 18px",
        borderRadius: "12px",
        border: "1px solid rgba(255, 107, 107, 0.35)",
        background: "rgba(255, 107, 107, 0.06)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, color: "#ff8a8a", marginBottom: "4px" }}>
          {remaining <= 0
            ? `Campaign locked — ${triesUsed} of ${triesAllowed} tries used`
            : `${remaining} of ${triesAllowed} tries left`}
        </div>
        <p style={{ margin: 0, fontSize: "0.85rem", color: colors.textMuted, lineHeight: 1.5 }}>
          {hasClips
            ? "Pick your favorite clip below, then buy a new campaign for 5 more tries."
            : "Buy a new campaign to get 5 more generation tries."}
        </p>
      </div>
      <NeonButton size="sm" onClick={onBuyNew}>
        Buy new campaign
      </NeonButton>
    </div>
  )
}
