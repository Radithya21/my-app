import { useState } from 'react'
import { Edit2, Trash2, CheckCircle, RotateCcw, ChevronDown } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import type { DebtItem } from '../../types'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateShort, daysUntil, toISODate } from '../../utils/formatDate'

interface DebtCardProps {
  item: DebtItem
  onEdit: (item: DebtItem) => void
  onDelete: (id: string) => void
  onMarkPaid: (id: string, paidDate: string) => void
  onMarkUnpaid: (id: string) => void
}

export function DebtCard({ item, onEdit, onDelete, onMarkPaid, onMarkUnpaid }: DebtCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showPaidModal, setShowPaidModal] = useState(false)
  const [paidDate, setPaidDate] = useState(toISODate(new Date()))
  const [expanded, setExpanded] = useState(false)

  const daysLeft = item.dueDate ? daysUntil(item.dueDate) : null
  const isOverdue = daysLeft !== null && daysLeft < 0
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0

  return (
    <>
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-text-primary">{item.personName}</span>
                {item.isPaid ? (
                  <Badge variant="success">Lunas</Badge>
                ) : (
                  <Badge variant="danger">Belum Lunas</Badge>
                )}
                {!item.isPaid && isOverdue && (
                  <Badge variant="danger">Terlambat</Badge>
                )}
                {!item.isPaid && isUrgent && !isOverdue && (
                  <Badge variant="warning">Segera</Badge>
                )}
              </div>
              <p className="text-2xl font-bold font-mono mt-1 text-text-primary">
                {formatCurrency(item.amount)}
              </p>
              <p className="text-sm text-text-secondary mt-0.5">{item.description}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setExpanded(!expanded)}
                aria-label="Detail"
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
              >
                <ChevronDown size={14} className={['transition-transform', expanded ? 'rotate-180' : ''].join(' ')} />
              </button>
              <button
                onClick={() => onEdit(item)}
                aria-label="Edit"
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                aria-label="Hapus"
                className="p-1.5 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
            <span>{formatDateShort(item.date)}</span>
            {item.dueDate && (
              <span className={isOverdue ? 'text-danger' : isUrgent ? 'text-warning' : ''}>
                Jatuh tempo: {formatDateShort(item.dueDate)}
                {daysLeft !== null && !item.isPaid && (
                  <span className="ml-1">
                    ({daysLeft < 0 ? `${Math.abs(daysLeft)} hari lalu` : daysLeft === 0 ? 'hari ini' : `${daysLeft} hari lagi`})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
            {item.notes && (
              <p className="text-sm text-text-secondary">{item.notes}</p>
            )}
            {item.isPaid && item.paidDate && (
              <p className="text-xs text-success">Dilunasi: {formatDateShort(item.paidDate)}</p>
            )}
            <div className="flex gap-2 pt-1">
              {!item.isPaid ? (
                <Button size="sm" variant="secondary" onClick={() => setShowPaidModal(true)}>
                  <CheckCircle size={12} />
                  Tandai Lunas
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => onMarkUnpaid(item.id)}>
                  <RotateCcw size={12} />
                  Batalkan Lunas
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
        onConfirm={() => { onDelete(item.id); setShowConfirmDelete(false) }}
        title="Hapus Catatan"
        message={`Hapus hutang dengan ${item.personName} sebesar ${formatCurrency(item.amount)}?`}
      />

      <Modal isOpen={showPaidModal} onClose={() => setShowPaidModal(false)} title="Tandai Lunas" size="sm">
        <div className="flex flex-col gap-4">
          <Input
            label="Tanggal Pelunasan"
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowPaidModal(false)}>Batal</Button>
            <Button onClick={() => { onMarkPaid(item.id, paidDate); setShowPaidModal(false) }}>
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
