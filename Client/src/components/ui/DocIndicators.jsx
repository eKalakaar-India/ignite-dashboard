import React from 'react'
import { ClipboardList, MessageSquareText, BookOpen, Camera, FileCheck2 } from 'lucide-react'

export const DOC_FIELDS = [
  { key: 'attendance', icon: ClipboardList, label: 'Attendance Sheet' },
  { key: 'consent', icon: FileCheck2, label: 'Consent Forms' },
  { key: 'feedback', icon: MessageSquareText, label: 'Feedback Forms' },
  { key: 'iecMaterial', icon: BookOpen, label: 'IEC Material' },
  { key: 'geoTaggedPhoto', icon: Camera, label: 'Geo-tagged Photo' },
]

function Dot({ icon: Icon, ok, label }) {
  return (
    <span
      title={label}
      className={`w-6 h-6 rounded-md flex items-center justify-center ${
        ok ? 'bg-growth-light text-growth-dark' : 'bg-danger-light text-danger-dark'
      }`}
    >
      <Icon size={12} />
    </span>
  )
}

// Compact status cluster for the required session documentation categories.
export default function DocIndicators({ record }) {
  return (
    <span className="flex items-center gap-1">
      {DOC_FIELDS.map((f) => (
        <Dot key={f.key} icon={f.icon} ok={record[f.key]} label={f.label} />
      ))}
    </span>
  )
}

export function missingDocLabels(record) {
  return DOC_FIELDS.filter((f) => !record[f.key]).map((f) => f.label)
}
