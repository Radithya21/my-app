import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Trash2, Edit2, Plus, Check, Calendar, StickyNote } from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { SubKesibukan, KesibukanStep } from '../../types'
import { calcSubProgress, calcSubStatus } from '../../store/useKesibukanStore'
import { formatDateMini, daysUntil } from '../../utils/formatDate'

interface SubKesibukanItemProps {
  kesibukanId: string
  sub: SubKesibukan
  colorLabel: string
  onDeleteSub: (subId: string) => void
  onUpdateSub: (subId: string, updates: { name?: string; deadline?: string }) => void
  onToggleStep: (subId: string, stepId: string) => void
  onDeleteStep: (subId: string, stepId: string) => void
  onAddStep: (subId: string, step: { name: string; deadline?: string; notes?: string }) => void
  onUpdateStep: (subId: string, stepId: string, updates: { name?: string; deadline?: string; notes?: string }) => void
}

function DeadlineLabel({ deadline }: { deadline?: string }) {
  if (!deadline) return null
  const days = daysUntil(deadline)
  const isOverdue = days < 0
  const isCritical = days >= 0 && days <= 3
  return (
    <span
      className={[
        'flex items-center gap-1 text-xs',
        isOverdue ? 'text-danger' : isCritical ? 'text-warning' : 'text-text-muted',
      ].join(' ')}
    >
      <Calendar size={10} />
      {formatDateMini(deadline)}
      {isOverdue && <span className="font-medium">(Terlambat)</span>}
    </span>
  )
}

const subStatusConfig = {
  belum_mulai: { label: 'Belum Mulai', variant: 'muted' as const },
  berjalan: { label: 'Berjalan', variant: 'info' as const },
  selesai: { label: 'Selesai', variant: 'success' as const },
}

