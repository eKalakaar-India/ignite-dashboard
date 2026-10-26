import React, { useState } from 'react'
import {createPortal} from 'react-dom'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAFCStore } from '../../store/afcStore'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const logout = useAFCStore((s) => s.logout)

  const location = useLocation()

  return (
    <div className="bg-cloud h-screen overflow-hidden text-slate-800">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={()=>logout()}
      />

      <main
        className={`relative isolate h-screen flex flex-col overflow-hidden transition-all duration-300 ${
              collapsed ? 'sm:ml-[84px]' : 'sm:ml-[248px]'
            }`}
      >
        {/* Cinematic Backdrop Glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[var(--accent-primary)]/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

        <Header onMenuClick={() => setMobileOpen(true)} />

        <div className="flex-1 overflow-y-auto p-8 relative">
          <div key={location.pathname} className="animate-fadeIn">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}