import React, { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck2,
  Sparkles,
  School,
  Target,
  TrendingUp,
  Trophy,
  AlertTriangle,
  Eye,
  Lightbulb,
  Loader2,
  RefreshCw,
  Download,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import KPICard from '../components/ui/KPICard'
import ChartCard from '../components/charts/ChartCard'
import SimpleBarChart from '../components/charts/SimpleBarChart'
import TrendAreaChart from '../components/charts/TrendAreaChart'
import ProgressBar from '../components/ui/ProgressBar'
import RankingList from '../components/ui/RankingList'
import Card, { CardHeader } from '../components/ui/Card'
import { CHART_COLORS } from '../data/mockData'
import { percentChange } from '../utils/calculations'
import { formatNumber } from '../utils/formatters'
import { useAFCStore } from '../store/afcStore'

const MODES = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

const AUDIENCE_SERIES = [
  { key: 'students', label: 'Students', color: CHART_COLORS.bloom },
  { key: 'staff', label: 'Staff', color: CHART_COLORS.primary },
  { key: 'parents', label: 'Parents', color: CHART_COLORS.amber },
  { key: 'community', label: 'Community', color: CHART_COLORS.growth },
]

const QUALITATIVE_GROUPS = ['Student', 'Teacher/Principal', 'Community Member', 'Parent']
const QUALITATIVE_FIELDS = [
  { field: 'session_assesment', label: 'Session assessment' },
  { field: 'key_concern', label: 'Key concerns, barriers or challenges' },
  { field: 'perception_change', label: 'Changes in understanding or perception' },
  { field: 'suggestion', label: 'Suggestions, recommendations or feedback' },
]
const REPORT_MEDIA_FIELDS = [
  { field: 'session_images_links', label: 'Session images' },
  { field: 'geo-taggedPhotos_links', label: 'Geo-tagged photos' },
  { field: 'attendance_sheets_links', label: 'Attendance sheets' },
  { field: 'consent_forms_links', label: 'Consent forms' },
  { field: 'feedback_forms_links', label: 'Feedback forms' },
  { field: 'IEC_materials_photos_links', label: 'IEC material photos' },
  { field: 'session_videos_links', label: 'Session videos' },
]
const OUTREACH_REPORT_HEADERS = [
  'Sl No',
  'Session activity',
  'Session category',
  'Date of outreach (DD-MM-YYYY)',
  'Name of school / community / ITI',
  'State',
  'District / cluster',
  'Block',
  'Gram Panchayat',
  'Address',
  'Name of nearest ITI',
  'ITI code',
  'ITI representative name',
  'ITI representative contact',
  'School representative name',
  'School representative contact',
  'Total students',
  'Male students',
  'Female students',
  'Other students',
  'PwD students',
  'Female principals / teachers',
  'Male principals / teachers',
  'Other principals / teachers',
  'Male parents',
  'Female parents',
  'Other parents',
  'Female community members',
  'Male community members',
  'Other community members',
  'IEC materials distributed',
  'Total feedback forms filled',
  'Observation',
  'Session remarks',
  ...QUALITATIVE_GROUPS.flatMap((group) => QUALITATIVE_FIELDS.map(
    ({ label }) => `${group} — ${label}`
  )),
  'Qualitative analysis remarks',
  'Direct quotes',
  'Expert ID',
  ...REPORT_MEDIA_FIELDS.map(({ label }) => `${label} (signed URL)`),
]

const sessionCount = (session, field) => Number(session[field] || 0)
const linksText = (value) => Array.isArray(value)
  ? value.map((link) => typeof link === 'string' ? link : link?.url).filter(Boolean).join('\n')
  : ''

function isInPeriod(sessionDate, period) {
  return Boolean(period && sessionDate >= period.start && sessionDate <= period.end)
}

function toOutreachReportRow(session, index, mediaLinks = {}) {
  const femaleStudents = sessionCount(session, 'female_students')
  const maleStudents = sessionCount(session, 'male_students')
  const otherStudents = sessionCount(session, 'other_students')
  const qualitative = session.qualitative_report || {}
  const assessments = Array.isArray(qualitative.assesment_data) ? qualitative.assesment_data : []
  const directQuotes = Array.isArray(qualitative.direct_quotes)
    ? qualitative.direct_quotes
      .filter(Boolean)
      .map(({ type, name, quote }) => `${type || ''} — ${name || ''}: ${quote || ''}`)
      .join('\n')
    : ''

  return [
    index + 1,
    session.type_of_outreach || '',
    session.type_of_session || '',
    session.session_date ? session.session_date.split('-').reverse().join('-') : '',
    session.name_of_session || '',
    session.state || '',
    session.district || '',
    session.block || '',
    session.gram_panchayat || '',
    session.address || '',
    session.ITI_name || '',
    session.ITI_code || '',
    session.iti_rep_name || '',
    session.iti_rep_contact ?? '',
    session.school_rep_name || '',
    session.school_rep_contact ?? '',
    femaleStudents + maleStudents + otherStudents,
    maleStudents,
    femaleStudents,
    otherStudents,
    sessionCount(session, 'pwd_students'),
    sessionCount(session, 'female_staff'),
    sessionCount(session, 'male_staff'),
    sessionCount(session, 'other_staff'),
    sessionCount(session, 'male_parents'),
    sessionCount(session, 'female_parents'),
    sessionCount(session, 'other_parents'),
    sessionCount(session, 'female_community_members'),
    sessionCount(session, 'male_community_members'),
    sessionCount(session, 'other_community_members'),
    session.total_iec_materials_distributed ?? 0,
    session.total_feedbackform_filled ?? 0,
    session.observation || '',
    session.remarks || '',
    ...QUALITATIVE_GROUPS.flatMap((group) => {
      const assessment = assessments.find((item) => item?.type === group) || {}
      return QUALITATIVE_FIELDS.map(({ field }) => assessment[field] || '')
    }),
    qualitative.remarks || '',
    directQuotes,
    session.expert_id || '',
    ...REPORT_MEDIA_FIELDS.map(({ field }) => linksText(mediaLinks[field])),
  ]
}

function makeReportSheet(XLSX, sessions, mediaBySession) {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Session Report'],
    OUTREACH_REPORT_HEADERS,
    ...sessions.map((session, index) => toOutreachReportRow(
      session,
      index,
      mediaBySession.get(session.id)
    )),
  ])
  sheet['!cols'] = OUTREACH_REPORT_HEADERS.map((header) => ({
    wch: header.includes('(signed URL)') ? 42 : header.length > 32 ? 34 : 22,
  }))
  return sheet
}

