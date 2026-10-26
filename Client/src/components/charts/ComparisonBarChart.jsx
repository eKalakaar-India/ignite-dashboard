import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { CHART_COLORS } from '../../data/mockData'
import { formatNumber, formatCompact } from '../../utils/formatters'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-card-hover border border-slate-100 px-3.5 py-3 text-xs">
      <p className="font-semibold text-ink mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-500 capitalize">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.dataKey}
          </span>
          <span className="font-semibold text-ink tabular">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ComparisonBarChart({ data, height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 6" stroke="#EEF0F8" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={{ stroke: '#EEF0F8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={36} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F7FC' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748B', paddingTop: 12 }} />
        <Bar dataKey="planned" name="Planned" fill={CHART_COLORS.slateLight} radius={[8, 8, 0, 0]} />
        <Bar dataKey="achieved" name="Achieved" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
