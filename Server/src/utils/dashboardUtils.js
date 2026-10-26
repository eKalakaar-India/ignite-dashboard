const normalizeValue = (value) => {
  if (value == null || value === '') return null
  return String(value).trim()
}

const normalizeNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const sumFields = (row, fields) =>
  fields.reduce((total, field) => total + normalizeNumber(row[field]), 0)

const STUDENT_FIELDS = ['male_students', 'female_students', 'other_students']
const STAFF_FIELDS = ['female_staff', 'male_staff', 'other_staff']
const PARENT_FIELDS = ['male_parents', 'female_parents', 'other_parents']
const COMMUNITY_FIELDS = [
  'female_community_members',
  'male_community_members',
  'other_community_members',
]

const PERFORMANCE_AUDIENCES = {
  students: STUDENT_FIELDS,
  staff: STAFF_FIELDS,
  parents: PARENT_FIELDS,
  community: COMMUNITY_FIELDS,
}

const PERFORMANCE_AUDIENCE_LABELS = {
  students: 'Students',
  staff: 'Staff',
  parents: 'Parents',
  community: 'Community',
}

const PERFORMANCE_AUDIENCE_COLORS = {
  students: '#E879A9',
  staff: '#5865C7',
  parents: '#E8A83E',
  community: '#44A984',
}

const dateKey = (date) => date.toISOString().slice(0, 10)

const weekStartFor = (dateString) => {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - daysSinceMonday)
  return date
}

const formatPeriodLabel = (date, mode) => {
  if (mode === 'monthly') {
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  }
  const end = new Date(date)
  end.setUTCDate(end.getUTCDate() + 6)
  const options = { day: '2-digit', month: 'short', timeZone: 'UTC' }
  return `${date.toLocaleDateString('en-IN', options)} – ${end.toLocaleDateString('en-IN', options)}`
}

const textOrNull = (value) => normalizeValue(value)

const addUniqueInsights = (target, values) => {
  values.forEach((value) => {
    const text = textOrNull(value)
    if (text && !target.includes(text)) target.push(text)
  })
}

const createPerformancePeriod = (key, mode, sessions, reportsBySession) => {
  const firstDate = mode === 'weekly'
    ? new Date(`${key}T00:00:00.000Z`)
    : new Date(`${key}-01T00:00:00.000Z`)
  const lastDate = mode === 'weekly'
    ? new Date(firstDate.getTime() + 6 * 86400000)
    : new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth() + 1, 0))

  const achieved = {
    sessions: sessions.length,
    completedSessions: sessions.filter((session) => session.status === 'Completed').length,
    students: 0,
    staff: 0,
    parents: 0,
    community: 0,
    total: 0,
  }
  const schools = new Set()
  const states = new Map()
  const challenges = []
  const observations = []
  const recommendations = []

  sessions.forEach((session) => {
    Object.entries(PERFORMANCE_AUDIENCES).forEach(([audience, fields]) => {
      achieved[audience] += sumFields(session, fields)
    })
    if (session.type_of_session === 'School' && normalizeValue(session.name_of_session)) {
      schools.add(normalizeValue(session.name_of_session))
    }

    const state = normalizeValue(session.state) || 'Unknown'
    if (!states.has(state)) states.set(state, 0)
    states.set(state, states.get(state) + Object.values(PERFORMANCE_AUDIENCES)
      .reduce((sum, fields) => sum + sumFields(session, fields), 0))
    addUniqueInsights(observations, [session.observation])

    const qualitative = reportsBySession.get(session.id) || []
    qualitative.forEach((report) => {
      const assessments = Array.isArray(report.assesment_data) ? report.assesment_data : []
      assessments.forEach((assessment) => {
        addUniqueInsights(challenges, [assessment.key_concern])
        addUniqueInsights(observations, [assessment.perception_change])
        addUniqueInsights(recommendations, [assessment.suggestion])
      })
    })
  })

  achieved.total = achieved.students + achieved.staff + achieved.parents + achieved.community
  const topStateParticipants = Math.max(0, ...states.values())

  return {
    key,
    start: dateKey(firstDate),
    end: dateKey(lastDate),
    label: formatPeriodLabel(firstDate, mode),
    achieved,
    schools: schools.size,
    completionRate: achieved.sessions
      ? Math.round((achieved.completedSessions / achieved.sessions) * 100)
      : 0,
    audience: Object.keys(PERFORMANCE_AUDIENCES).map((name) => ({
      name: PERFORMANCE_AUDIENCE_LABELS[name],
      value: achieved[name],
      color: PERFORMANCE_AUDIENCE_COLORS[name],
    })),
    stateRanking: Array.from(states, ([name, value]) => ({
      name,
      value,
      progress: topStateParticipants ? Math.round((value / topStateParticipants) * 100) : 0,
    })).sort((a, b) => b.value - a.value).slice(0, 6),
    challenges: challenges.slice(0, 5),
    observations: observations.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
  }
}

