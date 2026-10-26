import React, { useMemo, useState, useEffect } from 'react'
import {
  FileCheck2,
  ClipboardList,
  MessageSquareText,
  BookOpen,
  Camera,
  Search,
  RotateCcw,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import ChartCard from '../components/charts/ChartCard'
import ProgressBar from '../components/ui/ProgressBar'
import ProgressRing from '../components/ui/ProgressRing'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import DataTable from '../components/table/DataTable'
import DetailDrawer from '../components/table/DetailDrawer'
import { missingDocLabels } from '../components/ui/DocIndicators'
import { documentationCompletion, filterRecords } from '../utils/calculations'
import { formatDateShort } from '../utils/dateUtils'
import { formatNumber } from '../utils/formatters'
import { useAFCStore } from '../store/afcStore'

export default function DocumentationPage() {
  const [search, setSearch] = useState('')
  const [state, setState] = useState('all')
  const [district, setDistrict] = useState('all')
  const [selected, setSelected] = useState(null)
  const fetchSessions = useAFCStore((store) => store.fetchSessions)
  const sessions = useAFCStore((store) => store.sessions)
  const sessionsLoading = useAFCStore((store) => store.sessionsLoading)
  const sessionsError = useAFCStore((store) => store.sessionsError)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const records = useMemo(() => sessions.map(mapSessionToDocumentationRecord), [sessions])
  const doc = useMemo(() => documentationCompletion(records), [records])
  const states = useMemo(
    () => [...new Set(records.map((record) => record.state).filter(Boolean))].sort(),
    [records]
  )
  const districtOptions = useMemo(
    () => [...new Set(
      records
        .filter((record) => state === 'all' || record.state === state)
        .map((record) => record.district)
        .filter(Boolean)
    )].sort(),
    [records, state]
  )

  function handleState(v) {
    setState(v)
    setDistrict('all')
  }

  const breakdown = [
    { key: 'attendance', label: 'Attendance Sheets', icon: ClipboardList, pct: doc.attendancePct, count: doc.counts.attendance, color: 'primary' },
    { key: 'consent', label: 'Consent Forms', icon: FileCheck2, pct: doc.consentPct, count: doc.counts.consent, color: 'bloom' },
    { key: 'feedback', label: 'Feedback Forms', icon: MessageSquareText, pct: doc.feedbackPct, count: doc.counts.feedback, color: 'bloom' },
    { key: 'iec', label: 'IEC Materials Distributed', icon: BookOpen, pct: doc.iecPct, count: doc.counts.iec, color: 'amber' },
    { key: 'geoPhoto', label: 'Geo-tagged Photos', icon: Camera, pct: doc.geoPhotoPct, count: doc.counts.geoPhoto, color: 'growth' },
  ]

  const incompleteAll = useMemo(
    () => records.filter((record) => missingDocLabels(record).length > 0),
    [records]
  )
  const fullyDocumentedCount = records.length - incompleteAll.length

  const incompleteFiltered = useMemo(
    () => filterRecords(incompleteAll, { search, state, district }),
    [incompleteAll, search, state, district]
  )
  const isDefault = !search && state === 'all' && district === 'all'

  const columns = [
    {
      key: 'session_date',
      label: 'Date',
      sortable: true,
      render: (r) => <span className="font-medium">{formatDateShort(r.session_date)}</span>,
    },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'expert', label: "Expert's Data", sortable: true, render: (r) => <span className="tabular font-small text-slate">{r.expert_data?.name} / {r.expert_data?.phone_no}</span> },
    { key: 'state', label: 'State', sortable: true },
    { key: 'district', label: 'District', sortable: true },
    {
      key: 'name_of_session',
      label: 'School / Community',
      render: (r) => (
        <span className="block max-w-[220px] truncate" title={r.name_of_session}>
          {r.name_of_session}
        </span>
      ),
    },
    {
      key: 'missing',
      label: 'Missing Documentation',
      render: (r) => (
        <span className="flex flex-wrap gap-1 max-w-[260px]">
          {missingDocLabels(r).map((m) => (
            <span key={m} className="text-[11px] font-medium bg-danger-light text-danger-dark px-2 py-0.5 rounded-full whitespace-nowrap">
              {m}
            </span>
          ))}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Documentation & Compliance"
        title="Documentation"
        description="Review uploaded field evidence and track how completely each outreach session is documented."
      />

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <ChartCard
          title="Overall Completion"
          subtitle="All four evidence categories filed for the same session"
          icon={FileCheck2}
          accent="growth"
        >
          <div className="flex flex-col items-center py-2">
            <ProgressRing
              value={doc.overallPct}
              color={doc.overallPct >= 70 ? 'growth' : doc.overallPct >= 40 ? 'amber' : 'danger'}
            />
            <p className="text-sm text-slate-500 mt-4 text-center">
              <span className="font-semibold text-ink">{formatNumber(fullyDocumentedCount)}</span> of{' '}
              <span className="font-semibold text-ink">{formatNumber(records.length)}</span> sessions are fully
              documented
            </p>
          </div>
        </ChartCard>

        <ChartCard
          title="Completion by Category"
          subtitle="Share of all logged sessions with each document on file"
          icon={ClipboardList}
          accent="primary"
          className="lg:col-span-2"
        >
          <div className="space-y-5 py-1">
            {breakdown.map((b) => (
              <div key={b.key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <b.icon size={14} className="text-slate-400" />
                  <span className="text-sm font-medium text-ink">{b.label}</span>
                  <span className="text-xs text-slate-400 ml-auto tabular">
                    {formatNumber(b.count)} of {formatNumber(doc.counts.total)}
                  </span>
                </div>
                <ProgressBar value={b.pct} color={b.color} showValue={false} />
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <Card padded={false}>
        <div className="p-5 pb-0">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-danger" />
            <h3 className="font-display font-semibold text-ink text-[15px]">Sessions with Incomplete Documentation</h3>
            <span className="text-xs text-slate-400 ml-1">({incompleteAll.length} total)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-slate-500">Search</span>
              <span className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search school, district, remarks…"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-ink placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-400 transition-colors"
                />
              </span>
            </label>
            <Select label="State" value={state} onChange={handleState} options={states} allLabel="All States" />
            <Select label="District" value={district} onChange={setDistrict} options={districtOptions} allLabel="All Districts" />
          </div>

          {!isDefault && (
            <button
              onClick={() => {
                setSearch('')
                setState('all')
                setDistrict('all')
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700 mb-4"
            >
              <RotateCcw size={13} />
              Reset filters
            </button>
          )}
        </div>

        <div className="p-5 pt-0">
          {sessionsLoading ? (
            <div className="flex flex-col items-center justify-center py-14 text-sm text-slate-400">
              <Loader2 size={22} className="mb-2 animate-spin" />
              Loading documentation records...
            </div>
          ) : sessionsError ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-sm text-rose-600">
              <RefreshCw size={22} className="mb-2" />
              <p>{sessionsError}</p>
              <button type="button" onClick={fetchSessions} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 font-semibold text-white hover:bg-indigo-700">
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={incompleteFiltered}
              onRowClick={setSelected}
              pageSize={8}
              initialSort={{ key: 'session_date', dir: 'desc' }}
            />
          )}
        </div>
      </Card>

      <DetailDrawer record={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function mapSessionToDocumentationRecord(session) {
  const studentCount = sumSessionCounts(session, ['male_students', 'female_students', 'other_students'])
  const teacherCount = sumSessionCounts(session, ['female_staff', 'male_staff', 'other_staff'])
  const parentCount = sumSessionCounts(session, ['male_parents', 'female_parents', 'other_parents'])
  const communityCount = sumSessionCounts(session, [
    'female_community_members',
    'male_community_members',
    'other_community_members',
  ])

  return {
    ...session,
    date: session.session_date,
    consent: Array.isArray(session.consent_forms_links) && session.consent_forms_links.length > 0,
    studentsReached: studentCount,
    teachersReached: teacherCount,
    parentsReached: parentCount,
    communityReached: communityCount,
    totalParticipants: studentCount + teacherCount + parentCount + communityCount,
    regionalExpert: session.expert_id || 'Unassigned',
    attendance: Array.isArray(session.attendance_sheets_links) && session.attendance_sheets_links.length > 0,
    feedback: Array.isArray(session.feedback_forms_links) && session.feedback_forms_links.length > 0,
    iecMaterial: Number(session.total_iec_materials_distributed || 0) > 0 ||
      (Array.isArray(session.IEC_materials_photos_links) && session.IEC_materials_photos_links.length > 0),
    geoTaggedPhoto: Array.isArray(session['geo-taggedPhotos_links']) && session['geo-taggedPhotos_links'].length > 0,
  }
}

function sumSessionCounts(session, fields) {
  return fields.reduce((total, field) => total + Number(session[field] || 0), 0)
}
