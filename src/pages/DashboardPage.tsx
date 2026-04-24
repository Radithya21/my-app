import { useNavigate } from 'react-router-dom'
import { CreditCard, Calendar, CheckSquare, Target, Plus } from 'lucide-react'
import { GreetingHeader } from '../components/dashboard/GreetingHeader'
import { SummaryCard } from '../components/dashboard/SummaryCard'
import { UpcomingDeadlines } from '../components/dashboard/UpcomingDeadlines'
import { useDebtStore } from '../store/useDebtStore'
import { useTodoStore } from '../store/useTodoStore'
import { useGoalStore } from '../store/useGoalStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { formatCurrency } from '../utils/formatCurrency'
import { toISODate } from '../utils/formatDate'

export default function DashboardPage() {
  const navigate = useNavigate()
  const debts = useDebtStore((s) => s.items)
  const todos = useTodoStore((s) => s.items)
  const goals = useGoalStore((s) => s.goals)
  const activities = useScheduleStore((s) => s.activities)

  const today = toISODate(new Date())
  const todayActivities = activities.filter((a) => {
    if (!a.isActive) return false
    if (a.recurrence === 'daily') return true
    if (a.recurrence === 'once') return a.date === today
    if (a.recurrence === 'weekly') {
      const dayOfWeek = new Date().getDay()
      return a.dayOfWeek?.includes(dayOfWeek) ?? false
    }
    if (a.recurrence === 'monthly') {
      return a.dayOfMonth === new Date().getDate()
    }
    return false
  })

  const unpaidDebts = debts.filter((d) => d.type === 'owe' && !d.isPaid)
  const totalDebt = unpaidDebts.reduce((s, d) => s + d.amount, 0)

  const pendingTodos = todos.filter((t) => !t.isCompleted)
  const inProgressGoals = goals.filter(
    (g) => g.status === 'in_progress' || g.status === 'not_started'
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <GreetingHeader />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Hutang"
          value={formatCurrency(totalDebt)}
          icon={<CreditCard size={16} />}
          color={totalDebt > 0 ? 'danger' : 'default'}
          subtitle={`${unpaidDebts.length} belum lunas`}
        />
        <SummaryCard
          label="Kesibukan Hari Ini"
          value={todayActivities.length}
          icon={<Calendar size={16} />}
          color="accent"
          subtitle="aktivitas terjadwal"
        />
        <SummaryCard
          label="Tujuan Aktif"
          value={inProgressGoals.length}
          icon={<Target size={16} />}
          color="warning"
          subtitle="sedang berjalan"
        />
        <SummaryCard
          label="To-Do Pending"
          value={pendingTodos.length}
          icon={<CheckSquare size={16} />}
          color={pendingTodos.length > 0 ? 'warning' : 'success'}
          subtitle="belum selesai"
        />
      </div>

      <UpcomingDeadlines />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tambah Hutang', to: '/debt', icon: <CreditCard size={16} /> },
          { label: 'Tambah Jadwal', to: '/schedule', icon: <Calendar size={16} /> },
          { label: 'Tambah Tujuan', to: '/goals', icon: <Target size={16} /> },
          { label: 'Tambah Tugas', to: '/todo', icon: <CheckSquare size={16} /> },
        ].map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="flex items-center gap-2 p-3 bg-bg-card border border-border rounded-xl text-sm text-text-secondary hover:text-accent hover:border-accent hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
          >
            <Plus size={14} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
