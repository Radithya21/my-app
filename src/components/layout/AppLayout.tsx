import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { CommandBar } from '../ai/CommandBar'
import { useAIStore } from '../../store/useAIStore'

export function AppLayout() {
  const openCommandBar = useAIStore((s) => s.openCommandBar)

  useEffect(() => {
    let lastSpaceTime = 0
    const DOUBLE_PRESS_MS = 300

    const handler = (e: KeyboardEvent) => {
      if (e.key !== ' ') return
      const tag = (e.target as HTMLElement).tagName
      const isEditable = (e.target as HTMLElement).isContentEditable
      if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) return

      const now = Date.now()
      if (now - lastSpaceTime < DOUBLE_PRESS_MS) {
        e.preventDefault()
        openCommandBar()
        lastSpaceTime = 0
      } else {
        lastSpaceTime = now
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [openCommandBar])

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <CommandBar />
    </div>
  )
}
