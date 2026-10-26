import React from 'react'
import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing to show', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400" strokeWidth={1.75} />
      </div>
      <h4 className="font-display font-semibold text-ink text-[15px]">{title}</h4>
      {message && <p className="text-sm text-slate-500 mt-1.5 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
