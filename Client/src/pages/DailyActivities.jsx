import React, { useEffect, useMemo, useState } from 'react'
import { Search, ClipboardList, MessageSquareText, BookOpen, Camera, RotateCcw, Plus, Loader2, RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import DataTable from '../components/table/DataTable'
import DetailDrawer from '../components/table/DetailDrawer'
import CreateSessionModal from '../components/ui/CreateSessionModal'
import { ACTIVITY_STATUS } from '../data/mockData'
import { filterRecords, statusCounts } from '../utils/calculations'
import { formatDateShort } from '../utils/dateUtils'
import { formatNumber } from '../utils/formatters'
import { useAFCStore } from '../store/afcStore'


function DocDot({ icon: Icon, ok, label }) {
  return (
    <span
      title={label}
      className={`w-6 h-6 rounded-md flex items-center justify-center ${
        ok ? 'bg-growth-light text-growth-dark' : 'bg-slate-100 text-slate-300'
      }`}
    >
      <Icon size={12} />
    </span>
  )
}

export default function DailyActivities() {
  const [search, setSearch] = useState('')
  const [state, setState] = useState('all')
  const [district, setDistrict] = useState('all')
  const [selected, setSelected] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const createSession = useAFCStore((store) => store.createSession)
  const updateSession = useAFCStore((store) => store.updateSession)
  const fetchSessions = useAFCStore((store) => store.fetchSessions)
  const sessions = useAFCStore((store) => store.sessions)
  const sessionsLoading = useAFCStore((store) => store.sessionsLoading)
  const sessionsError = useAFCStore((store) => store.sessionsError)

  useEffect(() => {
    fetchSessions()
    console.log(sessions);
  }, [fetchSessions])

  const records = useMemo(() => sessions.map(mapSessionToRecord), [sessions])

  const states = useMemo(() => [...new Set(records.map((record) => record.state).filter(Boolean))].sort(), [records])
  const districtOptions = useMemo(
    () => [...new Set(records.filter((record) => state === 'all' || record.state === state).map((record) => record.district).filter(Boolean))].sort(),
    [records, state]
  )

  function handleState(v) {
    setState(v)
    setDistrict('all')
  }

  const filtered = useMemo(
    () => filterRecords(records, { search, state, district }),
    [records, search, state, district]
  )

  const counts = useMemo(() => statusCounts(filtered), [filtered])
  const isDefault = !search && state === 'all' && district === 'all'

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (r) => <span className="font-medium">{formatDateShort(r.date)}</span>,
    },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'expert', label: "Expert's Data", sortable: true, render: (r) => <span className="tabular font-small text-slate">{r?.expert_data?.name} / {r.expert_data?.phone_no}</span> },
    { key: 'state', label: 'State', sortable: true },
    { key: 'district', label: 'District', sortable: true },
    { key: 'type_of_session', label: 'Session type', sortable: true },
    { key: 'type_of_outreach', label: 'Outreach type', sortable: true },
    { key: 'block', label: 'Block' },
    {
      key: 'name_of_session',
      label: 'Session',
      render: (r) => (
        <span className="block max-w-[220px] truncate" title={r.name_of_session}>
          {r.name_of_session}
        </span>
      ),
    },
    {
      key: 'studentsReached',
      label: 'Students',
      sortable: true,
      render: (r) => <span className="tabular font-medium text-bloom-dark">{formatNumber(r.studentsReached)}</span>,
    },
    {
      key: 'teachersReached',
      label: 'Teachers/Principals',
      sortable: true,
      render: (r) => <span className="tabular">{formatNumber(r.teachersReached)}</span>,
    },
    {
      key: 'parentsReached',
      label: 'Parents',
      sortable: true,
      render: (r) => <span className="tabular">{formatNumber(r.parentsReached)}</span>,
    },
    {
      key: 'communityReached',
      label: 'Community',
      sortable: true,
      render: (r) => <span className="tabular">{formatNumber(r.communityReached)}</span>,
    },
    {
      key: 'totalParticipants',
      label: 'Total',
      sortable: true,
      render: (r) => <span className="tabular font-semibold text-ink">{formatNumber(r.totalParticipants)}</span>,
    },
    {
      key: 'docs',
      label: 'Documentation',
      render: (r) => (
        <span className="flex items-center gap-1">
          <DocDot icon={ClipboardList} ok={r.attendance} label="Attendance Sheet" />
          <DocDot icon={MessageSquareText} ok={r.feedback} label="Feedback Forms" />
          <DocDot icon={BookOpen} ok={r.iecMaterial} label="IEC Material" />
          <DocDot icon={Camera} ok={r.geoTaggedPhoto} label="Geo-tagged Photo" />
        </span>
      ),
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (r) => (
        <span className="block max-w-[200px] truncate text-slate-500" title={r.remarks}>
          {r.remarks}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Field Monitoring"
        title="Daily Field Activities"
        description="Every logged awareness session, sourced from the daily reporting template."
        action={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Session
          </button>
        }
      />

      <Card className="mb-5" padded={false}>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1">{filtered.length} activities</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-growth-dark bg-growth-light px-2.5 py-1 rounded-full">
                {counts[ACTIVITY_STATUS.COMPLETED] || 0} Completed
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-dark bg-amber-light px-2.5 py-1 rounded-full">
                {counts[ACTIVITY_STATUS.PENDING_REVIEW] || 0} Pending review
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger-dark bg-danger-light px-2.5 py-1 rounded-full">
                {counts[ACTIVITY_STATUS.FLAGGED] || 0} Needs Attention
              </span>
            </div>
            <button
              onClick={() => {
                setSearch('')
                setState('all')
                setDistrict('all')
              }}
              disabled={isDefault}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700 disabled:opacity-40 disabled:pointer-events-none"
            >
              <RotateCcw size={13} />
              Reset filters
            </button>
          </div>
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5">
          {sessionsLoading ? (
            <div className="flex flex-col items-center justify-center py-14 text-sm text-slate-400">
              <Loader2 size={22} className="mb-2 animate-spin" />
              Loading sessions...
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
            <DataTable columns={columns} data={filtered} onRowClick={setSelected} pageSize={10} initialSort={{ key: 'date', dir: 'desc' }} />
          )}
        </div>
      </Card>

      <DetailDrawer
        record={selected}
        onClose={() => setSelected(null)}
        onEdit={(record) => {
          setEditingSession(record)
          setSelected(null)
          setIsCreateModalOpen(true)
        }}
      />

      <CreateSessionModal
        isOpen={isCreateModalOpen}
        session={editingSession}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingSession(null)
        }}
        onCreateSession={async (payload, selectedUploads, qualitativeReport) => {
          const createdSession = await createSession(payload, selectedUploads, qualitativeReport)
          await fetchSessions()
          return createdSession
        }}
        onUpdateSession={async (sessionId, payload) => {
          const updatedSession = await updateSession(sessionId, payload)
          await fetchSessions()
          return updatedSession
        }}
      />
    </div>
  )
}

