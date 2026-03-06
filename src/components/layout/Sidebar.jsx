import { NavLink } from 'react-router-dom'
import { BarChart3, BookOpen, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUiStore } from '../../stores/uiStore'

const navItems = [
  { to: '/chart', label: 'Chart Monitor', icon: TrendingUp },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/stats', label: 'Statistics', icon: BarChart3 },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-gray-700 bg-gray-900 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!sidebarCollapsed && (
            <span className="text-sm font-bold text-indigo-400 tracking-wider">L4MII</span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400 border-r-2 border-indigo-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              <Icon size={20} />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-700 bg-gray-900">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
                isActive ? 'text-indigo-400' : 'text-gray-500'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
