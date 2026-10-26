import React, { useEffect, useMemo } from 'react'
import {
  Landmark,
  Map as MapIcon,
  School,
  CalendarCheck2,
  GraduationCap,
  Users,
  UsersRound,
  Sparkles,
  TrendingUp,
  FileCheck2,
  Trophy,
  Lightbulb,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import KPICard from '../components/ui/KPICard'
import ChartCard from '../components/charts/ChartCard'
import TrendAreaChart from '../components/charts/TrendAreaChart'
import DonutChart from '../components/charts/DonutChart'
import SimpleBarChart from '../components/charts/SimpleBarChart'
import ComparisonBarChart from '../components/charts/ComparisonBarChart'
import ProgressBar from '../components/ui/ProgressBar'
import { CHART_COLORS } from '../data/mockData'
import { achievementPct, percentChange } from '../utils/calculations'
import { formatNumber } from '../utils/formatters'
import { useAFCStore } from '../store/afcStore'

export default function Dashboard() {
  const { dashboard, dashboardLoading, dashboardError, fetchDashboard } = useAFCStore()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const { overview = {}, participationTrend = [], sessionsByType = [], sessionsBySessionType = [], stateDistrictDrilldown = [], plannedVsAchieved = [] } = dashboard || {}
  const reach = { students: overview.totalStudents, teachers: overview.totalStaff, community: overview.totalCommunityMembers, total: overview.totalParticipants }
  const sessions = {
    girls: sessionsByType.find((item) => item.name.toLowerCase().includes('girls'))?.value || 0,
    teachers: sessionsByType.find((item) => item.name.toLowerCase().includes('teacher'))?.value || 0,
    community: sessionsByType.find((item) => item.name.toLowerCase().includes('community'))?.value || 0,
    total: stateDistrictDrilldown.reduce((sum, state) => sum + Number(state.value || 0), 0),
  }
  const schoolSessions = sessionsBySessionType.find((item) => item.name === 'School')?.value ?? overview.totalSchoolSessions
  const communitySessions = sessionsBySessionType.find((item) => item.name === 'Community')?.value ?? overview.totalCommunitySessions
  const coverage = { states: overview.totalStates, districts: overview.totalDistricts, schools: overview.totalSchools, communities:overview.totalCommunitySessions }

  const trendData = useMemo(() => participationTrend.map((week) => ({ label: week.week, girls: week.girls, teachers: week.staff, community: week.community })), [participationTrend])

  const sessionsDonut = useMemo(
    () => sessionsByType.map((item, index) => ({ name: item.name, value: item.value, color: [CHART_COLORS.bloom, CHART_COLORS.primary, CHART_COLORS.growth][index] })),
    [sessionsByType]
  )

  const stateRanking = useMemo(() => stateDistrictDrilldown.slice().sort((a, b) => b.value - a.value).slice(0, 6), [stateDistrictDrilldown])
  const stateBarData = useMemo(
    () => stateRanking.map((state) => ({ name: state.state, value: state.value, color: CHART_COLORS.primary })),
    [stateRanking]
  )

  const latest = plannedVsAchieved[plannedVsAchieved.length - 1] || { month: 'Latest month', planned: 0, achieved: 0 }
  const plannedAchievedData = useMemo(
    () => [{ name: latest.month, planned: latest.planned, achieved: latest.achieved }],
    [latest]
  )
  const sessionsAchievementPct = achievementPct(latest.achieved, latest.planned)

  const insights = useMemo(() => {
    const topState = stateRanking[0] || { state: 'No state', value: 0 }
    const topStateShare = sessions.total ? Math.round((topState.value / sessions.total) * 100) : 0

    const previousMonth = plannedVsAchieved[plannedVsAchieved.length - 2]
    const momChange = previousMonth ? percentChange(latest.achieved, previousMonth.achieved) : null

    const girlsSessionShare = Math.round((sessions.girls / sessions.total) * 100)

    return [
      {
        icon: Trophy,
        accent: 'amber',
        text: `${topState.state} leads activity with ${formatNumber(topState.value)} logged sessions — ${topStateShare}% of the national total.`,
      },
      {
        icon: FileCheck2,
        accent: 'growth',
        text: `${formatNumber(sessions.total)} sessions are represented in the dashboard, across ${formatNumber(overview.totalBlocks || 0)} blocks.`,
      },
      {
        icon: TrendingUp,
        accent: 'primary',
        text:
          momChange === null
            ? `${latest.month} recorded ${formatNumber(latest.achieved)} completed sessions.`
            : `Completed sessions in ${latest.month} are ${momChange >= 0 ? 'up' : 'down'} ${Math.abs(momChange)}% versus the previous month.`,
      },
      {
        icon: GraduationCap,
        accent: 'bloom',
        text: `Girls-focused sessions make up ${girlsSessionShare}% of all field activity, reaching ${formatNumber(overview.totalFemaleStudents)} girl students to date.`,
      },
    ]
  }, [latest, overview, plannedVsAchieved, sessions, stateRanking])

  if (dashboardLoading && !dashboard) {
    return <DashboardMessage icon={Loader2} title="Loading dashboard" message="Fetching the latest programme metrics." loading />
  }

  if (dashboardError && !dashboard) {
    return <DashboardMessage icon={RefreshCw} title="Dashboard unavailable" message={dashboardError} action={<button onClick={fetchDashboard} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-700"><RefreshCw size={15} /> Retry</button>} />
  }

  if (!dashboard) return null

  return (
    <div>
      <PageHeader
        eyebrow="Executive Overview"
        title="Programme Dashboard"
        description="Scale, coverage and impact of awareness sessions to date, aggregated from the daily field activity log."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="States Covered"
          value={coverage.states}
          icon={Landmark}
          accent="primary"
          breakdown={[
            { label: 'Districts', value: coverage.districts },
            { label: 'Blocks', value: overview.totalBlocks },
            { label: 'Schools', value: coverage.schools },
          ]}
        />
        <KPICard
          label="Districts / Clusters Covered"
          value={coverage.districts}
          icon={MapIcon}
          accent="primary"
          breakdown={[
            { label: 'States', value: coverage.states },
            { label: 'Blocks', value: overview.totalBlocks },
            { label: 'Schools', value: coverage.schools },
          ]}
        />
        <KPICard
          label="Schools Outreach"
          value={coverage.schools}
          icon={School}
          accent="primary"
          total="400"
          breakdown={[
            { label: 'States', value: coverage.states },
            { label: 'Districts', value: coverage.districts },
            { label: 'School sessions', value: schoolSessions },
          ]}
        />
        <KPICard
          label="Community Outreach"
          value={coverage.communities}
          icon={CalendarCheck2}
          accent="amber"
          total="40"
          breakdown={[
            { label: 'School sessions', value: schoolSessions },
            { label: 'Community sessions', value: communitySessions },
            { label: 'Other session types', value: sessions.total - schoolSessions - communitySessions },
          ]}
        />
        <KPICard
          label="Total Students"
          value={reach.students}
          icon={GraduationCap}
          accent="bloom"
          breakdown={[
            { label: 'Female', value: overview.totalFemaleStudents },
            { label: 'Male', value: overview.totalMaleStudents },
            { label: 'Other', value: overview.totalOtherStudents },
          ]}
        />
        <KPICard
          label="Teachers/Principals Reached"
          value={reach.teachers}
          icon={Users}
          accent="primary"
          breakdown={[
            { label: 'Female', value: overview.totalFemaleStaff },
            { label: 'Male', value: overview.totalMaleStaff },
            { label: 'Other', value: overview.totalOtherStaff },
          ]}
        />
        <KPICard
          label="Community Members Reached"
          value={reach.community}
          icon={UsersRound}
          accent="growth"
          breakdown={[
            { label: 'Female', value: overview.totalFemaleCommunityMembers },
            { label: 'Male', value: overview.totalMaleCommunityMembers },
            { label: 'Other', value: overview.totalOtherCommunityMembers },
          ]}
        />
        <KPICard
          label="Total Participants"
          value={reach.total}
          icon={Sparkles}
          accent="growth"
          breakdown={[
            { label: 'Students', value: reach.students },
            { label: 'Teachers/Principals', value: reach.teachers },
            { label: 'Parents', value: overview.totalParents },
            { label: 'Community members', value: reach.community },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <ChartCard
          title="Participation Trend"
          subtitle="Weekly reach by audience, last 10 weeks"
          icon={TrendingUp}
          accent="primary"
          className="lg:col-span-2"
        >
          <TrendAreaChart data={trendData} />
        </ChartCard>

        <ChartCard title="Sessions by Type" subtitle="Share of all logged sessions" icon={CalendarCheck2} accent="bloom">
          <DonutChart data={sessionsDonut} centerValue={formatNumber(sessions.total)} centerLabel="Sessions" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Geographic Performance" subtitle="Top states by logged sessions" icon={MapIcon} accent="primary">
          <SimpleBarChart data={stateBarData} layout="horizontal" height={280} showLabels />
        </ChartCard>

        <ChartCard
          title="Planned vs Achieved"
          subtitle={`${latest.month} — planned vs completed sessions`}
          icon={Trophy}
          accent="growth"
        >
          <ComparisonBarChart data={plannedAchievedData} height={220} />
          <div className="mt-4 pt-4 border-t border-slate-50">
            <ProgressBar
              label={`Completed sessions — ${formatNumber(latest.achieved)} of ${formatNumber(latest.planned)} planned`}
              value={sessionsAchievementPct}
              color={sessionsAchievementPct >= 100 ? 'growth' : sessionsAchievementPct >= 70 ? 'primary' : 'amber'}
            />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Management Insights" subtitle="Highlights from the dashboard API" icon={Lightbulb} accent="amber">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {insights.map((insight, idx) => {
            const Icon = insight.icon
            const accentBg = {
              primary: 'bg-primary-50 text-primary-700',
              bloom: 'bg-bloom-light text-bloom-dark',
              growth: 'bg-growth-light text-growth-dark',
              amber: 'bg-amber-light text-amber-dark',
            }[insight.accent]
            return (
              <div key={idx} className="flex items-start gap-3 bg-slate-50/70 rounded-xl p-4">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${accentBg}`}>
                  <Icon size={15} />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{insight.text}</p>
              </div>
            )
          })}
        </div>
      </ChartCard>
    </div>
  )
}

function DashboardMessage({ icon: Icon, title, message, action, loading = false }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
      <Icon size={28} className={`mb-3 text-primary-600 ${loading ? 'animate-spin' : ''}`} />
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
