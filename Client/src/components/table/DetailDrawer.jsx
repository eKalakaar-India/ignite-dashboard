import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  MapPin,
  Users,
  GraduationCap,
  UsersRound,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  MessageSquareText,
  UserRound,
  FileText,
  Store,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import { formatDate } from '../../utils/dateUtils'
import { formatNumber } from '../../utils/formatters'
import { createPortal } from 'react-dom'
import { useAFCStore } from '../../store/afcStore.js'


function DocRow({ label, ok, folder, id, sessionCompleted, onSessionUpdated }) {
  const inputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false)
  const uploadFiles = useAFCStore(store => store.uploadImages)
  const [error, setError] = useState('');
  const [uploaded, setUploaded] = useState(false)

  const MAX_FILE_COUNT = 5;
  const MAX_FILE_SIZE_MB = 10;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  const handleFileChange = (e) => {
    setError('');
    const pickedFiles = Array.from(e.target.files || []);
    if (pickedFiles.length > MAX_FILE_COUNT) {
      setError(`You can only upload a maximum of ${MAX_FILE_COUNT} files.`);
      setSelectedFiles([]);
      e.target.value = '';
      return;
    }

    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    for (const file of pickedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File "${file.name}" is not a supported image. Use JPG, PNG, WebP, HEIC, or HEIF.`);
        setSelectedFiles([]);
        e.target.value = '';
        return;
      }

      if (file.size > maxSizeBytes) {
        setError(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
        setSelectedFiles([]);
        e.target.value = '';
        return;
      }
    }

    setSelectedFiles(pickedFiles);
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || loading) return;
    setLoading(true)
    setError('')
    try {
      const result = await uploadFiles(folder, selectedFiles, id);
      setSelectedFiles([]);
      setUploaded(true)
      if (result?.session) onSessionUpdated(result.session)
      if (inputRef.current) inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  };

  const isComplete = ok || uploaded

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-700">{label}</p>
          {sessionCompleted && (
            <p className="mt-0.5 text-xs text-slate-400">Uploads are closed for completed sessions</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} /> Complete
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <XCircle size={14} /> Missing
            </span>
          )}
        </div>
      </div>

      {!isComplete && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={handleFileChange}
              aria-label={`Select ${label} files`}
              className="min-w-0 flex-1 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || loading}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload files'}
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <span>{selectedFiles.length}/5 selected · maximum 5 per upload</span>
            <span>Images up to 10 MB each</span>
          </div>
          {error && <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  )
}

function StatBlock({ icon: Icon, label, value, color }) {
  return (
    <div className="flex-1 bg-slate-50 rounded-xl p-3.5 text-center">
      <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center mb-2 ${color}`}>
        <Icon size={15} className="text-white" />
      </div>
      <p className="font-display font-bold text-ink tabular text-lg leading-none">{formatNumber(value)}</p>
      <p className="text-[11px] text-slate-500 mt-1">{label}</p>
    </div>
  )
}

