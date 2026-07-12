import world from "@svg-maps/world"

const [VX, VY, VW, VH] = world.viewBox.split(" ").map(Number)

/** Real country borders from @svg-maps/world (Natural Earth–style, 256 countries). */
export default function WorldMapSvg({ landFill = "#6b8fa3", oceanFill = "#0c1a2e", stroke = "#8fb4c9" }) {
  return (
    <svg
      viewBox={`${VX} ${VY} ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden
    >
      <rect x={VX} y={VY} width={VW} height={VH} fill={oceanFill} />
      <g fill={landFill} stroke={stroke} strokeWidth="0.35">
        {world.locations.map((loc) => (
          <path key={loc.id} d={loc.path} />
        ))}
      </g>
    </svg>
  )
}

export const WORLD_MAP_ASPECT = `${VW} / ${VH}`