const buildStateParticipantRanking = (sessions) => {
  const stateParticipants = new Map()

  sessions.forEach((session) => {
    const state = normalizeValue(session.state)
    if (!state) return

    const participants = Object.values(PERFORMANCE_AUDIENCES)
      .reduce((total, fields) => total + sumFields(session, fields), 0)
    stateParticipants.set(state, (stateParticipants.get(state) || 0) + participants)
  })

  const highestTotal = Math.max(0, ...stateParticipants.values())
  return Array.from(stateParticipants, ([name, value]) => ({
    name,
    value,
    progress: highestTotal ? Math.round((value / highestTotal) * 100) : 0,
  })).sort((a, b) => b.value - a.value).slice(0, 6)
}

export const buildPerformanceData = (sessions, qualitativeReports = []) => {
  const reportsBySession = new Map()
  qualitativeReports.forEach((report) => {
    if (!reportsBySession.has(report.session_id)) reportsBySession.set(report.session_id, [])
    reportsBySession.get(report.session_id).push(report)
  })
  const reportBySessionAndType = new Map(
    qualitativeReports.map((report) => [`${report.session_id}:${report.outreach_type}`, report])
  )

  const weeklyGroups = new Map()
  const monthlyGroups = new Map()
  sessions.forEach((session) => {
    if (!session.session_date) return
    const weekKey = dateKey(weekStartFor(session.session_date))
    const monthKey = session.session_date.slice(0, 7)
    if (!weeklyGroups.has(weekKey)) weeklyGroups.set(weekKey, [])
    if (!monthlyGroups.has(monthKey)) monthlyGroups.set(monthKey, [])
    weeklyGroups.get(weekKey).push(session)
    monthlyGroups.get(monthKey).push(session)
  })

  return {
    stateRanking: buildStateParticipantRanking(sessions),
    reportRows: sessions.map((session) => ({
      ...session,
      qualitative_report: reportBySessionAndType.get(
        `${session.id}:${String(session.type_of_session || '').toUpperCase()}`
      ) || null,
    })),
    weekly: Array.from(weeklyGroups, ([key, rows]) =>
      createPerformancePeriod(key, 'weekly', rows, reportsBySession)
    ).sort((a, b) => a.start.localeCompare(b.start)),
    monthly: Array.from(monthlyGroups, ([key, rows]) =>
      createPerformancePeriod(key, 'monthly', rows, reportsBySession)
    ).sort((a, b) => a.start.localeCompare(b.start)),
  }
}

export const buildOverviewMetrics = (rows) => {
  const states = new Set()
  const districts = new Set()
  const blocks = new Set()
  const schools = new Set()
  let totalFemaleStudents = 0
  let totalMaleStudents = 0
  let totalOtherStudents = 0
  let totalPwdStudents = 0
  let totalFemaleStaff = 0
  let totalMaleStaff = 0
  let totalOtherStaff = 0
  let totalStaff = 0
  let totalParents = 0
  let totalFemaleCommunityMembers = 0
  let totalMaleCommunityMembers = 0
  let totalOtherCommunityMembers = 0
  let totalCommunityMembers = 0
  let totalSchoolSessions = 0
  let totalCommunitySessions = 0

  rows.forEach((row) => {
    const state = normalizeValue(row.state)
    const district = normalizeValue(row.district)
    const block = normalizeValue(row.block)
    const sessionName = normalizeValue(row.name_of_session)

    if (state) states.add(state)
    if (district) districts.add(district)
    if (block) blocks.add(block)
    if (row.type_of_session === 'School') {
      totalSchoolSessions += 1
      if (sessionName) schools.add(sessionName)
    }
    if (row.type_of_session === 'Community') totalCommunitySessions += 1

    totalFemaleStudents += normalizeNumber(row.female_students)
    totalMaleStudents += normalizeNumber(row.male_students)
    totalOtherStudents += normalizeNumber(row.other_students)
    totalPwdStudents += normalizeNumber(row.pwd_students)
    totalFemaleStaff += normalizeNumber(row.female_staff)
    totalMaleStaff += normalizeNumber(row.male_staff)
    totalOtherStaff += normalizeNumber(row.other_staff)
    totalStaff += sumFields(row, STAFF_FIELDS)
    totalParents += sumFields(row, PARENT_FIELDS)
    totalFemaleCommunityMembers += normalizeNumber(row.female_community_members)
    totalMaleCommunityMembers += normalizeNumber(row.male_community_members)
    totalOtherCommunityMembers += normalizeNumber(row.other_community_members)
    totalCommunityMembers += sumFields(row, COMMUNITY_FIELDS)
  })

  const totalStudents = totalFemaleStudents + totalMaleStudents + totalOtherStudents
  return {
    totalStates: states.size,
    totalDistricts: districts.size,
    totalBlocks: blocks.size,
    totalSchools: schools.size,
    totalSchoolSessions,
    totalCommunitySessions,
    totalStudents,
    totalFemaleStudents,
    totalMaleStudents,
    totalOtherStudents,
    totalPwdStudents,
    totalGirls: totalFemaleStudents,
    totalFemaleStaff,
    totalMaleStaff,
    totalOtherStaff,
    totalStaff,
    totalParents,
    totalFemaleCommunityMembers,
    totalMaleCommunityMembers,
    totalOtherCommunityMembers,
    totalCommunityMembers,
    totalParticipants: totalStudents + totalStaff + totalParents + totalCommunityMembers,
  }
}

