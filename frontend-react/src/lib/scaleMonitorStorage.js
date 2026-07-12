const STORAGE_KEY = "neonsox-scale-monitor"

function readAll() {
  if (typeof window === "undefined") return { confirmed: {}, stepsDone: {} }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { confirmed: {}, stepsDone: {} }
  } catch {
    return { confirmed: {}, stepsDone: {} }
  }
}

function writeAll(data) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Unique key per service + threshold so alerts return when you outgrow a tier. */
export function alertKey(service) {
  return `${service.id}:${service.upgradeAtSubs ?? service.nextPlan ?? service.level}`
}

export function stepKey(alertKeyValue, stepNumber) {
  return `${alertKeyValue}:step:${stepNumber}`
}

export function getConfirmedAt(service) {
  const data = readAll()
  return data.confirmed[alertKey(service)] || null
}

export function confirmUpgrade(service) {
  const data = readAll()
  const key = alertKey(service)
  data.confirmed[key] = new Date().toISOString()
  writeAll(data)
  return data.confirmed[key]
}

export function isStepDone(service, stepNumber) {
  const data = readAll()
  return !!data.stepsDone[stepKey(alertKey(service), stepNumber)]
}

export function setStepDone(service, stepNumber, done) {
  const data = readAll()
  const sk = stepKey(alertKey(service), stepNumber)
  if (done) data.stepsDone[sk] = true
  else delete data.stepsDone[sk]
  writeAll(data)
}

export function getStepsDoneMap(service) {
  const data = readAll()
  const prefix = `${alertKey(service)}:step:`
  const map = {}
  Object.keys(data.stepsDone).forEach((k) => {
    if (k.startsWith(prefix)) {
      const num = Number(k.slice(prefix.length))
      if (num) map[num] = true
    }
  })
  return map
}
