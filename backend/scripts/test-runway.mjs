import dotenv from "dotenv"

dotenv.config()

const key = (process.env.RUNWAY_API_KEY || "").trim()
const version = process.env.RUNWAY_API_VERSION || "2024-11-06"
const base = "https://api.dev.runwayml.com/v1"

const headers = {
  Authorization: `Bearer ${key}`,
  "X-Runway-Version": version,
  "Content-Type": "application/json",
}

if (!key) {
  console.log("FAIL: RUNWAY_API_KEY missing in backend/.env")
  process.exit(1)
}

console.log("Key prefix:", key.slice(0, 8) + "…")
console.log("API version:", version)

async function readError(res) {
  const text = await res.text()
  try {
    const j = JSON.parse(text)
    return j.error || j.message || JSON.stringify(j)
  } catch {
    return text || `HTTP ${res.status}`
  }
}

// 1) Credit balance
console.log("\n--- Organization / credits ---")
const orgRes = await fetch(`${base}/organization`, { headers })
if (!orgRes.ok) {
  console.log("FAIL:", orgRes.status, await readError(orgRes))
  process.exit(1)
}
const org = await orgRes.json()
const credits = org.creditBalance ?? org.credits ?? "unknown"
const usd = typeof credits === "number" ? (credits * 0.01).toFixed(2) : "?"
console.log("Credit balance:", credits, `(~$${usd} at $0.01/credit)`)
if (org.tier?.maxMonthlyCreditSpend != null) {
  console.log("Monthly spend cap:", org.tier.maxMonthlyCreditSpend, "credits")
}
if (org.usage?.models) {
  console.log("Today's generations:", JSON.stringify(org.usage.models))
}

if (credits === 0) {
  console.log("\n⚠ ZERO CREDITS — add credits at https://dev.runwayml.com/ → Billing")
  process.exit(1)
}

// 2) Minimal safe generation probe (short prompt, no people)
console.log("\n--- Minimal generation probe (5s, safe prompt) ---")
const createRes = await fetch(`${base}/text_to_video`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: "gen4.5",
    promptText:
      "Abstract soft blue and white gradient motion graphics, calm commercial b-roll, no people, no text, no logos.",
    ratio: "1280:720",
    duration: 5,
  }),
})

if (!createRes.ok) {
  const err = await readError(createRes)
  console.log("Create FAILED:", createRes.status, err)
  if (/insufficient|credit|balance|payment|402|403/i.test(String(err))) {
    console.log("\n→ Likely OUT OF CREDITS or billing issue")
  } else if (/moderation/i.test(String(err))) {
    console.log("\n→ Content moderation (not a billing issue)")
  }
  process.exit(1)
}

const created = await createRes.json()
const taskId = created.id || created.task?.id
console.log("Task created:", taskId)

if (!taskId) {
  console.log("FAIL: no task id returned")
  process.exit(1)
}

console.log("Polling task (max ~60s)…")
for (let i = 0; i < 12; i++) {
  await new Promise((r) => setTimeout(r, 5000))
  const taskRes = await fetch(`${base}/tasks/${taskId}`, { headers })
  if (!taskRes.ok) {
    console.log("Poll FAIL:", await readError(taskRes))
    process.exit(1)
  }
  const task = await taskRes.json()
  const status = (task.status || "").toUpperCase()
  console.log(`  [${i + 1}] status:`, status)
  if (status === "SUCCEEDED") {
    console.log("\nALL PASS — Runway accepts jobs and credits are working.")
    process.exit(0)
  }
  if (status === "FAILED" || status === "CANCELLED") {
    const reason = task.failure || task.failureCode || "unknown"
    console.log("\nTask FAILED:", reason)
    if (/moderation/i.test(String(reason))) {
      console.log("→ Moderation block on output (account still has credits)")
    } else if (/credit|insufficient/i.test(String(reason))) {
      console.log("→ Likely out of credits")
    }
    process.exit(1)
  }
}

console.log("\nProbe still running — credits OK, task slow. Check Runway dashboard for task:", taskId)
