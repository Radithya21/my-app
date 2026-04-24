import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppLayout() {
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
    </div>
  )
}
