import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { formatNumber } from '../../utils/formatters'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-white rounded-xl shadow-card-hover border border-slate-100 px-3.5 py-2.5 text-xs">
      <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
        <span className="w-2 h-2 rounded-full" style={{ background: p.payload.color }} />
        {p.name}
      </div>
      <p className="font-semibold text-ink tabular">{formatNumber(p.value)}</p>
    </div>
  )
}

export default function DonutChart({ data, height = 240, centerLabel, centerValue }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-xl font-bold text-ink tabular">{centerValue}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">{centerLabel}</span>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  )
}
