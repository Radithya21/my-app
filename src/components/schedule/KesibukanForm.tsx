import { useState } from 'react'
import toast from 'react-hot-toast'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Kesibukan, KesibukanStatus } from '../../types'

const COLOR_OPTIONS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#84CC16',
  '#6B7280',
]

type FormData = Omit<Kesibukan, 'id' | 'subKesibukan' | 'createdAt' | 'updatedAt'>

interface KesibukanFormProps {
  initialData?: Kesibukan
  onSubmit: (data: FormData) => void
  onCancel: () => void
}

export function KesibukanForm({ initialData, onSubmit, onCancel }: KesibukanFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    deadline: initialData?.deadline ?? '',
    status: (initialData?.status ?? 'aktif') as KesibukanStatus,
    colorLabel: initialData?.colorLabel ?? COLOR_OPTIONS[0],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
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
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      deadline: form.deadline || undefined,
      status: form.status,
      colorLabel: form.colorLabel,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nama Kesibukan"
        placeholder="Contoh: Skripsi, Hackathon ASEAN, Magang..."
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors.name}
      />

      <Textarea
        label="Deskripsi (opsional)"
        placeholder="Konteks singkat tentang kesibukan ini..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
      />

      <Input
        label="Deadline (opsional)"
        type="date"
        value={form.deadline}
        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
      />

      {initialData && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">Status</label>
          <div className="flex gap-2">
            {(['aktif', 'ditunda', 'selesai'] as KesibukanStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, status: s })}
                className={[
                  'px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize',
                  form.status === s
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-muted hover:text-text-primary',
                ].join(' ')}
              >
                {s === 'aktif' ? 'Aktif' : s === 'ditunda' ? 'Ditunda' : 'Selesai'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-primary">Warna Label</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, colorLabel: color })}
              style={{ backgroundColor: color }}
              className={[
                'w-7 h-7 rounded-full transition-transform',
                form.colorLabel === color ? 'scale-125 ring-2 ring-offset-2 ring-border' : 'hover:scale-110',
              ].join(' ')}
              aria-label={`Warna ${color}`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          {initialData ? 'Simpan Perubahan' : 'Buat Kesibukan'}
        </Button>
      </div>
    </form>
  )
}
