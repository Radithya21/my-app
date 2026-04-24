import { NavLink } from 'react-router-dom'
import { Home, CreditCard, Calendar, Target, CheckSquare } from 'lucide-react'

const navItems = [
  { to: '/', icon: <Home size={20} />, label: 'Home' },
  { to: '/debt', icon: <CreditCard size={20} />, label: 'Hutang' },
  { to: '/schedule', icon: <Calendar size={20} />, label: 'Sibuk' },
  { to: '/goals', icon: <Target size={20} />, label: 'Tujuan' },
  { to: '/todo', icon: <CheckSquare size={20} />, label: 'To-Do' },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-150',
                isActive ? 'text-accent' : 'text-text-muted',
              ].join(' ')
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
