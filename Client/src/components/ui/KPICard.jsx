import React, { useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'

const ACCENTS = {
  primary: {
    iconBg: 'bg-gradient-to-br from-primary-600 to-primary-800',
    ring: 'group-hover:ring-primary-100',
  },
  bloom: {
    iconBg: 'bg-gradient-to-br from-bloom to-bloom-dark',
    ring: 'group-hover:ring-bloom-light',
  },
  growth: {
    iconBg: 'bg-gradient-to-br from-growth to-growth-dark',
    ring: 'group-hover:ring-growth-light',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber to-amber-dark',
    ring: 'group-hover:ring-amber-light',
  },
}

export default function KPICard({ label, value, total, suffix = '', icon: Icon, accent = 'primary', trend, trendLabel, sub, breakdown }) {
  const a = ACCENTS[accent] || ACCENTS.primary
  const breakdownId = useId()
  const cardRef = useRef(null)
  const tooltipRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState(null)
  const hasTrend = typeof trend === 'number'
  const trendUp = hasTrend && trend > 0
  const trendFlat = hasTrend && trend === 0
  const TrendIcon = trendFlat ? Minus : trendUp ? TrendingUp : TrendingDown
  const hasBreakdown = Array.isArray(breakdown) && breakdown.length > 0
  const showBreakdown = hasBreakdown && (hovered || focused)

  useLayoutEffect(() => {
    if (!showBreakdown) {
      setTooltipPosition(null)
      return undefined
    }

    const positionTooltip = () => {
      const cardRect = cardRef.current?.getBoundingClientRect()
      const tooltipRect = tooltipRef.current?.getBoundingClientRect()
      if (!cardRect || !tooltipRect) return

      const margin = 12
      const gap = 10
      const left = Math.min(
        Math.max(margin, cardRect.left + (cardRect.width - tooltipRect.width) / 2),
        window.innerWidth - tooltipRect.width - margin
      )
      const spaceAbove = cardRect.top - gap - margin
      const spaceBelow = window.innerHeight - cardRect.bottom - gap - margin
      const placeAbove = spaceAbove >= tooltipRect.height || spaceAbove > spaceBelow
      const preferredTop = placeAbove
        ? cardRect.top - tooltipRect.height - gap
        : cardRect.bottom + gap
      const top = Math.min(
        Math.max(margin, preferredTop),
        window.innerHeight - tooltipRect.height - margin
      )

      setTooltipPosition({ left, top })
    }

    positionTooltip()
    window.addEventListener('resize', positionTooltip)
    window.addEventListener('scroll', positionTooltip, true)
    return () => {
      window.removeEventListener('resize', positionTooltip)
      window.removeEventListener('scroll', positionTooltip, true)
    }
  }, [showBreakdown, breakdown])

  return (
    <div
      ref={cardRef}
      role="group"
      tabIndex={hasBreakdown ? 0 : undefined}
      aria-describedby={hasBreakdown ? breakdownId : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`group relative bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-200 p-5 ring-1 ring-transparent ${a.ring}`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-slate-50 to-transparent opacity-60" />
      <div className="relative flex items-start justify-between">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${a.iconBg}`}>
            <Icon size={19} strokeWidth={2} />
          </div>
        )}
        {hasTrend && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trendFlat
                ? 'bg-slate-100 text-slate-500'
                : trendUp
                ? 'bg-growth-light text-growth-dark'
                : 'bg-danger-light text-danger-dark'
            }`}
          >
            <TrendIcon size={12} strokeWidth={2.5} />
            {Math.abs(trend)}%
          </div>
        )}
        {hasBreakdown && <Info size={15} aria-hidden="true" className="ml-auto text-slate-300" />}
      </div>
      <div className="relative mt-4">
        <p className="font-display text-[26px] leading-none font-bold text-ink tabular">
          {formatNumber(value)} {total ? `/ ${formatNumber(total)}` : ''}
          {suffix && <span className="text-base font-semibold text-slate-400 ml-1">{suffix}</span>}
        </p>
        <p className="text-sm text-slate-500 mt-2 font-medium">{label}</p>
        {(trendLabel || sub) && <p className="text-[11px] text-slate-400 mt-1">{trendLabel || sub}</p>}
      </div>
      {showBreakdown && createPortal(
        <div
          ref={tooltipRef}
          id={breakdownId}
          role="tooltip"
          style={{
            left: tooltipPosition?.left ?? 0,
            top: tooltipPosition?.top ?? 0,
            visibility: tooltipPosition ? 'visible' : 'hidden',
          }}
          className="pointer-events-none fixed z-[100] w-56 max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
        >
          <p className="mb-2 text-xs font-semibold text-ink">{label} breakdown</p>
          <dl className="space-y-1.5">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="font-semibold tabular text-ink">{formatNumber(item.value)}</dd>
              </div>
            ))}
          </dl>
        </div>,
        document.body
      )}
    </div>
  )
}