export function SubKesibukanItem({
  kesibukanId: _kesibukanId,
  sub,
  colorLabel,
  onDeleteSub,
  onUpdateSub,
  onToggleStep,
  onDeleteStep,
  onAddStep,
  onUpdateStep,
}: SubKesibukanItemProps) {
  const [expanded, setExpanded] = useState(true)
  const [editingSub, setEditingSub] = useState(false)
  const [subName, setSubName] = useState(sub.name)
  const [subDeadline, setSubDeadline] = useState(sub.deadline ?? '')
  const [showAddStep, setShowAddStep] = useState(false)
  const [stepName, setStepName] = useState('')
  const [stepDeadline, setStepDeadline] = useState('')
  const [stepNotes, setStepNotes] = useState('')
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [editStepData, setEditStepData] = useState<{ name: string; deadline: string; notes: string }>({ name: '', deadline: '', notes: '' })

  const progress = calcSubProgress(sub)
  const statusKey = calcSubStatus(sub)
  const { label: statusLabel, variant: statusVariant } = subStatusConfig[statusKey]

  const handleSaveSub = () => {
    if (!subName.trim()) return
    onUpdateSub(sub.id, { name: subName.trim(), deadline: subDeadline || undefined })
    setEditingSub(false)
  }

  const handleAddStep = () => {
    if (!stepName.trim()) return
    onAddStep(sub.id, { name: stepName.trim(), deadline: stepDeadline || undefined, notes: stepNotes.trim() || undefined })
    setStepName('')
    setStepDeadline('')
    setStepNotes('')
    setShowAddStep(false)
  }

  const startEditStep = (step: KesibukanStep) => {
    setEditingStep(step.id)
    setEditStepData({ name: step.name, deadline: step.deadline ?? '', notes: step.notes ?? '' })
  }

  const handleSaveStep = (stepId: string) => {
    if (!editStepData.name.trim()) return
    onUpdateStep(sub.id, stepId, {
      name: editStepData.name.trim(),
      deadline: editStepData.deadline || undefined,
      notes: editStepData.notes.trim() || undefined,
    })
    setEditingStep(null)
  }

  const sortedSteps = [...sub.steps].sort((a, b) => a.order - b.order)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Sub header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-secondary">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-text-primary transition-colors shrink-0"
        >
          <ChevronDown
            size={14}
            className={['transition-transform duration-200', expanded ? '' : '-rotate-90'].join(' ')}
          />
        </button>

        {editingSub ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSub(); if (e.key === 'Escape') setEditingSub(false) }}
              className="flex-1 text-sm bg-bg-card border border-border rounded px-2 py-1 text-text-primary outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="date"
              value={subDeadline}
              onChange={(e) => setSubDeadline(e.target.value)}
              className="text-xs bg-bg-card border border-border rounded px-2 py-1 text-text-primary outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleSaveSub}
              className="text-xs px-2 py-1 bg-accent text-white rounded hover:opacity-90"
            >
              Simpan
            </button>
            <button
              onClick={() => setEditingSub(false)}
              className="text-xs px-2 py-1 text-text-muted hover:text-text-primary"
            >
              Batal
            </button>
          </div>
        ) : (
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-text-primary truncate">{sub.name}</span>
            <Badge variant={statusVariant} >{statusLabel}</Badge>
            <DeadlineLabel deadline={sub.deadline} />
          </div>
        )}

        {!editingSub && (
          <div className="flex items-center gap-1 shrink-0">
            {sub.steps.length > 0 && (
              <span className="text-xs text-text-muted">{progress}%</span>
            )}
            <button
              onClick={() => setEditingSub(true)}
              className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-card rounded transition-colors"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => onDeleteSub(sub.id)}
              className="p-1 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {sub.steps.length > 0 && (
        <div className="h-1 bg-bg-secondary">
          <motion.div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: colorLabel }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 space-y-1">
              {sortedSteps.map((step) => (
                <div key={step.id}>
                  {editingStep === step.id ? (
                    <div className="flex flex-col gap-1.5 p-2 bg-bg-secondary rounded-lg">
                      <input
                        autoFocus
                        value={editStepData.name}
                        onChange={(e) => setEditStepData({ ...editStepData, name: e.target.value })}
                        className="text-sm bg-bg-card border border-border rounded px-2 py-1 text-text-primary outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Nama langkah"
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editStepData.deadline}
                          onChange={(e) => setEditStepData({ ...editStepData, deadline: e.target.value })}
                          className="flex-1 text-xs bg-bg-card border border-border rounded px-2 py-1 text-text-primary outline-none focus:ring-1 focus:ring-accent"
                        />
                        <input
                          value={editStepData.notes}
                          onChange={(e) => setEditStepData({ ...editStepData, notes: e.target.value })}
                          className="flex-1 text-xs bg-bg-card border border-border rounded px-2 py-1 text-text-primary outline-none focus:ring-1 focus:ring-accent"
                          placeholder="Catatan (opsional)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveStep(step.id)}
                          className="text-xs px-2 py-1 bg-accent text-white rounded hover:opacity-90"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingStep(null)}
                          className="text-xs px-2 py-1 text-text-muted hover:text-text-primary"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group py-1 px-2 rounded-lg hover:bg-bg-secondary transition-colors">
                      <button
                        onClick={() => onToggleStep(sub.id, step.id)}
                        className={[
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                          step.isCompleted
                            ? 'border-transparent text-white'
                            : 'border-border hover:border-accent',
                        ].join(' ')}
                        style={step.isCompleted ? { backgroundColor: colorLabel } : {}}
                      >
                        {step.isCompleted && <Check size={10} />}
                      </button>

                      <span
                        className={[
                          'flex-1 text-sm',
                          step.isCompleted ? 'line-through text-text-muted' : 'text-text-primary',
                        ].join(' ')}
                      >
                        {step.name}
                      </span>

                      {step.notes && (
                        <span title={step.notes}>
                          <StickyNote size={11} className="text-text-muted shrink-0" />
                        </span>
                      )}

                      <DeadlineLabel deadline={step.deadline} />

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => startEditStep(step)}
                          className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => onDeleteStep(sub.id, step.id)}
                          className="p-1 text-text-muted hover:text-danger rounded transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add step form */}
              {showAddStep ? (
                <div className="flex flex-col gap-1.5 p-2 bg-bg-secondary rounded-lg mt-1">
                  <input
                    autoFocus
                    value={stepName}
                    onChange={(e) => setStepName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddStep(); if (e.key === 'Escape') setShowAddStep(false) }}
                    className="text-sm bg-bg-card border border-border rounded px-2 py-1.5 text-text-primary outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Nama langkah..."
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={stepDeadline}
                      onChange={(e) => setStepDeadline(e.target.value)}
                      className="flex-1 text-xs bg-bg-card border border-border rounded px-2 py-1 text-text-primary outline-none focus:ring-1 focus:ring-accent"
                    />
                    <input
                      value={stepNotes}
                      onChange={(e) => setStepNotes(e.target.value)}
                      className="flex-1 text-xs bg-bg-card border border-border rounded px-2 py-1 text-text-primary outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Catatan (opsional)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddStep}
                      className="text-xs px-3 py-1 bg-accent text-white rounded hover:opacity-90"
                    >
                      Tambah
                    </button>
                    <button
                      onClick={() => { setShowAddStep(false); setStepName(''); setStepDeadline(''); setStepNotes('') }}
                      className="text-xs px-2 py-1 text-text-muted hover:text-text-primary"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddStep(true)}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors py-1 px-2 w-full text-left mt-0.5"
                >
                  <Plus size={12} />
                  Tambah Langkah
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