function mapSessionToRecord(session) {
  const attendanceLinks = session.attendance_sheets_links || []
  const consentLinks = session.consent_forms_links || []
  const feedbackLinks = session.feedback_forms_links || []
  const geoPhotoLinks = session['geo-taggedPhotos_links'] || []
  const studentCount = sumCounts(session, ['male_students', 'female_students', 'other_students'])
  const staffCount = sumCounts(session, ['female_staff', 'male_staff', 'other_staff'])
  const parentCount = sumCounts(session, ['male_parents', 'female_parents', 'other_parents'])
  const communityCount = sumCounts(session, [
    'female_community_members',
    'male_community_members',
    'other_community_members',
  ])

  return {
    ...session,
    date: session.session_date,
    girlsReached: studentCount,
    studentsReached: studentCount,
    teachersReached: staffCount,
    parentsReached: parentCount,
    communityReached: communityCount,
    totalParticipants: studentCount + staffCount + parentCount + communityCount,
    attendance: attendanceLinks.length > 0,
    consent: consentLinks.length > 0,
    feedback: feedbackLinks.length > 0,
    iecMaterial: Number(session.total_iec_materials_distributed || 0) > 0 ||
      (Array.isArray(session.IEC_materials_photos_links) && session.IEC_materials_photos_links.length > 0),
    geoTaggedPhoto: geoPhotoLinks.length > 0,
    regionalExpert: session.expert_id || 'Unassigned',
  }
}

function sumCounts(session, fields) {
  return fields.reduce((total, field) => total + Number(session[field] || 0), 0)
}
