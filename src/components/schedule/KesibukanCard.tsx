import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Edit2, Trash2, Play, Pause, Archive, RotateCcw, Plus, Calendar } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { SubKesibukanItem } from './SubKesibukanItem'
import type { Kesibukan, KesibukanStatus } from '../../types'
import { calcKesibukanProgress } from '../../store/useKesibukanStore'
import { formatDateMini, daysUntil } from '../../utils/formatDate'

interface KesibukanCardProps {
  kesibukan: Kesibukan
  onEdit: (k: Kesibukan) => void
  onDelete: (id: string) => void
  onSetStatus: (id: string, status: KesibukanStatus) => void
  onAddSub: (kId: string, sub: { name: string; deadline?: string }) => void
  onUpdateSub: (kId: string, subId: string, updates: { name?: string; deadline?: string }) => void
  onDeleteSub: (kId: string, subId: string) => void
  onToggleStep: (kId: string, subId: string, stepId: string) => void
  onDeleteStep: (kId: string, subId: string, stepId: string) => void
  onAddStep: (kId: string, subId: string, step: { name: string; deadline?: string; notes?: string }) => void
  onUpdateStep: (kId: string, subId: string, stepId: string, updates: { name?: string; deadline?: string; notes?: string }) => void
}

const statusConfig: Record<KesibukanStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'muted' }> = {
  aktif: { label: 'Aktif', variant: 'info' },
  ditunda: { label: 'Ditunda', variant: 'warning' },
  selesai: { label: 'Selesai', variant: 'success' },
}

