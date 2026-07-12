/** Small flag image — works on Windows (emoji flags often don't). */
export default function CountryFlag({ flagCode, height = 16, style = {} }) {
  if (!flagCode || flagCode.length !== 2) return null

  const code = flagCode.toLowerCase()
  const width = Math.round(height * 1.34)

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: "2px",
        objectFit: "cover",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.12)",
        flexShrink: 0,
        verticalAlign: "middle",
        ...style,
      }}
    />
  )
}
