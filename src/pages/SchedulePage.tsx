import { useState } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { WeeklyView } from '../components/schedule/WeeklyView'
import { ActivityCard } from '../components/schedule/ActivityCard'
import { ActivityForm } from '../components/schedule/ActivityForm'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { useScheduleStore } from '../store/useScheduleStore'
import type { Activity, ActivityCategory } from '../types'
import { Calendar } from 'lucide-react'

const categoryLabels: Record<ActivityCategory, string> = {
  work: 'Kerja', personal: 'Pribadi', health: 'Kesehatan',
  learning: 'Belajar', social: 'Sosial', other: 'Lainnya',
}

type ViewMode = 'weekly' | 'list'

export default function SchedulePage() {
  const { activities, addActivity, updateActivity, deleteActivity, toggleActive } = useScheduleStore()
  const [view, setView] = useState<ViewMode>('weekly')
  const [showForm, setShowForm] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleAdd = (data: Omit<Activity, 'id' | 'createdAt'>) => {
    addActivity(data)
    toast.success('Aktivitas ditambahkan')
    setShowForm(false)
  }

  const handleEdit = (data: Omit<Activity, 'id' | 'createdAt'>) => {
    if (!editActivity) return
    updateActivity(editActivity.id, data)
    toast.success('Aktivitas diperbarui')
    setEditActivity(null)
  }

  const handleDelete = (id: string) => {
    deleteActivity(id)
    toast.success('Aktivitas dihapus')
    setDeleteId(null)
  }

  const grouped = Object.entries(categoryLabels).reduce<Record<ActivityCategory, Activity[]>>(
    (acc, [cat]) => {
      acc[cat as ActivityCategory] = activities.filter((a) => a.category === cat as ActivityCategory)
      return acc
    },
    {} as Record<ActivityCategory, Activity[]>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Mapping Kesibukan</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg">
            <button
              onClick={() => setView('weekly')}
              className={['p-1.5 rounded-md transition-colors', view === 'weekly' ? 'bg-bg-card shadow-sm text-text-primary' : 'text-text-muted hover:text-text-secondary'].join(' ')}
              aria-label="Weekly view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              className={['p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-bg-card shadow-sm text-text-primary' : 'text-text-muted hover:text-text-secondary'].join(' ')}
              aria-label="List view"
            >
              <List size={14} />
            </button>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            Tambah
          </Button>
        </div>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={<Calendar size={40} />}
          title="Belum ada aktivitas"
          message="Tambah rutinitas pertama kamu."
          ctaLabel="Tambah Aktivitas"
          onCta={() => setShowForm(true)}
        />
      ) : view === 'weekly' ? (
        <WeeklyView
          activities={activities}
          onEdit={setEditActivity}
          onDelete={(id) => setDeleteId(id)}
          onToggleActive={toggleActive}
        />
      ) : (
        <div className="space-y-6">
          {(Object.entries(grouped) as [ActivityCategory, Activity[]][]).map(([cat, items]) => {
            if (items.length === 0) return null
            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold text-text-muted mb-2">{categoryLabels[cat]}</h2>
                <AnimatePresence mode="popLayout">
                  {items.map((activity) => (
                    <motion.div
                      key={activity.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mb-2"
                    >
                      <ActivityCard
                        activity={activity}
                        onEdit={setEditActivity}
                        onDelete={(id) => setDeleteId(id)}
                        onToggleActive={toggleActive}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Tambah Aktivitas">
        <ActivityForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!editActivity} onClose={() => setEditActivity(null)} title="Edit Aktivitas">
        {editActivity && (
          <ActivityForm
            initialData={editActivity}
            onSubmit={handleEdit}
            onCancel={() => setEditActivity(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Hapus Aktivitas"
        message="Yakin ingin menghapus aktivitas ini?"
      />
    </div>
  )
}
