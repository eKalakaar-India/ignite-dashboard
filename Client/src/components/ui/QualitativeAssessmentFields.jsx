import { Plus, Quote, Trash2 } from 'lucide-react'
import { useFieldArray } from 'react-hook-form'
import { QUALITATIVE_TARGET_GROUPS } from '../../utils/qualitativeAssessment'

const ASSESSMENT_OPTIONS = [
  { value: 'STRONG', label: 'Strong' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'LIMITED', label: 'Limited' },
]

const ASSESSMENT_TEXT_FIELDS = [
  { name: 'key_concern', label: 'Key concerns, barriers or challenges' },
  {
    name: 'perception_change',
    label: 'Changes in understanding or perception, including interest in ITIs and technical careers for girls',
  },
  { name: 'suggestion', label: 'Suggestions, recommendations or feedback' },
]
const QUOTE_TYPES = ['Student', 'Teacher/Principal', 'Community Member', 'Parent']

export default function QualitativeAssessmentFields({
  control,
  register,
  inputClass,
  errors,
  title,
  remarksName = 'remarks',
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'direct_quotes' })

  return (
    <section className="space-y-5 border-t border-slate-100 pt-6">
      {title && <h2 className="text-base font-semibold text-slate-800">{title}</h2>}
      <div className="grid gap-4 xl:grid-cols-2">
        {QUALITATIVE_TARGET_GROUPS.map((targetGroup, index) => (
          <section key={targetGroup} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-800">
              {targetGroup}
            </h3>
            <input type="hidden" {...register(`assesment_data.${index}.type`, { value: targetGroup })} />
            <label className="mb-4 block text-sm font-medium text-slate-700">
              Session assessment
              <select
                className={`${inputClass(Boolean(errors.assesment_data?.[index]?.session_assesment))} mt-1`}
                {...register(`assesment_data.${index}.session_assesment`)}
              >
                <option value="">Select assessment</option>
                {ASSESSMENT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <div className="space-y-3">
              {ASSESSMENT_TEXT_FIELDS.map(({ name, label }) => (
                <label key={name} className="block text-sm font-medium text-slate-700">
                  {label}
                  <textarea
                    rows={2}
                    className={`${inputClass(Boolean(errors.assesment_data?.[index]?.[name]))} mt-1`}
                    {...register(`assesment_data.${index}.${name}`)}
                  />
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Additional remarks
        <textarea
          rows={3}
          className={`${inputClass(Boolean(errors[remarksName]))} mt-1`}
          {...register(remarksName)}
        />
      </label>

      <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Quote size={16} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Direct quotes</h3>
              <p className="text-xs text-slate-500">Add a speaker type, name, and their quote.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => append({ type: '', name: '', quote: '' })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            <Plus size={14} /> Add quote
          </button>
        </div>

        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">
            No quotes added. Use “Add quote” to capture a participant’s words.
          </p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const quoteErrors = errors.direct_quotes?.[index] || {}
              return (
                <div key={field.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">Quote {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Remove quote ${index + 1}`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Type
                      <select
                        className={`${inputClass(Boolean(quoteErrors.type))} mt-1`}
                        {...register(`direct_quotes.${index}.type`, { required: 'Select the speaker type.' })}
                      >
                        <option value="">Select speaker type</option>
                        {QUOTE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                      {quoteErrors.type?.message && <span role="alert" className="mt-1 block text-rose-600">{quoteErrors.type.message}</span>}
                    </label>
                    <label className="block text-xs font-medium text-slate-600">
                      Name
                      <input
                        className={`${inputClass(Boolean(quoteErrors.name))} mt-1`}
                        placeholder="Speaker name"
                        {...register(`direct_quotes.${index}.name`, { required: 'Enter the speaker name.' })}
                      />
                      {quoteErrors.name?.message && <span role="alert" className="mt-1 block text-rose-600">{quoteErrors.name.message}</span>}
                    </label>
                  </div>
                  <label className="mt-3 block text-xs font-medium text-slate-600">
                    Quote
                    <textarea
                      rows={2}
                      className={`${inputClass(Boolean(quoteErrors.quote))} mt-1`}
                      placeholder="Enter the direct quote"
                      {...register(`direct_quotes.${index}.quote`, { required: 'Enter the direct quote.' })}
                    />
                    {quoteErrors.quote?.message && <span role="alert" className="mt-1 block text-rose-600">{quoteErrors.quote.message}</span>}
                  </label>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}
