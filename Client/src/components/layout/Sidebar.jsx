import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquareText,
  Trophy,
  Sparkles,
  X,
  FileCheck2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
} from 'lucide-react'
import { useAFCStore } from '../../store/afcStore'
import { hasAllowedRole, ROLES } from '../../routes/roles'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN] },
  { to: '/daily', label: 'Field Activities', icon: ClipboardList, roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_EXPERT] },
  { to: '/qualitative', label: 'Qualitative Analysis', icon: MessageSquareText, roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_EXPERT] },
  { to: '/performance', label: 'Performance', icon: Trophy, roles: [ROLES.SUPER_ADMIN] },
  { to: '/documentation', label: 'Documentation', icon: FileCheck2, roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_EXPERT] },
  { to: '/users', label: 'Add Users', icon: UserPlus, roles: [ROLES.SUPER_ADMIN] },
]

function NavItem({ to, label, icon: Icon, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
          collapsed
            ? 'justify-center px-3 py-3'
            : 'gap-3 px-3.5 py-3'
        } ${
          isActive
            ? 'bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-sm'
            : 'text-primary-100/80 hover:bg-white/[0.06] hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            strokeWidth={2}
            className={`shrink-0 ${
              isActive
                ? 'text-white'
                : 'text-primary-300 group-hover:text-white'
            }`}
          />

          {!collapsed && <span>{label}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({
  mobileOpen,
  onClose,
  onLogout,
  collapsed,
  setCollapsed,
}) {
  const role = useAFCStore((state) => state.user?.role)

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
      return
    }

    // Add your default logout logic here if you don't pass onLogout as a prop.
    console.log('Logout clicked')
  }

  const content = (
    <div
      className={`flex flex-col h-full bg-gradient-to-b relative from-primary-900 to-[#0D1230] text-white transition-all duration-300 ${
        collapsed ? 'w-[84px]' : 'w-[248px]'
      }`}
    >
      {/* Logo / Header */}
      <div
        className={`flex items-center px-5 pt-6 pb-6 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-bloom to-bloom-dark flex items-center justify-center shadow-sm">
            <Sparkles size={17} className="text-white" strokeWidth={2.25} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display font-bold text-[17px] leading-none tracking-tight whitespace-nowrap">
                AFC Gender Project
              </p>
              <p className="text-[10.5px] text-primary-300 leading-none mt-1.5 whitespace-nowrap">
                Empowering Girls. Enabling Futures.
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={onClose}
            className="sm:hidden text-primary-300 hover:text-white shrink-0"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5">
        {NAV_ITEMS.filter((item) => !item.roles || hasAllowedRole(role, item.roles)).map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            onNavigate={onClose}
          />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto px-3 pb-5 space-y-3">
        {!collapsed && (
          <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10">
            <p className="text-[11px] text-primary-200 leading-relaxed">
              Awareness Sessions on Increasing Girls&rsquo; Participation in ITIs
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          {/* Collapse Button - Desktop Only */}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className={`hidden sm:flex w-full items-center rounded-xl text-sm font-medium text-primary-100/80 hover:bg-white/[0.06] hover:text-white transition-all duration-200 ${
              collapsed
                ? 'justify-center px-3 py-3'
                : 'gap-3 px-3.5 py-3'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} className="shrink-0 text-primary-300" />
            ) : (
              <>
                <PanelLeftClose
                  size={18}
                  className="shrink-0 text-primary-300"
                />
                <span>Collapse</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-xl text-sm font-medium text-red-200 hover:bg-red-500/10 hover:text-red-100 transition-all duration-200 ${
              collapsed
                ? 'justify-center px-3 py-3'
                : 'gap-3 px-3.5 py-3'
            }`}
            title={collapsed ? 'Logout' : undefined}
            aria-label="Logout"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar - Fixed while page content scrolls */}
      <aside
        className={`hidden sm:block fixed left-0 top-0 z-30 h-screen transition-all duration-300 ${
          collapsed ? 'w-[84px]' : 'w-[248px]'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-[1px] animate-fadeIn"
            onClick={onClose}
          />

          <div className="absolute inset-y-0 left-0 animate-slideInLeft">
            <div className="w-[248px] h-full">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
