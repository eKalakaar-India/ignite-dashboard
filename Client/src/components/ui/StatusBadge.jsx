import React from 'react'
import { STATUS_STYLES } from '../../data/mockData'

export default function StatusBadge({ status, size = 'md' }) {
  const style = STATUS_STYLES[status] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
  const sizing = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${style.bg} ${style.text} ${sizing}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  )
}
