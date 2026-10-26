import React from 'react'

export default function Card({ children, className = '', padded = true, hover = false, as: As = 'div', ...rest }) {
  return (
    <As
      className={`bg-white rounded-2xl border border-slate-100 shadow-card ${
        hover ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5' : ''
      } ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
      {...rest}
    >
      {children}
    </As>
  )
}

export function CardHeader({ title, subtitle, action, icon: Icon, accent = 'primary' }) {
  const accentBg = {
    primary: 'bg-primary-50 text-primary-700',
    bloom: 'bg-bloom-light text-bloom-dark',
    growth: 'bg-growth-light text-growth-dark',
    amber: 'bg-amber-light text-amber-dark',
  }[accent]

  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${accentBg}`}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <div>
          <h3 className="font-display font-semibold text-ink text-[15px] leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
