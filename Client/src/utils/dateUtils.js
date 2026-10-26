// The dashboard's "today" is pinned to a fixed date rather than
// `new Date()` so the deterministic dataset — and every derived KPI,
// trend and ranking — looks identical on every run.
export const TODAY = new Date('2026-08-17T00:00:00')

export function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

export function addDays(d, n) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export function formatDate(iso, opts = {}) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...opts })
}

export function formatDateShort(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

// Monday-start ISO week key, e.g. "2026-W33"
export function isoWeekKey(iso) {
  const d = new Date(`${iso}T00:00:00`)
  const date = new Date(d.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  const weekNo = 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${date.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function weekStartEnd(iso) {
  const d = new Date(`${iso}T00:00:00`)
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  const start = addDays(d, -day)
  const end = addDays(start, 6)
  return { start: toISODate(start), end: toISODate(end) }
}

export function monthKey(iso) {
  return iso.slice(0, 7) // "2026-08"
}

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}
