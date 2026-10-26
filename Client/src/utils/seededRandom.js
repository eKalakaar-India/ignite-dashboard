// Deterministic pseudo-random number generator (mulberry32).
// Using a seeded PRNG (instead of Math.random) means the "dummy" dataset
// is identical on every load/build — required for stable demos and
// reproducible screenshots, while still looking naturally varied.

export function createRng(seed) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

export function pickWeighted(rng, entries) {
  // entries: [{ value, weight }]
  const total = entries.reduce((s, e) => s + e.weight, 0)
  let r = rng() * total
  for (const e of entries) {
    r -= e.weight
    if (r <= 0) return e.value
  }
  return entries[entries.length - 1].value
}

export function intBetween(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function chance(rng, probability) {
  return rng() < probability
}

export function shuffle(rng, arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
