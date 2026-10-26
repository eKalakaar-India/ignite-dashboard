// Generic, pure aggregation helpers. Deliberately has no dependency on
// src/data/mockData.js (which imports FROM here) — keeps the module graph
// one-directional: mockData -> calculations, never the reverse.
import { isoWeekKey, monthKey, weekStartEnd } from './dateUtils'

export function filterRecords(records, filters = {}) {
  const { search, state, district } = filters
  return records.filter((r) => {
    if (state && state !== 'all' && r.state !== state) return false
    if (district && district !== 'all' && r.district !== district) return false
    if (search) {
      const q = search.trim().toLowerCase()
      if (q) {
        const haystack = `${r.state} ${r.district} ${r.block} ${r.name_of_session || r.school} ${r.ITI_name} ${r.type_of_session} ${r.type_of_outreach} ${r.remarks} ${r.observation}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
    }
    return true
  })
}

export function sumReach(records) {
  return records.reduce(
    (acc, r) => {
      acc.girls += r.girlsReached
      acc.teachers += r.teachersReached
      acc.community += r.communityReached
      acc.total += r.totalParticipants
      return acc
    },
    { girls: 0, teachers: 0, community: 0, total: 0 }
  )
}

export function sessionsByType(records) {
  return {
    girls: records.filter((r) => r.girlsReached > 0).length,
    teachers: records.filter((r) => r.teachersReached > 0).length,
    community: records.filter((r) => r.communityReached > 0).length,
    total: records.length,
  }
}

export function uniqueCount(records, field) {
  return new Set(records.map((r) => r[field])).size
}

export function coverage(records) {
  const schoolRecords = records.filter((record) =>
    record.type_of_session ? record.type_of_session === 'School' : Boolean(record.school)
  )
  return {
    states: uniqueCount(records, 'state'),
    districts: uniqueCount(records, 'district'),
    blocks: uniqueCount(records, 'block'),
    schools: new Set(schoolRecords.map((record) => record.name_of_session || record.school).filter(Boolean)).size,
  }
}

export function documentationCompletion(records) {
  const n = records.length || 1
  const attendance = records.filter((r) => r.attendance).length
  const consent = records.filter((r) => r.consent).length
  const feedback = records.filter((r) => r.feedback).length
  const geoPhoto = records.filter((r) => r.geoTaggedPhoto).length
  const iec = records.filter((r) => r.iecMaterial).length
  const overallCount = records.filter((r) =>
    r.attendance && r.consent && r.feedback && r.geoTaggedPhoto && r.iecMaterial
  ).length
  return {
    attendancePct: Math.round((attendance / n) * 100),
    consentPct: Math.round((consent / n) * 100),
    feedbackPct: Math.round((feedback / n) * 100),
    geoPhotoPct: Math.round((geoPhoto / n) * 100),
    iecPct: Math.round((iec / n) * 100),
    overallPct: Math.round((overallCount / n) * 100),
    counts: { attendance, consent, feedback, geoPhoto, iec, total: records.length },
  }
}

// Generic — groups by whatever string values appear in r.status, so this
// file never needs to know the concrete status labels used by the data layer.
export function statusCounts(records) {
  const map = {}
  records.forEach((r) => {
    map[r.status] = (map[r.status] || 0) + 1
  })
  return map
}

export function achievementPct(achieved, planned) {
  if (!planned) return 0
  return Math.min(999, Math.round((achieved / planned) * 100))
}

export function groupByDate(records) {
  const map = new Map()
  records.forEach((r) => {
    if (!map.has(r.date)) {
      map.set(r.date, { date: r.date, girls: 0, teachers: 0, community: 0, total: 0, sessions: 0 })
    }
    const bucket = map.get(r.date)
    bucket.girls += r.girlsReached
    bucket.teachers += r.teachersReached
    bucket.community += r.communityReached
    bucket.total += r.totalParticipants
    bucket.sessions += 1
  })
  return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1))
}

export function groupByWeek(records) {
  const map = new Map()
  records.forEach((r) => {
    const key = isoWeekKey(r.date)
    if (!map.has(key)) {
      const { start, end } = weekStartEnd(r.date)
      map.set(key, { key, start, end, girls: 0, teachers: 0, community: 0, total: 0, sessions: 0 })
    }
    const bucket = map.get(key)
    bucket.girls += r.girlsReached
    bucket.teachers += r.teachersReached
    bucket.community += r.communityReached
    bucket.total += r.totalParticipants
    bucket.sessions += 1
  })
  return Array.from(map.values()).sort((a, b) => (a.start > b.start ? 1 : -1))
}

export function groupByMonth(records) {
  const map = new Map()
  records.forEach((r) => {
    const key = monthKey(r.date)
    if (!map.has(key)) {
      map.set(key, { key, girls: 0, teachers: 0, community: 0, total: 0, sessions: 0 })
    }
    const bucket = map.get(key)
    bucket.girls += r.girlsReached
    bucket.teachers += r.teachersReached
    bucket.community += r.communityReached
    bucket.total += r.totalParticipants
    bucket.sessions += 1
  })
  return Array.from(map.values()).sort((a, b) => (a.key > b.key ? 1 : -1))
}

export function groupByState(records) {
  const map = new Map()
  records.forEach((r) => {
    if (!map.has(r.state)) {
      map.set(r.state, {
        state: r.state,
        girls: 0,
        teachers: 0,
        community: 0,
        total: 0,
        sessions: 0,
        districts: new Set(),
        schools: new Set(),
      })
    }
    const bucket = map.get(r.state)
    bucket.girls += r.girlsReached
    bucket.teachers += r.teachersReached
    bucket.community += r.communityReached
    bucket.total += r.totalParticipants
    bucket.sessions += 1
    bucket.districts.add(r.district)
    if ((r.type_of_session === 'School' || (!r.type_of_session && r.school)) && (r.name_of_session || r.school)) {
      bucket.schools.add(r.name_of_session || r.school)
    }
  })
  return Array.from(map.values())
    .map((b) => ({ ...b, districtCount: b.districts.size, schoolCount: b.schools.size }))
    .sort((a, b) => b.total - a.total)
}

export function percentChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}
