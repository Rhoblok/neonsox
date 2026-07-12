import { useTheme } from "../../context/ThemeContext"
import GenerationCard from "./GenerationCard"

function SkeletonCard({ colors }) {
  return (
    <div
      style={{
        height: "180px",
        borderRadius: "10px",
        background: `linear-gradient(90deg, ${colors.surfaceAlt} 25%, ${colors.bg} 50%, ${colors.surfaceAlt} 75%)`,
        backgroundSize: "200% 100%",
        animation: "palette-shimmer 1.2s infinite",
        border: `1px solid ${colors.border}`,
      }}
    />
  )
}

export default function GenerationGallery({ generations, stylePresetId, loading, onOpen }) {
  const { colors } = useTheme()

  if (loading && generations.length === 0) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
        }}
      >
        {[1, 2, 3].map((n) => (
          <SkeletonCard key={n} colors={colors} />
        ))}
        <style>{`@keyframes palette-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    )
  }

  if (generations.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "0.85rem", color: colors.textFaint, fontStyle: "italic" }}>
        No generations yet — pick a style, fill in ad details, and click Generate Video.
      </p>
    )
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "12px",
      }}
    >
      {generations.map((gen) => (
        <GenerationCard
          key={gen.id}
          generation={gen}
          stylePresetId={stylePresetId}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}
