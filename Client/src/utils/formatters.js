export function formatNumber(n) {
  if (n === undefined || n === null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-IN').format(n)
}

export function formatPercent(n) {
  if (n === undefined || n === null || Number.isNaN(n)) return '—'
  return `${n}%`
}

export function formatCompact(n) {
  if (n === undefined || n === null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
