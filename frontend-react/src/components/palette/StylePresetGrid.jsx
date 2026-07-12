import { useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { STYLE_CATEGORIES, STYLE_PRESETS } from "../../lib/stylePresets"
import StylePresetCard, { SelectedStyleSummary } from "./StylePresetCard"

export default function StylePresetGrid({ selectedId, onSelect }) {
  const { colors } = useTheme()
  const [category, setCategory] = useState("All")

  const filtered =
    category === "All" ? STYLE_PRESETS : STYLE_PRESETS.filter((p) => p.category === category)

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
        {["All", ...STYLE_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              padding: "5px 10px",
              fontSize: "0.72rem",
              fontWeight: 700,
              borderRadius: "999px",
              border: `1px solid ${category === cat ? colors.accent : colors.border}`,
              background: category === cat ? colors.accentSoft : colors.bg,
              color: category === cat ? colors.accent : colors.textMuted,
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
          gap: "10px",
          maxHeight: "220px",
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {filtered.map((preset) => (
          <StylePresetCard
            key={preset.id}
            preset={preset}
            selected={selectedId === preset.id}
            onSelect={onSelect}
          />
        ))}
      </div>

      <SelectedStyleSummary presetId={selectedId} />
    </div>
  )
}
