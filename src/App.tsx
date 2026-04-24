import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppLayout } from './components/layout/AppLayout'
import { useUIStore } from './store/useUIStore'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const DebtPage = lazy(() => import('./pages/DebtPage'))
const SchedulePage = lazy(() => import('./pages/SchedulePage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const TodoPage = lazy(() => import('./pages/TodoPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const applyTheme = useUIStore((s) => s.applyTheme)

  useEffect(() => {
    applyTheme()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', applyTheme)
    return () => mq.removeEventListener('change', applyTheme)
  }, [applyTheme])

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="debt" element={<DebtPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="todo" element={<TodoPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  )
}
