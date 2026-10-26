import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import QualitativeAssessmentFields from '../components/ui/QualitativeAssessmentFields'
import { createAssessmentData } from '../utils/qualitativeAssessment'
import { useAFCStore } from '../store/afcStore'

function makeDefaults() {
  return {
    session_id: '',
    assesment_data: createAssessmentData(),
    direct_quotes: [],
    remarks: '',
  }
}

export default function QualitativeAnalysis() {
  const fetchSessions = useAFCStore((store) => store.fetchSessions)
  const createQualitativeAnalysis = useAFCStore((store) => store.createQualitativeAnalysis)
  const sessions = useAFCStore((store) => store.sessions)
  const sessionsLoading = useAFCStore((store) => store.sessionsLoading)
  const sessionsError = useAFCStore((store) => store.sessionsError)
  const [serverError, setServerError] = useState('')
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: makeDefaults(), mode: 'onBlur' })

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const sessionId = watch('session_id')
  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === sessionId),
    [sessions, sessionId]
  )

  const onSubmit = async (data) => {
    setServerError('')
    setSaved(false)
    try {
      if (!selectedSession || !['School', 'Community'].includes(selectedSession.type_of_session)) {
        throw new Error('Select a valid School or Community outreach record.')
      }
      await createQualitativeAnalysis({
        session_id: data.session_id,
        outreach_type: selectedSession.type_of_session.toUpperCase(),
        assesment_data: data.assesment_data.map((assessment) => ({
          type: assessment.type,
          session_assesment: assessment.session_assesment || null,
          key_concern: assessment.key_concern.trim() || null,
          perception_change: assessment.perception_change.trim() || null,
          suggestion: assessment.suggestion.trim() || null,
        })),
        direct_quotes: data.direct_quotes.map(({ type, name, quote }) => ({
          type: type.trim(),
          name: name.trim(),
          quote: quote.trim(),
        })),
        remarks: data.remarks.trim() || null,
      })
      reset(makeDefaults())
      setSaved(true)
    } catch (error) {
      setServerError(error.message || 'Unable to save qualitative analysis. Please try again.')
    }
  }

  const inputClass = (hasError = false) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
      hasError
        ? 'border-rose-400 focus:ring-rose-200'
        : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-400'
    }`

  const errorText = (message) =>
    message ? <p className="mt-1 text-xs text-rose-600">{message}</p> : null

  return (
    <div>
      <PageHeader
        eyebrow="Field Monitoring"
        title="Qualitative Analysis"
        description="Record session reflections separately and link them to an outreach submission."
        action={
          <Link to="/daily" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">
            Back to Field Activities
          </Link>
        }
      />

      <Card>
        {sessionsError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Unable to load outreach records: {sessionsError}
          </div>
        )}
        {serverError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {serverError}
          </div>
        )}
        {saved && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Qualitative report saved and linked to the outreach record.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-800">Outreach record</h2>
            <label className="mb-1 block text-sm font-medium text-slate-700">Related outreach record</label>
            <select
              className={inputClass(errors.session_id)}
              disabled={sessionsLoading}
              {...register('session_id', { required: 'Select an outreach record' })}
            >
              <option value="">
                {sessionsLoading ? 'Loading outreach records...' : 'Select an outreach record'}
              </option>
              {sessions.filter((session) => !['School Visit', 'ITI Visit'].includes(session.type_of_outreach)).map((session) => (
                <option key={session.id} value={session.id}>
                  {session.session_date} — {session.name_of_session} · {session.type_of_session} ({session.district}, {session.state})
                </option>
              ))}
            </select>
            {errorText(errors.session_id?.message)}

            {selectedSession && (
              <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-3">
                <p><span className="font-medium text-slate-700">Location:</span> {[selectedSession.address, selectedSession.block, selectedSession.district, selectedSession.state].filter(Boolean).join(', ')}</p>
                <p><span className="font-medium text-slate-700">Nearest ITI:</span> {selectedSession.ITI_name}</p>
                <p><span className="font-medium text-slate-700">Date:</span> {selectedSession.session_date}</p>
              </div>
            )}
          </section>

          {selectedSession && (
            <QualitativeReportFields
              title={`${selectedSession.type_of_session} Outreach`}
              control={control}
              register={register}
              inputClass={inputClass}
              errors={errors}
            />
          )}

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || sessionsLoading || sessions.length === 0}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Qualitative Report'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function QualitativeReportFields({ title, control, register, inputClass, errors }) {
  const perspectiveHint = title.startsWith('School')
    ? 'Include School / ITI principal and teacher perspectives alongside student feedback where relevant.'
    : 'Include community perspectives alongside student feedback where relevant.'

  return (
    <section className="space-y-4 border-t border-slate-100 pt-6">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500">{perspectiveHint}</p>
      <QualitativeAssessmentFields
        control={control}
        register={register}
        inputClass={inputClass}
        errors={errors}
      />
    </section>
  )
}