export const buildParticipationTrend = (sessions) => {
  const tenWeeksAgo = new Date()
  tenWeeksAgo.setDate(tenWeeksAgo.getDate() - (10 * 7))
  const weekMap = new Map()

  sessions.forEach((session) => {
    if (!session.session_date) return
    const sessionDate = new Date(session.session_date)
    if (sessionDate < tenWeeksAgo) return

    const weekStart = getWeekStart(sessionDate)
    const weekKey = weekStart.toISOString().split('T')[0]
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        week: formatWeekLabel(weekStart),
        girls: 0,
        staff: 0,
        parents: 0,
        community: 0,
        totalParticipants: 0,
      })
    }

    const current = weekMap.get(weekKey)
    const femaleStudents = normalizeNumber(session.female_students)
    const students = sumFields(session, STUDENT_FIELDS)
    const staff = sumFields(session, STAFF_FIELDS)
    const parents = sumFields(session, PARENT_FIELDS)
    const community = sumFields(session, COMMUNITY_FIELDS)
    current.girls += femaleStudents
    current.staff += staff
    current.parents += parents
    current.community += community
    current.totalParticipants += students + staff + parents + community
  })

  return Array.from(weekMap.values()).slice(-10)
}

const getWeekStart = (date) => {
  const result = new Date(date)
  const day = result.getDay()
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day))
  result.setHours(0, 0, 0, 0)
  return result
}

const formatWeekLabel = (date) =>
  date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

export const buildSessionsByType = (sessions) => {
  const result = { girls: 0, staff: 0, community: 0 }
  sessions.forEach((session) => {
    const type = String(session.type_of_outreach || '').trim().toLowerCase()
    if (type === 'school girls') result.girls += 1
    if (type === 'staff') result.staff += 1
    if (type === 'community') result.community += 1
  })

  return [
    { name: "Girls' Sessions", value: result.girls },
    { name: 'Teacher/Principal Sessions', value: result.staff },
    { name: 'Community Sessions', value: result.community },
  ]
}

export const buildSessionsBySessionType = (sessions) => {
  const totals = { School: 0, Community: 0 }
  sessions.forEach((session) => {
    if (Object.prototype.hasOwnProperty.call(totals, session.type_of_session)) {
      totals[session.type_of_session] += 1
    }
  })
  return Object.entries(totals).map(([name, value]) => ({ name, value }))
}

export const buildStateDistrictDrilldown = (sessions) => {
  const stateMap = new Map()
  sessions.forEach((session) => {
    const state = normalizeValue(session.state) || 'Unknown'
    const district = normalizeValue(session.district) || 'Unknown'
    if (!stateMap.has(state)) stateMap.set(state, { state, total: 0, districts: new Map() })
    const stateData = stateMap.get(state)
    stateData.total += 1
    stateData.districts.set(district, (stateData.districts.get(district) || 0) + 1)
  })
  return Array.from(stateMap.values()).map((stateData) => ({
    state: stateData.state,
    value: stateData.total,
    districts: Array.from(stateData.districts.entries())
      .map(([district, value]) => ({ district, value }))
      .sort((a, b) => b.value - a.value),
  }))
}

export const buildMonthlyPlannedVsAchieved = (sessions) => {
  const monthMap = new Map()
  sessions.forEach((session) => {
    if (!session.session_date) return
    const date = new Date(session.session_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        planned: 0,
        achieved: 0,
      })
    }
    const monthData = monthMap.get(monthKey)
    monthData.planned += 1
    if (session.status === 'Completed') monthData.achieved += 1
  })
  return Array.from(monthMap.values())
}
