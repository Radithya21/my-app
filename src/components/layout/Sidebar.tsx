import { NavLink } from 'react-router-dom'
import { Home, CreditCard, Calendar, Target, CheckSquare, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: <Home size={18} />, label: 'Dashboard' },
  { to: '/debt', icon: <CreditCard size={18} />, label: 'Hutang' },
  { to: '/schedule', icon: <Calendar size={18} />, label: 'Kesibukan' },
  { to: '/goals', icon: <Target size={18} />, label: 'Tujuan' },
  { to: '/todo', icon: <CheckSquare size={18} />, label: 'To-Do' },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-bg-card min-h-[calc(100vh-3.5rem)] sticky top-14">
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
                isActive
                  ? 'bg-accent text-white font-medium'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
              ].join(' ')
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            [
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
              isActive
                ? 'bg-accent text-white font-medium'
                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
            ].join(' ')
          }
        >
          <Settings size={18} />
          Pengaturan
        </NavLink>
      </div>
    </aside>
  )
}
