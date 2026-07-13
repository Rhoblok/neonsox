/**
 * Test Telegram bot posting (uses backend/.env).
 *
 * Usage (from backend folder):
 *   node scripts/test-telegram.mjs
 *   node scripts/test-telegram.mjs "https://your-cloud-clip.mp4"
 */
import dotenv from "dotenv"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { postToTelegram, isTelegramConfigured } from "../lib/social/adapters/telegram.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, "..", ".env") })

const videoUrl =
  process.argv[2] ||
  "https://yqyeznrufsitxljfgibv.supabase.co/storage/v1/object/public/campaign-clips/f9ec8a9a-57a2-45f7-9f0b-aeabb0e05646/tier1_draft/gen_1783857587576-overlay-1783863777576.mp4"

if (!isTelegramConfigured()) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID in backend/.env")
  process.exit(1)
}

console.log("Posting test video to Telegram channel...")
const result = await postToTelegram({
  platform: "telegram",
  postType: "media",
  mediaUrl: videoUrl,
  caption: "NEONSOX — test post from backend",
  companyName: "NEONSOX",
})

console.log(JSON.stringify(result, null, 2))
process.exit(result.ok ? 0 : 1)
