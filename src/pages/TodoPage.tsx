import { useState, useMemo } from 'react'
import { addDays, startOfDay, endOfWeek, isAfter } from 'date-fns'
import { AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { CheckSquare, Trash2 } from 'lucide-react'
import { QuickAdd } from '../components/todo/QuickAdd'
import { TodoItemComponent } from '../components/todo/TodoItemComponent'
import { TodoForm } from '../components/todo/TodoForm'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useTodoStore } from '../store/useTodoStore'
import { useLocalDate } from '../hooks/useLocalDate'
import type { TodoItem, TodoGroup } from '../types'
import { toISODate } from '../utils/formatDate'

type FilterType = 'all' | 'today' | 'urgent' | string

const groupLabels: Record<TodoGroup, string> = {
  today: 'Hari Ini',
  tomorrow: 'Besok',
  this_week: 'Minggu Ini',
  later: 'Nanti',
  done: 'Selesai',
}

function groupTodos(items: TodoItem[], now: Date): Record<TodoGroup, TodoItem[]> {
  const today = toISODate(now)
  const tomorrow = toISODate(addDays(now, 1))
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const groups: Record<TodoGroup, TodoItem[]> = {
    today: [], tomorrow: [], this_week: [], later: [], done: [],
  }

  for (const item of items) {
    if (item.isCompleted) {
      groups.done.push(item)
      continue
    }
    if (!item.dueDate) {
      groups.later.push(item)
      continue
    }
    if (item.dueDate <= today) {
      groups.today.push(item)
    } else if (item.dueDate === tomorrow) {
      groups.tomorrow.push(item)
    } else if (!isAfter(startOfDay(new Date(item.dueDate + 'T00:00:00')), weekEnd)) {
      groups.this_week.push(item)
    } else {
      groups.later.push(item)
    }
  }

  // Sort pinned to top within each group (except done)
  for (const key of ['today', 'tomorrow', 'this_week', 'later'] as const) {
    groups[key].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      const pa = ['urgent', 'high', 'medium', 'low'].indexOf(a.priority)
      const pb = ['urgent', 'high', 'medium', 'low'].indexOf(b.priority)
      return pa - pb
    })
  }

  return groups
}

export default function TodoPage() {
  const { items, addItem, updateItem, deleteItem, toggleComplete, togglePin, clearCompleted, markTodayAsDone } = useTodoStore()
  const now = useLocalDate()
  const [filter, setFilter] = useState<FilterType>('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<TodoItem | null>(null)

  const today = toISODate(now)

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'today') return items.filter((i) => !i.isCompleted && i.dueDate === today)
    if (filter === 'urgent') return items.filter((i) => !i.isCompleted && i.priority === 'urgent')
    return items.filter((i) => i.category === filter)
  }, [items, filter, today])

  const grouped = useMemo(() => groupTodos(filteredItems, now), [filteredItems, now])

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))] as string[]
  const completedCount = items.filter((i) => i.isCompleted).length

  const handleQuickAdd = (title: string, dueDate: string) => {
    addItem({ title, priority: 'medium', dueDate })
    toast.success('Tugas ditambahkan')
  }

  const handleAdd = (data: Omit<TodoItem, 'id' | 'isCompleted' | 'completedAt' | 'createdAt' | 'updatedAt'>) => {
    addItem(data)
    toast.success('Tugas ditambahkan')
    setShowForm(false)
  }

  const handleEdit = (data: Omit<TodoItem, 'id' | 'isCompleted' | 'completedAt' | 'createdAt' | 'updatedAt'>) => {
    if (!editItem) return
    updateItem(editItem.id, data)
    toast.success('Tugas diperbarui')
    setEditItem(null)
  }

  const handleDelete = (id: string) => {
    deleteItem(id)
    toast.success('Tugas dihapus')
  }

  const handleToggle = (id: string) => {
    toggleComplete(id)
  }

  const orderGroups: TodoGroup[] = ['today', 'tomorrow', 'this_week', 'later', 'done']
  const pendingCount = items.filter((i) => !i.isCompleted).length

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">
          To-Do
          {pendingCount > 0 && (
            <span className="ml-2 text-sm font-normal text-text-muted">{pendingCount} pending</span>
          )}
        </h1>
        <div className="flex gap-2">
          {completedCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { clearCompleted(); toast.success('Tugas selesai dihapus') }}
            >
              <Trash2 size={12} />
              Hapus selesai ({completedCount})
            </Button>
          )}
        </div>
      </div>

      <QuickAdd onAdd={handleQuickAdd} onOpenFull={() => setShowForm(true)} />

      <div className="flex gap-1 flex-wrap">
        {(['all', 'today', 'urgent'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === f ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-border',
            ].join(' ')}
          >
            {f === 'all' ? 'Semua' : f === 'today' ? 'Hari Ini' : 'Mendesak'}
          </button>
        ))}
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === cat ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-border',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {filter === 'today' && items.filter((i) => !i.isCompleted && i.dueDate === today).length > 0 && (
        <Button size="sm" variant="secondary" onClick={() => { markTodayAsDone(); toast.success('Semua tugas hari ini selesai!') }}>
          <CheckSquare size={12} />
          Tandai hari ini selesai
        </Button>
      )}

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={40} />}
          title="Inbox kosong"
          message="Nikmati atau mulai rencanakan harimu."
          ctaLabel="Tambah Tugas"
          onCta={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-6">
          {orderGroups.map((group) => {
            const groupItems = grouped[group]
            if (groupItems.length === 0) return null
            return (
              <div key={group}>
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                  {groupLabels[group]} · {groupItems.length}
                </h2>
                <AnimatePresence mode="popLayout">
                  {groupItems.map((item) => (
                    <div key={item.id} className="mb-2">
                      <TodoItemComponent
                        item={item}
                        onToggle={handleToggle}
                        onTogglePin={togglePin}
                        onEdit={setEditItem}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Tambah Tugas">
        <TodoForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Tugas">
        {editItem && (
          <TodoForm
            initialData={editItem}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>
    </div>
  )
}
