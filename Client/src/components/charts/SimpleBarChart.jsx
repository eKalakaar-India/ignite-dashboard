import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts'
import { formatNumber, formatCompact } from '../../utils/formatters'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-card-hover border border-slate-100 px-3.5 py-2.5 text-xs">
      <p className="font-semibold text-ink mb-0.5">{label}</p>
      <p className="text-slate-500">
        <span className="font-semibold text-ink tabular">{formatNumber(payload[0].value)}</span>
      </p>
    </div>
  )
}

export default function SimpleBarChart({ data, layout = 'vertical', height = 260, barSize = 26, showLabels = false }) {
  const isHorizontal = layout === 'horizontal' // bars run horizontally (category on Y axis)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: showLabels ? 40 : 8, left: isHorizontal ? 8 : -12, bottom: 0 }}
        barSize={barSize}
      >
        <CartesianGrid strokeDasharray="3 6" stroke="#EEF0F8" {...(isHorizontal ? { horizontal: false } : { vertical: false })} />
        {isHorizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#334155' }}
              tickLine={false}
              axisLine={false}
              width={110}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={{ stroke: '#EEF0F8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={36} />
          </>
        )}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F7FC' }} />
        <Bar dataKey="value" radius={isHorizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} />
          ))}
          {showLabels && (
            <LabelList
              dataKey="value"
              position={isHorizontal ? 'right' : 'top'}
              formatter={formatCompact}
              style={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
