import { useLocation } from 'react-router-dom'
import { Sun, Moon, Monitor, Command } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import { useAIStore } from '../../store/useAIStore'
import type { Theme } from '../../types'

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/debt': 'Hutang',
  '/schedule': 'Kesibukan',
  '/goals': 'Tujuan',
  '/todo': 'To-Do',
  '/settings': 'Pengaturan',
}

const themeIcons: Record<Theme, React.ReactNode> = {
  light: <Sun size={16} />,
  dark: <Moon size={16} />,
  system: <Monitor size={16} />,
}

const nextTheme: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

const themeLabel: Record<Theme, string> = {
  light: 'Mode terang',
  dark: 'Mode gelap',
  system: 'Ikuti sistem',
}

export function Navbar() {
  const location = useLocation()
  const { theme, setTheme } = useUIStore()
  const hasApiKey = !!useUIStore((s) => s.geminiApiKey)
  const { openCommandBar, digestUnread } = useAIStore()
  const pageName = routeNames[location.pathname] ?? 'PersonalOS'

  return (
    <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 md:px-6 bg-bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold select-none">
          P
        </div>
        <span className="font-semibold text-text-primary hidden md:block">PersonalOS</span>
        <span className="text-text-muted hidden md:block">/</span>
        <span className="font-medium text-text-primary text-sm">{pageName}</span>
      </div>
      <div className="flex items-center gap-1">
        {hasApiKey && (
          <button
            onClick={openCommandBar}
            aria-label="Buka command bar (Space×2)"
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <Command size={14} />
            <span className="hidden sm:block">Space×2</span>
            {digestUnread && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
            )}
          </button>
        )}
        <button
          onClick={() => setTheme(nextTheme[theme])}
          aria-label={`Ubah tema: saat ini ${themeLabel[theme]}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
        >
          {themeIcons[theme]}
          <span className="hidden sm:block">{themeLabel[theme]}</span>
        </button>
      </div>
    </header>
  )
}
