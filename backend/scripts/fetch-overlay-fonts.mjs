/**
 * Downloads 20 overlay TTFs from Google Fonts (OFL) into backend/assets/fonts/.
 * Run: node scripts/fetch-overlay-fonts.mjs
 */
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, "..", "assets", "fonts")

const FONTS = [
  ["BebasNeue-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/BebasNeue-Regular.ttf"],
  ["Oswald-Bold.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/Oswald%5Bwght%5D.ttf"],
  ["Anton-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf"],
  ["Pacifico-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/pacifico/Pacifico-Regular.ttf"],
  ["Righteous-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/righteous/Righteous-Regular.ttf"],
  ["Bangers-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/bangers/Bangers-Regular.ttf"],
  ["Lobster-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/lobster/Lobster-Regular.ttf"],
  ["Orbitron-Bold.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/orbitron/Orbitron%5Bwght%5D.ttf"],
  ["Comfortaa-Bold.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/comfortaa/Comfortaa%5Bwght%5D.ttf"],
  ["Fredoka-Bold.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf"],
  ["AbrilFatface-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/abrilfatface/AbrilFatface-Regular.ttf"],
  ["Cinzel-Bold.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/Cinzel%5Bwght%5D.ttf"],
  ["RussoOne-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/russoone/RussoOne-Regular.ttf"],
  ["Staatliches-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/staatliches/Staatliches-Regular.ttf"],
  ["Monoton-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/monoton/Monoton-Regular.ttf"],
  ["Bungee-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/bungee/Bungee-Regular.ttf"],
  ["Shrikhand-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/shrikhand/Shrikhand-Regular.ttf"],
  ["AlfaSlabOne-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/alfaslabone/AlfaSlabOne-Regular.ttf"],
  ["Caveat-Bold.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat%5Bwght%5D.ttf"],
  ["BlackOpsOne-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/blackopsone/BlackOpsOne-Regular.ttf"],
]

await fs.mkdir(OUT_DIR, { recursive: true })

let ok = 0
for (const [filename, url] of FONTS) {
  const dest = path.join(OUT_DIR, filename)
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 1000) throw new Error("file too small")
    await fs.writeFile(dest, buf)
    console.log("OK", filename)
    ok++
  } catch (err) {
    console.warn("SKIP", filename, err.message)
  }
}

console.log(`\n${ok}/${FONTS.length} fonts saved to backend/assets/fonts/`)
