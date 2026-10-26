import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { CHART_COLORS } from '../../data/mockData'
import { formatCompact, formatNumber } from '../../utils/formatters'

const SERIES = [
  { key: 'girls', label: 'Girls', color: CHART_COLORS.bloom },
  { key: 'teachers', label: 'Teachers/Principals', color: CHART_COLORS.primary },
  { key: 'community', label: 'Community', color: CHART_COLORS.growth },
]

function CustomTooltip({ active, payload, label, series }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-card-hover border border-slate-100 px-3.5 py-3 text-xs">
      <p className="font-semibold text-ink mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {series.find((s) => s.key === p.dataKey)?.label}
          </span>
          <span className="font-semibold text-ink tabular">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendAreaChart({ data, xKey = 'label', height = 280, series = SERIES }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="#EEF0F8" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={{ stroke: '#EEF0F8' }}
          minTickGap={20}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCompact}
          width={36}
        />
        <Tooltip content={<CustomTooltip series={series} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#64748B', paddingTop: 12 }}
          formatter={(value) => series.find((s) => s.key === value)?.label || value}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.key}
            stackId="1"
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
