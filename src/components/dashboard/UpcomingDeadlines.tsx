import { useNavigate } from 'react-router-dom'
import { CreditCard, CheckSquare, Target, AlertCircle } from 'lucide-react'
import { useDebtStore } from '../../store/useDebtStore'
import { useTodoStore } from '../../store/useTodoStore'
import { useGoalStore } from '../../store/useGoalStore'
import { formatDateMini, daysUntil } from '../../utils/formatDate'

interface DeadlineItem {
  id: string
  title: string
  dueDate: string
  type: 'debt' | 'todo' | 'goal'
  daysLeft: number
}

export function UpcomingDeadlines() {
  const navigate = useNavigate()
  const debts = useDebtStore((s) => s.items)
  const todos = useTodoStore((s) => s.items)
  const goals = useGoalStore((s) => s.goals)

  const deadlines: DeadlineItem[] = [
    ...debts
      .filter((d) => !d.isPaid && d.dueDate)
      .map((d) => ({
        id: d.id,
        title: `Hutang ke ${d.personName}`,
        dueDate: d.dueDate!,
        type: 'debt' as const,
        daysLeft: daysUntil(d.dueDate!),
      })),
    ...todos
      .filter((t) => !t.isCompleted && t.dueDate)
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate!,
        type: 'todo' as const,
        daysLeft: daysUntil(t.dueDate!),
      })),
    ...goals
      .filter((g) => g.status !== 'completed' && g.targetDate)
      .map((g) => ({
        id: g.id,
        title: g.title,
        dueDate: g.targetDate!,
        type: 'goal' as const,
        daysLeft: daysUntil(g.targetDate!),
      })),
  ]
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5)

  const routeMap = { debt: '/debt', todo: '/todo', goal: '/goals' }
  const iconMap = {
    debt: <CreditCard size={14} />,
    todo: <CheckSquare size={14} />,
    goal: <Target size={14} />,
  }

  if (deadlines.length === 0) return null

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <AlertCircle size={14} className="text-warning" />
        Deadline Terdekat
      </h2>
      <div className="flex flex-col gap-2">
        {deadlines.map((item) => {
          const isOverdue = item.daysLeft < 0
          const isUrgent = item.daysLeft <= 3 && item.daysLeft >= 0
          return (
            <button
              key={item.id}
              onClick={() => navigate(routeMap[item.type])}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors text-left w-full"
            >
              <span className={isOverdue ? 'text-danger' : isUrgent ? 'text-warning' : 'text-text-muted'}>
                {iconMap[item.type]}
              </span>
              <span className="flex-1 text-sm text-text-primary truncate">{item.title}</span>
              <span className={[
                'text-xs font-medium font-mono whitespace-nowrap',
                isOverdue ? 'text-danger' : isUrgent ? 'text-warning' : 'text-text-muted',
              ].join(' ')}>
                {isOverdue
                  ? `${Math.abs(item.daysLeft)} hari lalu`
                  : item.daysLeft === 0
                  ? 'Hari ini'
                  : item.daysLeft === 1
                  ? 'Besok'
                  : `${item.daysLeft} hari`}
              </span>
              <span className="text-xs text-text-muted">{formatDateMini(item.dueDate)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
