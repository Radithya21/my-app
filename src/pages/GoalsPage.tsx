import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { GoalCard } from '../components/goals/GoalCard'
import { GoalForm } from '../components/goals/GoalForm'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { useGoalStore } from '../store/useGoalStore'
import type { Goal, GoalStatus } from '../types'

type FilterType = 'all' | GoalStatus

const filterLabels: Record<FilterType, string> = {
  all: 'Semua',
  not_started: 'Belum Mulai',
  in_progress: 'Berjalan',
  completed: 'Selesai',
  paused: 'Paused',
}

const PIE_COLORS = ['#71717A', '#3B82F6', '#22C55E', '#F59E0B']

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, setGoalStatus, addStep, deleteStep, toggleStep, reorderSteps } = useGoalStore()
  const [filter, setFilter] = useState<FilterType>('all')
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = goals.filter((g) => filter === 'all' || g.status === filter)

  const chartData = [
    { name: 'Belum Mulai', value: goals.filter((g) => g.status === 'not_started').length },
    { name: 'Berjalan', value: goals.filter((g) => g.status === 'in_progress').length },
    { name: 'Selesai', value: goals.filter((g) => g.status === 'completed').length },
    { name: 'Paused', value: goals.filter((g) => g.status === 'paused').length },
  ].filter((d) => d.value > 0)

  const handleAdd = (data: Omit<Goal, 'id' | 'steps' | 'createdAt' | 'updatedAt' | 'status'>) => {
    addGoal({ ...data, status: 'not_started' })
    toast.success('Tujuan ditambahkan')
    setShowForm(false)
  }

  const handleEdit = (data: Omit<Goal, 'id' | 'steps' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (!editGoal) return
    updateGoal(editGoal.id, data)
    toast.success('Tujuan diperbarui')
    setEditGoal(null)
  }

  const handleDelete = (id: string) => {
    deleteGoal(id)
    toast.success('Tujuan dihapus')
    setDeleteId(null)
  }

  const handleAddStep = (goalId: string, title: string, targetDate?: string) => {
    addStep(goalId, { title, isCompleted: false, targetDate, description: undefined, completedAt: undefined })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Langkah Kedepan</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          Tambah
        </Button>
      </div>

      {goals.length > 0 && chartData.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-text-muted mb-2">Distribusi Status</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {(Object.keys(filterLabels) as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === f ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-border',
            ].join(' ')}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Target size={40} />}
            title="Tidak ada tujuan"
            message="Impian tanpa rencana hanyalah angan. Tulis tujuan pertamamu!"
            ctaLabel="Buat Tujuan"
            onCta={() => setShowForm(true)}
          />
        ) : (
          filtered.map((goal) => (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-3"
            >
              <GoalCard
                goal={goal}
                onEdit={setEditGoal}
                onDelete={(id) => setDeleteId(id)}
                onSetStatus={setGoalStatus}
                onToggleStep={toggleStep}
                onDeleteStep={deleteStep}
                onAddStep={handleAddStep}
                onReorderSteps={reorderSteps}
              />
            </motion.div>
          ))
        )}
      </AnimatePresence>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Tambah Tujuan">
        <GoalForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!editGoal} onClose={() => setEditGoal(null)} title="Edit Tujuan">
        {editGoal && (
          <GoalForm
            initialData={editGoal}
            onSubmit={handleEdit}
            onCancel={() => setEditGoal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Hapus Tujuan"
        message="Menghapus tujuan ini akan menghapus semua langkah di dalamnya."
      />
    </div>
  )
}
