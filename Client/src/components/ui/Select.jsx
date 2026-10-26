import React from 'react'
import { ChevronDown } from 'lucide-react'

export default function Select({ label, value, onChange, options, allLabel = 'All', className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label && <span className="text-xs font-medium text-slate-500">{label}</span>}
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full bg-white border border-slate-200 rounded-xl pl-3 pr-9 py-2.5 text-sm font-medium text-ink hover:border-slate-300 focus:border-primary-400 transition-colors cursor-pointer"
        >
          <option value="all">{allLabel}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  )
}
