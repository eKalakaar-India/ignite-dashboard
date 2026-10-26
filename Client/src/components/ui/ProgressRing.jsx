import React from 'react'

const COLOR_MAP = {
  primary: '#2F3E9E',
  growth: '#12896F',
  bloom: '#E8546B',
  amber: '#E8A33D',
  danger: '#E1493C',
}

export default function ProgressRing({ value = 0, size = 132, stroke = 12, color = 'growth', label, sublabel }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#EEF0F8" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLOR_MAP[color]}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-ink tabular" style={{ fontSize: size * 0.22 }}>
            {clamped}%
          </span>
        </div>
      </div>
      {label && <span className="mt-3 text-sm font-semibold text-ink text-center">{label}</span>}
      {sublabel && <span className="text-xs text-slate-500 text-center">{sublabel}</span>}
    </div>
  )
}
