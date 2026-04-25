import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Edit2, Trash2, Play, Pause, CheckCircle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { AILabel } from '../ui/AILabel'
import { StepList } from './StepList'
import { GoalProgressChat } from '../goal/GoalProgressChat'
import type { Goal, GoalStatus, GoalStep } from '../../types'
import { formatDateShort, daysUntil } from '../../utils/formatDate'

const categoryLabels: Record<Goal['category'], string> = {
  career: 'Karier', finance: 'Keuangan', health: 'Kesehatan',
  education: 'Pendidikan', personal: 'Pribadi', other: 'Lainnya',
}

const statusLabels: Record<GoalStatus, string> = {
  not_started: 'Belum Mulai',
  in_progress: 'Berjalan',
  completed: 'Selesai',
  paused: 'Paused',
}

const statusVariant: Record<GoalStatus, 'default' | 'success' | 'warning' | 'muted' | 'info'> = {
  not_started: 'default',
  in_progress: 'info',
  completed: 'success',
  paused: 'muted',
}

interface GoalCardProps {
  goal: Goal
  onEdit: (goal: Goal) => void
  onDelete: (id: string) => void
  onSetStatus: (id: string, status: GoalStatus) => void
  onToggleStep: (goalId: string, stepId: string) => void
  onDeleteStep: (goalId: string, stepId: string) => void
  onAddStep: (goalId: string, title: string, targetDate?: string) => void
  onReorderSteps: (goalId: string, activeId: string, overId: string) => void
}

export function GoalCard({
  goal, onEdit, onDelete, onSetStatus,
  onToggleStep, onDeleteStep, onAddStep, onReorderSteps,
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'steps' | 'chat'>('steps')

  const completedSteps = goal.steps.filter((s: GoalStep) => s.isCompleted).length
  const totalSteps = goal.steps.length
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  const daysLeft = goal.targetDate ? daysUntil(goal.targetDate) : null
  const isOverdue = daysLeft !== null && daysLeft < 0

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusVariant[goal.status]}>{statusLabels[goal.status]}</Badge>
              <Badge variant="muted">{categoryLabels[goal.category]}</Badge>
              <Badge variant={goal.priority === 'high' ? 'danger' : goal.priority === 'medium' ? 'warning' : 'default'}>
                {goal.priority === 'high' ? 'Tinggi' : goal.priority === 'medium' ? 'Sedang' : 'Rendah'}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <h3 className="font-semibold text-text-primary">{goal.title}</h3>
              {goal.aiCoached && <AILabel />}
            </div>
            {goal.description && (
              <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              aria-label="Lihat detail"
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <ChevronDown size={14} className={['transition-transform duration-200', expanded ? 'rotate-180' : ''].join(' ')} />
            </button>
            <button onClick={() => onEdit(goal)} aria-label="Edit" className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(goal.id)} aria-label="Hapus" className="p-1.5 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {totalSteps > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-text-muted">
              <span>{completedSteps}/{totalSteps} langkah</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
          {goal.targetDate && (
            <span className={isOverdue ? 'text-danger' : daysLeft !== null && daysLeft <= 7 ? 'text-warning' : ''}>
              Target: {formatDateShort(goal.targetDate)}
              {daysLeft !== null && (
                <span className="ml-1">
                  ({daysLeft < 0 ? `${Math.abs(daysLeft)} hari lalu` : daysLeft === 0 ? 'hari ini' : `${daysLeft} hari lagi`})
                </span>
              )}
            </span>
          )}
        </div>

        {goal.status !== 'completed' && (
          <div className="flex gap-2 mt-3">
            {goal.status === 'not_started' && (
              <button onClick={() => onSetStatus(goal.id, 'in_progress')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors">
                <Play size={10} /> Mulai
              </button>
            )}
            {goal.status === 'in_progress' && (
              <>
                <button onClick={() => onSetStatus(goal.id, 'paused')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-secondary text-text-secondary rounded-lg hover:bg-border transition-colors">
                  <Pause size={10} /> Pause
                </button>
                <button onClick={() => onSetStatus(goal.id, 'completed')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-success text-white rounded-lg hover:opacity-90 transition-colors">
                  <CheckCircle size={10} /> Selesaikan
                </button>
              </>
            )}
            {goal.status === 'paused' && (
              <button onClick={() => onSetStatus(goal.id, 'in_progress')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors">
                <Play size={10} /> Lanjutkan
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              <div className="flex px-4 pt-2 gap-1">
                <button
                  onClick={() => setActiveTab('steps')}
                  className={[
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                    activeTab === 'steps'
                      ? 'bg-bg-secondary text-text-primary'
                      : 'text-text-muted hover:text-text-primary',
                  ].join(' ')}
                >
                  Langkah
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={[
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                    activeTab === 'chat'
                      ? 'bg-bg-secondary text-text-primary'
                      : 'text-text-muted hover:text-text-primary',
                  ].join(' ')}
                >
                  Chat ✦
                </button>
              </div>
              <div className="px-4 pb-4 pt-2">
                {activeTab === 'steps' ? (
                  <StepList
                    goalId={goal.id}
                    steps={goal.steps}
                    onToggle={onToggleStep}
                    onDelete={onDeleteStep}
                    onAdd={onAddStep}
                    onReorder={onReorderSteps}
                  />
                ) : (
                  <GoalProgressChat goal={goal} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
