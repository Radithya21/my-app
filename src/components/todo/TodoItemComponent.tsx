import { motion } from 'framer-motion'
import { Pin, Edit2, Trash2 } from 'lucide-react'
import type { TodoItem, TodoPriority } from '../../types'
import { formatDateMini, daysUntil } from '../../utils/formatDate'

const priorityBorder: Record<TodoPriority, string> = {
  urgent: 'border-l-danger',
  high: 'border-l-warning',
  medium: 'border-l-accent',
  low: 'border-l-border',
}

const priorityLabel: Record<TodoPriority, string> = {
  urgent: 'Mendesak',
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
}

interface TodoItemComponentProps {
  item: TodoItem
  onToggle: (id: string) => void
  onTogglePin: (id: string) => void
  onEdit: (item: TodoItem) => void
  onDelete: (id: string) => void
}

export function TodoItemComponent({ item, onToggle, onTogglePin, onEdit, onDelete }: TodoItemComponentProps) {
  const daysLeft = item.dueDate ? daysUntil(item.dueDate) : null
  const isOverdue = daysLeft !== null && daysLeft < 0 && !item.isCompleted
  const isUrgentDue = daysLeft !== null && daysLeft <= 1 && daysLeft >= 0 && !item.isCompleted

  const handleToggle = () => {
    onToggle(item.id)
  }

  return (
    <motion.div
      layout
      className={[
        'bg-bg-card border border-border border-l-4 rounded-xl p-3 flex items-start gap-3 group',
        priorityBorder[item.priority],
        item.isPinned ? 'ring-1 ring-accent/20' : '',
      ].join(' ')}
    >
      <button
        onClick={handleToggle}
        aria-label={item.isCompleted ? 'Batalkan' : 'Tandai selesai'}
        className={[
          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
          item.isCompleted
            ? 'bg-success border-success'
            : 'border-border hover:border-success',
        ].join(' ')}
      >
        {item.isCompleted && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
          >
            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={[
          'text-sm transition-all duration-300',
          item.isCompleted ? 'line-through text-text-muted' : 'text-text-primary',
        ].join(' ')}>
          {item.title}
        </p>
        {item.description && !item.isCompleted && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.category && (
            <span className="text-xs px-1.5 py-0.5 bg-bg-secondary text-text-muted rounded">
              {item.category}
            </span>
          )}
          <span className="text-xs text-text-muted">{priorityLabel[item.priority]}</span>
          {item.dueDate && (
            <span className={[
              'text-xs',
              isOverdue ? 'text-danger' : isUrgentDue ? 'text-warning' : 'text-text-muted',
            ].join(' ')}>
              {formatDateMini(item.dueDate)}
              {item.dueTime && ` ${item.dueTime}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onTogglePin(item.id)}
          aria-label={item.isPinned ? 'Unpin' : 'Pin'}
          className={['p-1.5 rounded-lg transition-colors', item.isPinned ? 'text-accent' : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'].join(' ')}
        >
          <Pin size={12} />
        </button>
        <button
          onClick={() => onEdit(item)}
          aria-label="Edit"
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          aria-label="Hapus"
          className="p-1.5 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  )
}
