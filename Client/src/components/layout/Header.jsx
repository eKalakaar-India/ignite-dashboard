import React from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Bell, CircleUserRound } from 'lucide-react'
import { DATE_RANGE } from '../../data/mockData'
import { formatDate } from '../../utils/dateUtils'

const TITLES = {
  '/dashboard': { title: 'Executive Dashboard', desc: 'Programme-wide overview and reach' },
  '/daily': { title: 'Daily Field Activities', desc: 'Field-level session log' },
  '/performance': { title: 'Performance', desc: 'Weekly & monthly planned vs achieved' },
  '/documentation': { title: 'Documentation', desc: 'Uploads & evidence completion tracking' },
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const meta = TITLES[pathname] || { title: 'IgNITE', desc: '' }

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-8 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="sm:hidden shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
          >
            <Menu size={19} />
          </button>
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-ink text-[15px] leading-tight truncate">{meta.title}</h2>
            <p className="text-xs text-slate-400 truncate hidden sm:block">{meta.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <span className="hidden md:inline-flex text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5">
            Data as of {formatDate(DATE_RANGE.end)}
          </span>
          <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <Bell size={17} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-bloom" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white">
              <CircleUserRound size={18} />
            </div>
            <div className="hidden lg:block leading-tight">
              <p className="text-xs font-semibold text-ink">Programme Manager</p>
              <p className="text-[11px] text-slate-400">National Office</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
