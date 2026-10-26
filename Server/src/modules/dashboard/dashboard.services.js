import dashboardRepository from './dashboard.repository.js'
import {
  buildOverviewMetrics,
  buildParticipationTrend,
  buildSessionsByType,
  buildSessionsBySessionType,
  buildStateDistrictDrilldown,
  buildMonthlyPlannedVsAchieved,
  buildPerformanceData,
} from '../../utils/dashboardUtils.js'

const getDashboardData = async () => {
  const [overviewRows, sessionRows] = await Promise.all([
    dashboardRepository.getOverviewData(),
    dashboardRepository.getAllSessions(),
  ])

  const overview = buildOverviewMetrics(overviewRows)

  const participationTrend = buildParticipationTrend(sessionRows)

  const sessionsByType = buildSessionsByType(sessionRows)
  const sessionsBySessionType = buildSessionsBySessionType(sessionRows)

  const stateDistrictDrilldown =
    buildStateDistrictDrilldown(sessionRows)

  const plannedVsAchieved =
    buildMonthlyPlannedVsAchieved(sessionRows)

  return {
    overview,
    participationTrend,
    sessionsByType,
    sessionsBySessionType,
    stateDistrictDrilldown,
    plannedVsAchieved,
  }
}

const getPerformanceData = async () => {
  const { sessions, qualitativeReports } = await dashboardRepository.getPerformanceData()
  return buildPerformanceData(sessions, qualitativeReports)
}

export default {
  getDashboardData,
  getPerformanceData,
}