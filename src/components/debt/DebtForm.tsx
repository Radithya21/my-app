import { useState } from 'react'
import toast from 'react-hot-toast'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import type { DebtItem } from '../../types'
import { formatCurrencyInput, parseCurrency } from '../../utils/formatCurrency'
import { toISODate } from '../../utils/formatDate'

type DebtFormData = Omit<DebtItem, 'id' | 'isPaid' | 'paidAmount' | 'payments' | 'paidDate' | 'createdAt' | 'updatedAt'>

interface DebtFormProps {
  initialData?: Partial<DebtItem>
  onSubmit: (data: DebtFormData) => void
  onCancel: () => void
  defaultType?: 'owe' | 'lend'
}

export function DebtForm({ initialData, onSubmit, onCancel, defaultType = 'owe' }: DebtFormProps) {
  const [form, setForm] = useState({
    type: initialData?.type ?? defaultType,
    personName: initialData?.personName ?? '',
    amount: initialData?.amount ? initialData.amount.toLocaleString('id-ID') : '',
    description: initialData?.description ?? '',
    date: initialData?.date ?? toISODate(new Date()),
    dueDate: initialData?.dueDate ?? '',
    notes: initialData?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.personName.trim()) e.personName = 'Nama wajib diisi'
    if (!form.amount || parseCurrency(form.amount) <= 0) e.amount = 'Jumlah harus lebih dari 0'
    if (!form.description.trim()) e.description = 'Keterangan wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Mohon lengkapi form')
      return
    }
    onSubmit({
      type: form.type as 'owe' | 'lend',
      personName: form.personName.trim(),
      amount: parseCurrency(form.amount),
      description: form.description.trim(),
      date: form.date,
      dueDate: form.dueDate || undefined,
      notes: form.notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Tipe"
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value as 'owe' | 'lend' })}
      >
        <option value="owe">Hutang Saya (saya yang berhutang)</option>
        <option value="lend">Piutang (orang lain berhutang ke saya)</option>
      </Select>

      <Input
        label="Nama Orang"
        placeholder="Siapa?"
        value={form.personName}
        onChange={(e) => setForm({ ...form, personName: e.target.value })}
        error={errors.personName}
      />

      <Input
        label="Jumlah (Rp)"
        placeholder="0"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: formatCurrencyInput(e.target.value) })}
        error={errors.amount}
        inputMode="numeric"
      />

      <Input
        label="Keterangan"
        placeholder="Keperluan apa?"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        error={errors.description}
      />

      <Input
        label="Tanggal Transaksi"
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      <Input
        label="Jatuh Tempo (opsional)"
        type="date"
        value={form.dueDate}
        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
      />

      <Textarea
        label="Catatan (opsional)"
        placeholder="Informasi tambahan..."
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          {initialData ? 'Simpan Perubahan' : 'Tambah'}
        </Button>
      </div>
    </form>
  )
}
