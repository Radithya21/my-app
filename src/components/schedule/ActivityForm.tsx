import { useState } from 'react'
import toast from 'react-hot-toast'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Activity, ActivityCategory } from '../../types'
import { toISODate } from '../../utils/formatDate'

type ActivityFormData = Omit<Activity, 'id' | 'createdAt'>

interface ActivityFormProps {
  initialData?: Partial<Activity>
  onSubmit: (data: ActivityFormData) => void
  onCancel: () => void
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function ActivityForm({ initialData, onSubmit, onCancel }: ActivityFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    category: initialData?.category ?? 'other' as ActivityCategory,
    recurrence: initialData?.recurrence ?? 'once' as Activity['recurrence'],
    dayOfWeek: initialData?.dayOfWeek ?? [] as number[],
    dayOfMonth: initialData?.dayOfMonth ?? 1,
    date: initialData?.date ?? toISODate(new Date()),
    timeStart: initialData?.timeStart ?? '',
    timeEnd: initialData?.timeEnd ?? '',
    priority: initialData?.priority ?? 'medium' as Activity['priority'],
    isActive: initialData?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Judul wajib diisi'
    if (form.recurrence === 'once' && !form.date) e.date = 'Tanggal wajib diisi'
    if (form.recurrence === 'weekly' && form.dayOfWeek.length === 0) e.dayOfWeek = 'Pilih minimal satu hari'
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
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      recurrence: form.recurrence,
      dayOfWeek: form.recurrence === 'weekly' ? form.dayOfWeek : undefined,
      dayOfMonth: form.recurrence === 'monthly' ? form.dayOfMonth : undefined,
      date: form.recurrence === 'once' ? form.date : undefined,
      timeStart: form.timeStart || undefined,
      timeEnd: form.timeEnd || undefined,
      priority: form.priority,
      isActive: form.isActive,
    })
  }

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      dayOfWeek: f.dayOfWeek.includes(day)
        ? f.dayOfWeek.filter((d) => d !== day)
        : [...f.dayOfWeek, day],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Judul Aktivitas"
        placeholder="Apa kegiatannya?"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        error={errors.title}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Kategori"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as ActivityCategory })}
        >
          <option value="work">Pekerjaan</option>
          <option value="personal">Pribadi</option>
          <option value="health">Kesehatan</option>
          <option value="learning">Belajar</option>
          <option value="social">Sosial</option>
          <option value="other">Lainnya</option>
        </Select>

        <Select
          label="Prioritas"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as Activity['priority'] })}
        >
          <option value="low">Rendah</option>
          <option value="medium">Sedang</option>
          <option value="high">Tinggi</option>
        </Select>
      </div>

      <Select
        label="Pengulangan"
        value={form.recurrence}
        onChange={(e) => setForm({ ...form, recurrence: e.target.value as Activity['recurrence'] })}
      >
        <option value="once">Sekali</option>
        <option value="daily">Setiap Hari</option>
        <option value="weekly">Mingguan</option>
        <option value="monthly">Bulanan</option>
      </Select>

      {form.recurrence === 'once' && (
        <Input
          label="Tanggal"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          error={errors.date}
        />
      )}

      {form.recurrence === 'weekly' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Hari</label>
          <div className="flex gap-1.5 flex-wrap">
            {DAYS.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  form.dayOfWeek.includes(i)
                    ? 'bg-accent text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-border',
                ].join(' ')}
              >
                {day}
              </button>
            ))}
          </div>
          {errors.dayOfWeek && <p className="text-xs text-danger">{errors.dayOfWeek}</p>}
        </div>
      )}

      {form.recurrence === 'monthly' && (
        <Input
          label="Tanggal dalam Bulan"
          type="number"
          min={1}
          max={31}
          value={form.dayOfMonth}
          onChange={(e) => setForm({ ...form, dayOfMonth: parseInt(e.target.value) || 1 })}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Jam Mulai"
          type="time"
          value={form.timeStart}
          onChange={(e) => setForm({ ...form, timeStart: e.target.value })}
        />
        <Input
          label="Jam Selesai"
          type="time"
          value={form.timeEnd}
          onChange={(e) => setForm({ ...form, timeEnd: e.target.value })}
        />
      </div>

      <Textarea
        label="Deskripsi (opsional)"
        placeholder="Informasi tambahan..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
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
