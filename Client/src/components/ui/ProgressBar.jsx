import React from 'react'

const COLOR_MAP = {
  primary: 'bg-primary-600',
  growth: 'bg-growth',
  bloom: 'bg-bloom',
  amber: 'bg-amber',
  danger: 'bg-danger',
}

const TRACK_MAP = {
  primary: 'bg-primary-100',
  growth: 'bg-growth-light',
  bloom: 'bg-bloom-light',
  amber: 'bg-amber-light',
  danger: 'bg-danger-light',
}

// A "rung" progress bar: subtle tick marks every 10% evoke the programme's
// coverage ladder — used consistently for every Planned vs Achieved metric.
export default function ProgressBar({
  value = 0,
  color = 'primary',
  label,
  showValue = true,
  size = 'md',
  className = '',
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'
  const rungs = Array.from({ length: 9 }, (_, i) => (i + 1) * 10)

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5 text-xs">
          {label && <span className="text-slate-500 font-medium">{label}</span>}
          {showValue && (
            <span className={`font-display font-semibold tabular ${value > 100 ? 'text-growth-dark' : 'text-ink'}`}>
              {value}%
            </span>
          )}
        </div>
      )}
      <div className={`relative w-full ${height} rounded-full ${TRACK_MAP[color]} overflow-hidden`}>
        <div
          className={`${height} rounded-full ${COLOR_MAP[color]} transition-all duration-500 ease-out relative`}
          style={{ width: `${clamped}%` }}
        />
        {rungs.map((r) => (
          <span
            key={r}
            className="absolute top-0 bottom-0 w-px bg-white/70"
            style={{ left: `${r}%` }}
          />
        ))}
      </div>
    </div>
  )
}