export function KesibukanCard({
  kesibukan,
  onEdit,
  onDelete,
  onSetStatus,
  onAddSub,
  onUpdateSub,
  onDeleteSub,
  onToggleStep,
  onDeleteStep,
  onAddStep,
  onUpdateStep,
}: KesibukanCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showAddSub, setShowAddSub] = useState(false)
  const [subName, setSubName] = useState('')
  const [subDeadline, setSubDeadline] = useState('')

  const progress = calcKesibukanProgress(kesibukan)
  const { label: statusLabel, variant: statusVariant } = statusConfig[kesibukan.status]
  const totalSubs = kesibukan.subKesibukan.length
  const totalSteps = kesibukan.subKesibukan.reduce((sum, s) => sum + s.steps.length, 0)
  const completedSteps = kesibukan.subKesibukan.reduce(
    (sum, s) => sum + s.steps.filter((step) => step.isCompleted).length,
    0
  )

  const daysLeft = kesibukan.deadline ? daysUntil(kesibukan.deadline) : null
  const isOverdue = daysLeft !== null && daysLeft < 0
  const isCritical = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3

  const handleAddSub = () => {
    if (!subName.trim()) return
    onAddSub(kesibukan.id, { name: subName.trim(), deadline: subDeadline || undefined })
    setSubName('')
    setSubDeadline('')
    setShowAddSub(false)
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      {/* Color strip */}
      <div className="h-1" style={{ backgroundColor: kesibukan.colorLabel }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              {totalSubs > 0 && (
                <span className="text-xs text-text-muted">{totalSubs} sub-kesibukan</span>
              )}
            </div>
            <h3 className="font-semibold text-text-primary mt-1.5">{kesibukan.name}</h3>
            {kesibukan.description && (
              <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{kesibukan.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              aria-label="Lihat detail"
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <ChevronDown
                size={14}
                className={['transition-transform duration-200', expanded ? 'rotate-180' : ''].join(' ')}
              />
            </button>
            <button
              onClick={() => onEdit(kesibukan)}
              aria-label="Edit"
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(kesibukan.id)}
              aria-label="Hapus"
              className="p-1.5 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {totalSteps > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-text-muted">
              <span>{completedSteps}/{totalSteps} langkah</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: kesibukan.colorLabel }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Deadline */}
        {kesibukan.deadline && (
          <div className="flex items-center gap-1 mt-2">
            <Calendar size={12} className={isOverdue ? 'text-danger' : isCritical ? 'text-warning' : 'text-text-muted'} />
            <span className={['text-xs', isOverdue ? 'text-danger' : isCritical ? 'text-warning' : 'text-text-muted'].join(' ')}>
              Deadline: {formatDateMini(kesibukan.deadline)}
              {isOverdue
                ? ' (Terlambat)'
                : isCritical
                ? ` (${daysLeft} hari lagi)`
                : daysLeft === 0
                ? ' (Hari ini!)'
                : ''}
            </span>
          </div>
        )}

        {/* Status action buttons */}
        {kesibukan.status !== 'selesai' && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {kesibukan.status === 'aktif' && (
              <>
                <button
                  onClick={() => onSetStatus(kesibukan.id, 'ditunda')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-secondary text-text-secondary rounded-lg hover:bg-border transition-colors"
                >
                  <Pause size={10} /> Tunda
                </button>
                <button
                  onClick={() => onSetStatus(kesibukan.id, 'selesai')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-success text-white rounded-lg hover:opacity-90 transition-colors"
                >
                  <Archive size={10} /> Selesai
                </button>
              </>
            )}
            {kesibukan.status === 'ditunda' && (
              <button
                onClick={() => onSetStatus(kesibukan.id, 'aktif')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:opacity-90 transition-colors"
              >
                <Play size={10} /> Lanjutkan
              </button>
            )}
          </div>
        )}
        {kesibukan.status === 'selesai' && (
          <button
            onClick={() => onSetStatus(kesibukan.id, 'aktif')}
            className="flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs bg-bg-secondary text-text-secondary rounded-lg hover:bg-border transition-colors"
          >
            <RotateCcw size={10} /> Aktifkan Kembali
          </button>
        )}
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
              {kesibukan.subKesibukan.length === 0 && !showAddSub && (
                <p className="text-xs text-text-muted italic">Belum ada sub-kesibukan. Tambah di bawah.</p>
              )}

              {[...kesibukan.subKesibukan]
                .sort((a, b) => a.order - b.order)
                .map((sub) => (
                  <SubKesibukanItem
                    key={sub.id}
                    kesibukanId={kesibukan.id}
                    sub={sub}
                    colorLabel={kesibukan.colorLabel}
                    onDeleteSub={(subId) => onDeleteSub(kesibukan.id, subId)}
                    onUpdateSub={(subId, updates) => onUpdateSub(kesibukan.id, subId, updates)}
                    onToggleStep={(subId, stepId) => onToggleStep(kesibukan.id, subId, stepId)}
                    onDeleteStep={(subId, stepId) => onDeleteStep(kesibukan.id, subId, stepId)}
                    onAddStep={(subId, step) => onAddStep(kesibukan.id, subId, step)}
                    onUpdateStep={(subId, stepId, updates) => onUpdateStep(kesibukan.id, subId, stepId, updates)}
                  />
                ))}

              {/* Add sub-kesibukan form */}
              {showAddSub ? (
                <div className="flex flex-col gap-2 p-3 bg-bg-secondary rounded-lg border border-border">
                  <input
                    autoFocus
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSub(); if (e.key === 'Escape') setShowAddSub(false) }}
                    className="text-sm bg-bg-card border border-border rounded-lg px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Nama sub-kesibukan..."
                  />
                  <input
                    type="date"
                    value={subDeadline}
                    onChange={(e) => setSubDeadline(e.target.value)}
                    className="text-sm bg-bg-card border border-border rounded-lg px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSub}
                      className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:opacity-90"
                    >
                      Tambah
                    </button>
                    <button
                      onClick={() => { setShowAddSub(false); setSubName(''); setSubDeadline('') }}
                      className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSub(true)}
                  className="flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors py-1.5 w-full text-left"
                >
                  <Plus size={14} />
                  Tambah Sub-Kesibukan
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
