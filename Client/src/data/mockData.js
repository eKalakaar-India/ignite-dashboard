// ============================================================================
// src/data/mockData.js
//
// Single source of truth for ALL dummy data used across the IgNITE dashboard
// prototype (mirrors the Daily / Weekly / Monthly report templates from the
// programme's Excel workbook). Every number generated here is deterministic
// (seeded PRNG, fixed "today"), so KPIs, charts and rankings are computed
// from this dataset rather than hardcoded — but stay identical on every run.
// ============================================================================

import { createRng, pick, pickWeighted, intBetween, chance, shuffle } from '../utils/seededRandom'
import { TODAY, addDays, toISODate, formatDateShort } from '../utils/dateUtils'
import { groupByWeek, groupByMonth, sumReach, sessionsByType, coverage, documentationCompletion } from '../utils/calculations'

// ---------------------------------------------------------------------------
// Design / chart tokens
// ---------------------------------------------------------------------------
export const CHART_COLORS = {
  primary: '#2F3E9E',
  primaryLight: '#8FA0E2',
  bloom: '#E8546B',
  bloomLight: '#F3A3B1',
  growth: '#12896F',
  growthLight: '#7FCBBA',
  amber: '#E8A33D',
  amberLight: '#F3C784',
  danger: '#E1493C',
  slate: '#94A3B8',
  slateLight: '#CBD3E6',
}

export const SESSION_TYPES = [
  { key: 'girls', label: "Girls' Sessions", color: CHART_COLORS.bloom },
  { key: 'teachers', label: 'Teacher/Principal Sessions', color: CHART_COLORS.primary },
  { key: 'community', label: 'Community Sessions', color: CHART_COLORS.growth },
]

export const ACTIVITY_STATUS = {
  COMPLETED: 'Completed',
  PENDING_REVIEW: 'Pending review',
  FLAGGED: 'Needs Attention',
}

export const STATUS_STYLES = {
  [ACTIVITY_STATUS.COMPLETED]: { bg: 'bg-growth-light', text: 'text-growth-dark', dot: 'bg-growth' },
  [ACTIVITY_STATUS.PENDING_REVIEW]: { bg: 'bg-amber-light', text: 'text-amber-dark', dot: 'bg-amber' },
  [ACTIVITY_STATUS.FLAGGED]: { bg: 'bg-danger-light', text: 'text-danger-dark', dot: 'bg-danger' },
}