export default function DetailDrawer({ record, onClose, onEdit }) {
  const [currentStatus, setCurrentStatus] = useState(record?.status)
  const [documentation, setDocumentation] = useState([])
  const [documentationLoading, setDocumentationLoading] = useState(false)
  const [documentationError, setDocumentationError] = useState('')
  const [previewIndex, setPreviewIndex] = useState(null)
  const fetchSessionDocumentation = useAFCStore((store) => store.fetchSessionDocumentation)
  const previewImages = useMemo(
    () => documentation.flatMap((category) =>
      category.files
        .filter((file) => file.url)
        .map((file) => ({ ...file, label: category.label }))
    ),
    [documentation]
  )
  const activePreview = previewIndex === null ? null : previewImages[previewIndex]

  const loadDocumentation = useCallback(async () => {
    if (!record?.id) return
    setDocumentationLoading(true)
    setDocumentationError('')
    try {
      const files = await fetchSessionDocumentation(record.id)
      setDocumentation(Array.isArray(files) ? files : [])
    } catch (error) {
      setDocumentationError(error.message || 'Unable to load session documentation.')
    } finally {
      setDocumentationLoading(false)
    }
  }, [fetchSessionDocumentation, record?.id])

  useEffect(() => {
    setCurrentStatus(record?.status)
    setDocumentation([])
    setDocumentationError('')
    setPreviewIndex(null)
    if (record?.id) loadDocumentation()
  }, [loadDocumentation, record?.id, record?.status])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (previewIndex !== null) setPreviewIndex(null)
        else onClose()
      } else if (previewIndex !== null && e.key === 'ArrowLeft') {
        setPreviewIndex((index) => (index - 1 + previewImages.length) % previewImages.length)
      } else if (previewIndex !== null && e.key === 'ArrowRight') {
        setPreviewIndex((index) => (index + 1) % previewImages.length)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, previewImages.length, previewIndex])

  if (!record) return null

  const isVisitSession = ['School Visit', 'ITI Visit'].includes(record.type_of_outreach)
  const isSchoolSession = record.type_of_session === 'School' && !isVisitSession
  const isCommunitySession = record.type_of_session === 'Community'
  const participantGroups = isSchoolSession
    ? [
        {
          label: 'Students',
          icon: GraduationCap,
          total: record.studentsReached,
          color: 'bg-gradient-to-br from-bloom to-bloom-dark',
          accent: 'bg-bloom',
          values: [
            ['Female', record.female_students],
            ['Male', record.male_students],
            ['Other', record.other_students],
            ['PwD', record.pwd_students],
          ],
        },
        {
          label: 'Staff',
          icon: Users,
          total: record.teachersReached,
          color: 'bg-gradient-to-br from-primary-600 to-primary-800',
          accent: 'bg-primary-600',
          values: [
            ['Female', record.female_staff],
            ['Male', record.male_staff],
            ['Other', record.other_staff],
          ],
        },
        {
          label: 'Parents',
          icon: UsersRound,
          total: record.parentsReached,
          color: 'bg-gradient-to-br from-amber to-amber-dark',
          accent: 'bg-amber',
          values: [
            ['Female', record.female_parents],
            ['Male', record.male_parents],
            ['Other', record.other_parents],
          ],
        },
        {
          label: 'Community',
          icon: UsersRound,
          total: record.communityReached,
          color: 'bg-gradient-to-br from-growth to-growth-dark',
          accent: 'bg-growth',
          values: [
            ['Female', record.female_community_members],
            ['Male', record.male_community_members],
            ['Other', record.other_community_members],
          ],
        },
      ]
    : isCommunitySession
      ? [
          {
            label: 'Community',
            icon: UsersRound,
            total: record.communityReached,
            color: 'bg-gradient-to-br from-growth to-growth-dark',
            accent: 'bg-growth',
            values: [
              ['Female', record.female_community_members],
              ['Male', record.male_community_members],
              ['Other', record.other_community_members],
            ],
          },
        ]
      : []

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] animate-fadeIn" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-drawer animate-slideIn flex flex-col">
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-bloom uppercase tracking-wide mb-1.5">{record.id}</p>
            <h3 className="font-display font-bold text-ink text-lg leading-snug">{record.name_of_session}</h3>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin size={13} />
              {[record.block, record.district, record.state].filter(Boolean).join(', ')}
            </p>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{formatDate(record.date)}</span>
            <StatusBadge status={currentStatus} />
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <p><span className="font-medium text-slate-700">Session:</span> {record.type_of_session || '—'}</p>
            <p><span className="font-medium text-slate-700">Outreach:</span> {record.type_of_outreach || '—'}</p>
            <p><span className="font-medium text-slate-700">Nearest ITI:</span> {record.ITI_name || 'NA'}</p>
            <p><span className="font-medium text-slate-700">ITI code:</span> {record.ITI_code || 'NA'}</p>
            <p><span className="font-medium text-slate-700">Expert ID:</span> {record.expert_data.name || 'Unassigned'}</p>
          </div>

          {participantGroups.length > 0 && (
            <div className="flex gap-2.5">
              {participantGroups.map((group) => (
                <StatBlock
                  key={group.label}
                  icon={group.icon}
                  label={group.label}
                  value={group.total}
                  color={group.color}
                />
              ))}
            </div>
          )}

          {participantGroups.length > 0 && (
            <div className="bg-primary-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-primary-800">Total Participants</span>
              <span className="font-display font-bold text-primary-800 tabular text-lg">
                {formatNumber(record.totalParticipants)}
              </span>
            </div>
          )}

          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-ink mb-1">
              <ClipboardCheck size={15} className="text-primary-600" />
              Documentation
            </h4>
            <div className="space-y-2.5">
              <DocRow id={record.id} label="Attendance Sheet / Consent Form" ok={record.attendance} folder="attendance_sheets" sessionCompleted={currentStatus === 'Completed'} onSessionUpdated={(session) => setCurrentStatus(session.status)} />
              {/* <DocRow id={record.id} label="Consent Forms" ok={record.consent} folder="consent_forms" sessionCompleted={currentStatus === 'Completed'} onSessionUpdated={(session) => setCurrentStatus(session.status)} /> */}
              <DocRow id={record.id} label="Feedback Forms" ok={record.feedback} folder="feedback_forms" sessionCompleted={currentStatus === 'Completed'} onSessionUpdated={(session) => setCurrentStatus(session.status)} />
              {/* <DocRow id={record.id} label="IEC Material Distributed" ok={record.iecMaterial} folder="IEC_materials_photos" sessionCompleted={currentStatus === 'Completed'} onSessionUpdated={(session) => setCurrentStatus(session.status)} /> */}
              <DocRow id={record.id} label="Geo-tagged Photo" ok={record.geoTaggedPhoto} folder="geo-taggedPhotos" sessionCompleted={currentStatus === 'Completed'} onSessionUpdated={(session) => setCurrentStatus(session.status)} />
            </div>
            {record.iecTypes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {record.iecTypes.map((t) => (
                  <span key={t} className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {isSchoolSession && (
            <div className="text-sm text-slate-600">
              <h4 className="mb-2 font-semibold text-ink">School and ITI representatives</h4>
              <p>School: {record.school_rep_name || '—'}{record.school_rep_contact ? ` · ${record.school_rep_contact}` : ''}</p>
              <p>ITI: {record.iti_rep_name || '—'}{record.iti_rep_contact ? ` · ${record.iti_rep_contact}` : ''}</p>
            </div>
          )}

          {participantGroups.length > 0 && (
            <section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <UsersRound size={16} />
                </span>
                Participant breakdown
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {participantGroups.map((group) => (
                  <div key={group.label} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                    <h5 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <span className={`h-1.5 w-1.5 rounded-full ${group.accent}`} />
                      {group.label}
                    </h5>
                    <dl className="space-y-1.5">
                      {group.values.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-2 text-[11px]">
                          <dt className="text-slate-500">{label}</dt>
                          <dd className="font-semibold tabular text-ink">{formatNumber(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
              <UserRound size={15} className="text-primary-600" />
            Assigned Expert
            </h4>
            <p className="text-sm text-slate-600">{record.expert_data.name || 'Unassigned'}</p>
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
              <ClipboardCheck size={15} className="text-primary-600" />
              View documentation
            </h4>
            {documentationLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Loading documentation images...
              </div>
            ) : documentationError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <p>{documentationError}</p>
                <button type="button" onClick={loadDocumentation} className="mt-2 inline-flex items-center gap-1.5 font-semibold">
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            ) : documentation.every((category) => category.files.length === 0) ? (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">
                No documentation images uploaded for this session.
              </p>
            ) : (
              <div className="space-y-4">
                {documentation.filter((category) => category.files.length > 0).map((category) => (
                  <section key={category.label}>
                    <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {category.label}
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {category.files.map((file) => file.url ? (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => setPreviewIndex(
                            previewImages.findIndex((image) => image.path === file.path && image.label === category.label)
                          )}
                          aria-label={`View ${category.label} image`}
                          className="group relative block overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                          title="View documentation image"
                        >
                          <img
                            src={file.url}
                            alt={`${category.label} documentation`}
                            loading="lazy"
                            className="h-32 w-full object-cover transition group-hover:scale-105"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-2 pb-2 pt-5 text-left text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                            Click to view
                          </span>
                        </button>
                      ) : (
                        <div
                          key={file.path}
                          className="flex min-h-20 flex-col justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                        >
                          <span className="font-semibold">Image unavailable</span>
                          <span className="break-words">{file.error}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
              <MessageSquareText size={15} className="text-primary-600" />
              Observation
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">{record.observation}</p>
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
              <FileText size={15} className="text-primary-600" />
              Remarks
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">{record.remarks}</p>
          </div>
        </div>
      </div>
      {activePreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${activePreview.label} image viewer`}
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="relative flex h-full w-full max-w-6xl flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 py-2 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{activePreview.label}</p>
                <p className="text-xs text-white/65">{previewIndex + 1} of {previewImages.length}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                aria-label="Close image viewer"
                className="shrink-0 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {previewImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPreviewIndex((index) => (index - 1 + previewImages.length) % previewImages.length)}
                  aria-label="Previous image"
                  className="absolute left-0 z-10 rounded-full bg-black/50 p-2.5 text-white transition hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:left-3"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <img
                src={activePreview.url}
                alt={`${activePreview.label} documentation`}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
              {previewImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPreviewIndex((index) => (index + 1) % previewImages.length)}
                  aria-label="Next image"
                  className="absolute right-0 z-10 rounded-full bg-black/50 p-2.5 text-white transition hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:right-3"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
            <p className="py-2 text-center text-xs text-white/60">Use ← and → to browse · Esc to close</p>
          </div>
        </div>
      )}
    </div>, document.body
  )
}
