import React from 'react'
import { ChevronRight } from 'lucide-react'
import ProgressBar from './ProgressBar'
import { formatNumber } from '../../utils/formatters'

const RANK_STYLES = [
  'bg-gradient-to-br from-amber to-amber-dark text-white',
  'bg-gradient-to-br from-slate-300 to-slate-400 text-white',
  'bg-gradient-to-br from-[#C68A4E] to-[#9C6530] text-white',
]

export default function RankingList({ items, onItemClick, progressColor = 'primary', valueLabel = 'Participants' }) {
  return (
    <div className="divide-y divide-slate-50">
      {items.map((item, idx) => (
        <button
          key={item.name}
          onClick={() => onItemClick?.(item)}
          disabled={!onItemClick}
          className={`w-full flex items-center gap-3.5 py-3 text-left group ${onItemClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <span
            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-display ${
              RANK_STYLES[idx] || 'bg-slate-100 text-slate-500'
            }`}
          >
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-ink truncate">{item.name}</span>
              <span className="text-xs font-semibold text-slate-500 tabular shrink-0">
                {formatNumber(item.value)}
                <span className="text-slate-400 font-normal"> {valueLabel}</span>
              </span>
            </div>
            <ProgressBar value={item.progress} color={progressColor} showValue={false} size="sm" />
          </div>
          {onItemClick && (
            <ChevronRight size={16} className="shrink-0 text-slate-300 group-hover:text-primary-500 transition-colors" />
          )}
        </button>
      ))}
    </div>
  )
}