// ---------------------------------------------------------------------------
// Geography: State -> District -> Block -> School
// ---------------------------------------------------------------------------
const STATE_DISTRICTS = {
  Maharashtra: ['Pune', 'Nashik', 'Nagpur'],
  'Uttar Pradesh': ['Lucknow', 'Varanasi', 'Kanpur Dehat'],
  Rajasthan: ['Jaipur', 'Udaipur', 'Jodhpur'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur'],
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur'],
  Karnataka: ['Bengaluru Rural', 'Mysuru', 'Belagavi'],
  'Tamil Nadu': ['Coimbatore', 'Madurai', 'Salem'],
  Gujarat: ['Ahmedabad', 'Surat', 'Rajkot'],
}

const SCHOOL_TEMPLATES = [
  "Govt. Girls' Higher Secondary School",
  'Zilla Parishad Girls School',
  'Kasturba Gandhi Balika Vidyalaya',
  'Govt. Senior Secondary School',
  'Adarsh Vidya Mandir',
  'Govt. Middle School',
]

const geoRng = createRng(20260817)

function buildGeography() {
  const states = Object.keys(STATE_DISTRICTS)
  const districtsByState = {}
  const blocksByDistrict = {}
  const schools = []

  states.forEach((state) => {
    districtsByState[state] = STATE_DISTRICTS[state]
    STATE_DISTRICTS[state].forEach((district) => {
      const blocks = [`${district} North`, `${district} South`]
      blocksByDistrict[district] = blocks
      blocks.forEach((block) => {
        for (let s = 0; s < 2; s++) {
          const template = pick(geoRng, SCHOOL_TEMPLATES)
          schools.push({
            state,
            district,
            block,
            school: `${template}, ${block}`,
          })
        }
      })
    })
  })

  return { states, districtsByState, blocksByDistrict, schools }
}

const GEO = buildGeography()
export const STATES = GEO.states
export const ALL_SCHOOLS = GEO.schools

export function districtsForState(state) {
  if (!state || state === 'all') return Object.values(GEO.districtsByState).flat()
  return GEO.districtsByState[state] || []
}

// ---------------------------------------------------------------------------
// Text pools
// ---------------------------------------------------------------------------
const REGIONAL_EXPERTS = [
  'Dr. Anjali Deshpande',
  'Mr. Rakesh Verma',
  'Ms. Priya Nair',
  'Mr. Suresh Iyer',
  'Ms. Kavita Sharma',
  'Dr. Farhan Ansari',
  'Ms. Meera Pillai',
  'Mr. Vikram Solanki',
]

const IEC_MATERIALS = ['Posters', 'Handbills', 'Standees', 'Booklets', 'Audio-visual clips']

const OBSERVATION_POOL = [
  'Strong enthusiasm from girl students; several expressed interest in electronics and fitter trades.',
  'Parents attending in good numbers; queries mainly around hostel facilities and safety.',
  'Teachers requested a follow-up session focused on career counselling.',
  'Community turnout lower than expected due to local harvest season.',
  'Positive engagement; local Gram Panchayat member offered to support future outreach.',
  'Session extended by 20 minutes to address questions on stipends and placement support.',
  'Girls asked detailed questions about safety and transport to the ITI campus.',
  'School principal requested IEC material in the local language for the notice board.',
  'High interest in electrician and IT trades among Class 10 girls.',
  'Some resistance from families around evening batch timings; noted for follow-up.',
]

const REMARK_POOL = [
  'Session conducted as per plan; documentation complete.',
  'Minor delay due to school event; adjusted schedule on-site.',
  'Follow-up visit recommended within two weeks.',
  'Awaiting signed attendance sheet from school administration.',
  'Excellent coordination with block education officer.',
  'Geo-tagged photo upload pending due to connectivity issue at site.',
  'Additional IEC material dropped for the school notice board.',
  'No issues to report.',
]

export const CHALLENGES_POOL = [
  'Connectivity issues in remote blocks delayed geo-tagged photo uploads.',
  'Overlap with school examinations reduced available session slots.',
  'Limited availability of female faculty for girls-only sessions in some districts.',
  'Transport constraints affected reach in remote blocks.',
  'IEC material stock ran low mid-period in one district; reorder placed.',
  'Weather disruption led to rescheduling of a few community sessions.',
]

export const OBSERVATIONS_POOL = [
  'Girls-only sessions consistently show higher engagement than mixed sessions.',
  'Districts with active local support show faster documentation turnaround.',
  'Community sessions in the evening see markedly better attendance.',
  'Schools with a resident regional expert report stronger feedback form completion.',
  'Repeat visits to the same school build stronger trust with parents.',
]

export const RECOMMENDATIONS_POOL = [
  'Deploy additional female facilitators to under-covered districts next cycle.',
  'Pre-position IEC stock ahead of scheduled sessions.',
  'Introduce offline photo capture with batch upload to address connectivity gaps.',
  'Align session calendar with school academic schedule to avoid exam clashes.',
  'Expand evening community session slots based on observed turnout patterns.',
]

// ---------------------------------------------------------------------------
// Daily Field Activities — the base dataset everything else rolls up from
// ---------------------------------------------------------------------------
const dailyRng = createRng(90210)
const WINDOW_DAYS = 120 // ~4 months of field activity, ending TODAY

function deriveStatus(rec) {
  const count = [rec.attendance, rec.feedback, rec.geoTaggedPhoto, rec.iecMaterial].filter(Boolean).length
  if (count === 4) return ACTIVITY_STATUS.COMPLETED
  if (count >= 2) return ACTIVITY_STATUS.PENDING_REVIEW
  return ACTIVITY_STATUS.FLAGGED
}

function generateDailyRecords() {
  const records = []
  const startDate = addDays(TODAY, -(WINDOW_DAYS - 1))
  let counter = 1

  for (let i = 0; i < WINDOW_DAYS; i++) {
    const date = addDays(startDate, i)
    const iso = toISODate(date)
    const isSunday = date.getDay() === 0

    let sessionsToday
    if (isSunday) {
      sessionsToday = chance(dailyRng, 0.12) ? 1 : 0
    } else {
      sessionsToday = pickWeighted(dailyRng, [
        { value: 0, weight: 6 },
        { value: 1, weight: 34 },
        { value: 2, weight: 38 },
        { value: 3, weight: 22 },
      ])
    }

    const daySchools = shuffle(dailyRng, ALL_SCHOOLS).slice(0, sessionsToday)

    daySchools.forEach((loc) => {
      const girlsReached = intBetween(dailyRng, 28, 85)
      const teachersReached = chance(dailyRng, 0.72) ? intBetween(dailyRng, 3, 14) : 0
      const communityReached = chance(dailyRng, 0.5) ? intBetween(dailyRng, 15, 60) : 0
      const totalParticipants = girlsReached + teachersReached + communityReached

      const attendance = chance(dailyRng, 0.86)
      const feedback = chance(dailyRng, 0.79)
      const geoTaggedPhoto = chance(dailyRng, 0.74)
      const iecMaterial = chance(dailyRng, 0.88)
      const iecTypes = iecMaterial ? shuffle(dailyRng, IEC_MATERIALS).slice(0, intBetween(dailyRng, 1, 3)) : []

      const rec = {
        id: `DA-${String(counter).padStart(4, '0')}`,
        date: iso,
        state: loc.state,
        district: loc.district,
        block: loc.block,
        school: loc.school,
        girlsReached,
        teachersReached,
        communityReached,
        totalParticipants,
        attendance,
        feedback,
        iecMaterial,
        iecTypes,
        geoTaggedPhoto,
        remarks: pick(dailyRng, REMARK_POOL),
        regionalExpert: pick(dailyRng, REGIONAL_EXPERTS),
        observation: pick(dailyRng, OBSERVATION_POOL),
      }
      rec.status = deriveStatus(rec)
      records.push(rec)
      counter++
    })
  }

  return records
}

export const DAILY_RECORDS = generateDailyRecords()

export const DATE_RANGE = {
  start: DAILY_RECORDS[0]?.date,
  end: DAILY_RECORDS[DAILY_RECORDS.length - 1]?.date,
}

// ---------------------------------------------------------------------------
// Weekly / Monthly series — Achieved is aggregated straight from the daily
// records above; Planned is a deterministic target scaled off Achieved, so
// "Planned vs Achieved" always stays in a believable, explainable range.
// ---------------------------------------------------------------------------
const planRng = createRng(660231)

function scaleTarget(value, floor) {
  const factor = 0.85 + planRng() * 0.35 // planned sits 0.85x–1.20x of achieved
  return value > 0 ? Math.max(floor, Math.round(value * factor)) : floor
}

function buildPlanned(achieved) {
  return {
    girls: scaleTarget(achieved.girls, 150),
    teachers: scaleTarget(achieved.teachers, 20),
    community: scaleTarget(achieved.community, 40),
    total: scaleTarget(achieved.total, 220),
    sessions: scaleTarget(achieved.sessions, 5),
  }
}

function buildSeries(groups, idx0) {
  return groups.map((g, idx) => {
    const achieved = { girls: g.girls, teachers: g.teachers, community: g.community, total: g.total, sessions: g.sessions }
    const seed = idx + idx0
    return {
      key: g.key,
      start: g.start,
      end: g.end,
      achieved,
      planned: buildPlanned(achieved),
      challenges: shuffle(planRng, CHALLENGES_POOL).slice(0, 2 + (seed % 2)),
      observations: shuffle(planRng, OBSERVATIONS_POOL).slice(0, 2),
      recommendations: shuffle(planRng, RECOMMENDATIONS_POOL).slice(0, 2),
    }
  })
}

const weeklyGroups = groupByWeek(DAILY_RECORDS)
export const WEEKLY_SERIES = buildSeries(weeklyGroups, 0).map((w) => ({
  ...w,
  label: `${formatDateShort(w.start)} – ${formatDateShort(w.end)}`,
}))

const monthlyGroups = groupByMonth(DAILY_RECORDS)
export const MONTHLY_SERIES = buildSeries(monthlyGroups, 11).map((m) => {
  const [y, mo] = m.key.split('-').map(Number)
  const label = new Date(y, mo - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  return { ...m, label }
})

export function latestWeek() {
  return WEEKLY_SERIES[WEEKLY_SERIES.length - 1]
}
export function latestMonth() {
  return MONTHLY_SERIES[MONTHLY_SERIES.length - 1]
}

// ---------------------------------------------------------------------------
// Programme-wide (all-time) rollups, used for the Executive Dashboard
// ---------------------------------------------------------------------------
export const PROGRAMME_TOTALS = {
  reach: sumReach(DAILY_RECORDS),
  sessions: sessionsByType(DAILY_RECORDS),
  coverage: coverage(DAILY_RECORDS),
  documentation: documentationCompletion(DAILY_RECORDS),
}
