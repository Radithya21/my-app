import { useState } from 'react'
import { Edit2, Trash2, CheckCircle, RotateCcw, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Modal } from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import type { DebtItem } from '../../types'
import { formatCurrency, formatCurrencyInput, parseCurrency } from '../../utils/formatCurrency'
import { formatDateShort, daysUntil, toISODate } from '../../utils/formatDate'

interface DebtCardProps {
  item: DebtItem
  onEdit: (item: DebtItem) => void
  onDelete: (id: string) => void
  onAddPayment: (id: string, amount: number, paymentDate: string, note?: string) => void
  onMarkUnpaid: (id: string) => void
}

export function DebtCard({ item, onEdit, onDelete, onAddPayment, onMarkUnpaid }: DebtCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentDate, setPaymentDate] = useState(toISODate(new Date()))
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [expanded, setExpanded] = useState(false)

  const paidAmount = Math.max(0, Math.min(item.paidAmount ?? 0, item.amount))
  const remainingAmount = Math.max(item.amount - paidAmount, 0)
  const isFullyPaid = item.isPaid || remainingAmount <= 0

  const daysLeft = item.dueDate ? daysUntil(item.dueDate) : null
  const isOverdue = daysLeft !== null && daysLeft < 0
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0

  const openPaymentModal = () => {
    setPaymentDate(toISODate(new Date()))
    setPaymentAmount(formatCurrencyInput(String(remainingAmount)))
    setPaymentNote('')
    setShowPaymentModal(true)
  }

  const handleSubmitPayment = () => {
    const amount = parseCurrency(paymentAmount)
    if (amount <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0')
      return
    }
    onAddPayment(item.id, amount, paymentDate, paymentNote)
    setShowPaymentModal(false)
  }

  return (
    <>
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-text-primary">{item.personName}</span>
                {isFullyPaid ? (
                  <Badge variant="success">Lunas</Badge>
                ) : paidAmount > 0 ? (
                  <Badge variant="warning">Nyicil</Badge>
                ) : (
                  <Badge variant="danger">Belum Lunas</Badge>
                )}
                {!isFullyPaid && isOverdue && (
                  <Badge variant="danger">Terlambat</Badge>
                )}
                {!isFullyPaid && isUrgent && !isOverdue && (
                  <Badge variant="warning">Segera</Badge>
                )}
              </div>
              <p className="text-2xl font-bold font-mono mt-1 text-text-primary">
                {formatCurrency(isFullyPaid ? item.amount : remainingAmount)}
              </p>
              {!isFullyPaid && (
                <p className="text-xs text-text-muted mt-0.5">
                  Sisa dari {formatCurrency(item.amount)} · Terbayar {formatCurrency(paidAmount)}
                </p>
              )}
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
                {daysLeft !== null && !isFullyPaid && (
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
            {!isFullyPaid && paidAmount > 0 && (
              <p className="text-xs text-warning">
                Total cicilan: {formatCurrency(paidAmount)} · Sisa: {formatCurrency(remainingAmount)}
              </p>
            )}
            {isFullyPaid && item.paidDate && (
              <p className="text-xs text-success">Dilunasi: {formatDateShort(item.paidDate)}</p>
            )}

            {(item.payments?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-border bg-bg-secondary/40 p-2.5 space-y-1.5">
                <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Riwayat Pembayaran</p>
                {[...(item.payments ?? [])]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((payment) => (
                    <div key={payment.id} className="flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="text-text-primary font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-text-muted">{formatDateShort(payment.date)}{payment.note ? ` · ${payment.note}` : ''}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {!isFullyPaid ? (
                <Button size="sm" variant="secondary" onClick={openPaymentModal}>
                  <CheckCircle size={12} />
                  Bayar / Cicil
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
        message={`Hapus catatan ${item.personName} dengan sisa ${formatCurrency(remainingAmount)}?`}
      />

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Catat Pembayaran" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Sisa tagihan: <span className="font-semibold text-text-primary">{formatCurrency(remainingAmount)}</span>
          </p>

          <Input
            label="Jumlah Pembayaran (Rp)"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(formatCurrencyInput(e.target.value))}
            inputMode="numeric"
            placeholder="0"
          />

          <Input
            label="Tanggal Pembayaran"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />

          <Textarea
            label="Catatan (opsional)"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="Contoh: transfer bank"
            rows={2}
          />

          <button
            type="button"
            onClick={() => setPaymentAmount(formatCurrencyInput(String(remainingAmount)))}
            className="text-xs text-accent hover:underline self-start"
          >
            Isi otomatis nominal pelunasan
          </button>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Batal</Button>
            <Button onClick={handleSubmitPayment}>
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