function makeMediaLinksSheet(XLSX, sessions, mediaBySession) {
  const rows = [['Date', 'Session activity', 'Name', 'Media category', 'Signed URL']]
  sessions.forEach((session) => {
    const links = mediaBySession.get(session.id) || {}
    REPORT_MEDIA_FIELDS.forEach(({ field, label }) => {
      const urls = links[field] || []
      urls.forEach((url) => {
        rows.push([
          session.session_date ? session.session_date.split('-').reverse().join('-') : '',
          session.type_of_outreach || '',
          session.name_of_session || '',
          label,
          url,
        ])
      })
    })
  })

  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 32 }, { wch: 24 }, { wch: 72 }]
  rows.slice(1).forEach((row, index) => {
    const cell = sheet[XLSX.utils.encode_cell({ r: index + 1, c: 4 })]
    if (cell) cell.l = { Target: row[4], Tooltip: row[3] }
  })
  return sheet
}

export default function Performance() {
  const [mode, setMode] = useState('weekly')
  const [downloadError, setDownloadError] = useState('')
  const performance = useAFCStore((store) => store.performance)
  const performanceLoading = useAFCStore((store) => store.performanceLoading)
  const performanceError = useAFCStore((store) => store.performanceError)
  const fetchPerformance = useAFCStore((store) => store.fetchPerformance)
  const fetchSessionDocumentationForSessions = useAFCStore((store) => store.fetchSessionDocumentationForSessions)

  useEffect(() => {
    fetchPerformance()
  }, [fetchPerformance])

  const series = performance?.[mode] || []
  const latest = series[series.length - 1]
  const previous = series[series.length - 2]
  const stateRanking = performance?.stateRanking || []
  const latestWeekly = performance?.weekly?.[performance.weekly.length - 1]
  const latestMonthly = performance?.monthly?.[performance.monthly.length - 1]
  const trendData = useMemo(
    () => (mode === 'weekly' ? series.slice(-10) : series)
      .map((period) => ({ label: period.label, ...period.achieved })),
    [series, mode]
  )

  const downloadReports = async () => {
    setDownloadError('')
    try {
      const XLSX = await import('xlsx')
      const reportRows = performance?.reportRows || []
      const weeklyRows = reportRows
        .filter((session) => isInPeriod(session.session_date, latestWeekly))
      const monthlyRows = reportRows
        .filter((session) => isInPeriod(session.session_date, latestMonthly))
      const sessionIds = [...new Set([...weeklyRows, ...monthlyRows].map((session) => session.id).filter(Boolean))]
      const mediaBySession = new Map()
      for (let index = 0; index < sessionIds.length; index += 200) {
        const signedMedia = await fetchSessionDocumentationForSessions(sessionIds.slice(index, index + 200))
        signedMedia.forEach(({ sessionId, links }) => mediaBySession.set(sessionId, links))
      }
      const workbook = XLSX.utils.book_new()
      const weeklySheet = makeReportSheet(XLSX, weeklyRows, mediaBySession)
      const monthlySheet = makeReportSheet(XLSX, monthlyRows, mediaBySession)
      const uniqueReportSessions = [...new Map([...weeklyRows, ...monthlyRows]
        .map((session) => [session.id, session])).values()]
      XLSX.utils.book_append_sheet(workbook, weeklySheet, 'Weekly Report')
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Report')
      XLSX.utils.book_append_sheet(
        workbook,
        makeMediaLinksSheet(XLSX, uniqueReportSessions, mediaBySession),
        'Media Links'
      )
      XLSX.writeFile(workbook, `School_Outreach_Reports_${latestWeekly?.start || 'weekly'}_${latestMonthly?.key || 'monthly'}.xlsx`)
    } catch (error) {
      setDownloadError(error?.message || 'Unable to generate the Excel report.')
    }
  }

  if (performanceLoading && !performance) {
    return <PerformanceMessage icon={Loader2} title="Loading performance" message="Fetching session and qualitative report data." loading />
  }

  if (performanceError && !performance) {
    return (
      <PerformanceMessage
        icon={RefreshCw}
        title="Performance unavailable"
        message={performanceError}
        action={<button type="button" onClick={fetchPerformance} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-700"><RefreshCw size={15} /> Retry</button>}
      />
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Performance & Impact"
        title="Weekly & Monthly Performance"
        description="Outreach activity, participant reach, state rankings and qualitative learnings from submitted reports."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {MODES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    mode === item.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={downloadReports}
              disabled={!latestWeekly && !latestMonthly}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Download Excel
            </button>
          </div>
        }
      />

      {downloadError && (
        <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {downloadError}
        </p>
      )}

      {performanceError && (
        <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {performanceError}
        </p>
      )}

      {!latest ? (
        <Card className="text-center text-sm text-slate-500">
          No session records are available for this reporting period yet.
        </Card>
      ) : (
        <>
          <p className="mb-4 -mt-3 text-xs font-medium text-slate-400">
            Showing {mode === 'weekly' ? 'week' : 'month'} of <span className="font-semibold text-ink">{latest.label}</span>
            {previous && <> vs previous {mode === 'weekly' ? 'week' : 'month'}</>}
          </p>

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard
              label="Sessions Conducted"
              value={latest.achieved.sessions}
              icon={CalendarCheck2}
              accent="amber"
              trend={previous ? percentChange(latest.achieved.sessions, previous.achieved.sessions) : undefined}
            />
            <KPICard
              label="Total Participants"
              value={latest.achieved.total}
              icon={Sparkles}
              accent="growth"
              trend={previous ? percentChange(latest.achieved.total, previous.achieved.total) : undefined}
            />
            <KPICard
              label="Schools Covered"
              value={latest.schools}
              icon={School}
              accent="primary"
              trend={previous ? percentChange(latest.schools, previous.schools) : undefined}
            />
            <KPICard
              label="Session Completion"
              value={latest.completionRate}
              suffix="%"
              icon={Target}
              accent="bloom"
              sub={`${formatNumber(latest.achieved.completedSessions)} of ${formatNumber(latest.achieved.sessions)} sessions completed`}
            />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Participants by Audience" subtitle={`${latest.label} — actual participant counts`} icon={Target} accent="primary">
              <SimpleBarChart data={latest.audience} layout="horizontal" height={240} showLabels />
              <div className="mt-4 border-t border-slate-50 pt-4">
                <ProgressBar
                  label={`Completed sessions — ${formatNumber(latest.achieved.completedSessions)} of ${formatNumber(latest.achieved.sessions)}`}
                  value={latest.completionRate}
                  color={latest.completionRate >= 100 ? 'growth' : latest.completionRate >= 70 ? 'primary' : 'amber'}
                />
              </div>
            </ChartCard>

            <ChartCard title="State Performance Ranking" subtitle="Top states across all reporting periods by participants" icon={Trophy} accent="amber">
              {stateRanking.length > 0
                ? <RankingList items={stateRanking} progressColor="amber" valueLabel="participants" />
                : <EmptyInsight>No state participant data for this period.</EmptyInsight>}
            </ChartCard>
          </div>

          <ChartCard
            title="Participation & Session Trend"
            subtitle={mode === 'weekly' ? 'Last 10 weeks, by participant group' : 'All months, by participant group'}
            icon={TrendingUp}
            accent="growth"
            className="mb-5"
          >
            <TrendAreaChart data={trendData} series={AUDIENCE_SERIES} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <InsightCard title="Challenges" icon={AlertTriangle} accent="amber" items={latest.challenges} />
            <InsightCard title="Observations" icon={Eye} accent="primary" items={latest.observations} />
            <InsightCard title="Recommendations" icon={Lightbulb} accent="growth" items={latest.recommendations} />
          </div>
        </>
      )}
    </div>
  )
}

function InsightCard({ title, icon, accent, items }) {
  return (
    <Card>
      <CardHeader title={title} icon={icon} accent={accent} />
      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyInsight>No entries submitted for this period.</EmptyInsight>
      )}
    </Card>
  )
}

function EmptyInsight({ children }) {
  return <p className="py-8 text-center text-sm text-slate-400">{children}</p>
}

function PerformanceMessage({ icon: Icon, title, message, action, loading = false }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <Icon size={26} className={`mb-3 text-primary-500 ${loading ? 'animate-spin' : ''}`} />
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
