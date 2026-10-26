import React from 'react'

export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold tracking-wide uppercase text-bloom mb-1.5">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl sm:text-[28px] font-bold text-ink tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
