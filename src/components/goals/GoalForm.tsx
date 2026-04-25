import { useState } from 'react'
import toast from 'react-hot-toast'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import { AIAssistButton } from '../ui/AIAssistButton'
import type { Goal, GoalCategory } from '../../types'

type GoalFormData = Omit<Goal, 'id' | 'steps' | 'createdAt' | 'updatedAt' | 'status'>

interface GoalFormProps {
  initialData?: Partial<Goal>
  onSubmit: (data: GoalFormData) => void
  onCancel: () => void
}

export function GoalForm({ initialData, onSubmit, onCancel }: GoalFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    category: initialData?.category ?? 'personal' as GoalCategory,
    targetDate: initialData?.targetDate ?? '',
    priority: initialData?.priority ?? 'medium' as Goal['priority'],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAIResult = (fields: Record<string, unknown>) => {
    setForm((f) => ({
      ...f,
      title: (fields.title as string) || f.title,
      description: f.description || (fields.description as string) || '',
    }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Judul wajib diisi'
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
      targetDate: form.targetDate || undefined,
      priority: form.priority,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Judul Tujuan"
            placeholder="Apa yang ingin kamu capai?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            error={errors.title}
          />
        </div>
        <div className="mb-0.5">
          <AIAssistButton formType="goal" titleValue={form.title} onResult={handleAIResult} />
        </div>
      </div>

      <Textarea
        label="Deskripsi (opsional)"
        placeholder="Jelaskan lebih detail..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Kategori"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as GoalCategory })}
        >
          <option value="career">Karier</option>
          <option value="finance">Keuangan</option>
          <option value="health">Kesehatan</option>
          <option value="education">Pendidikan</option>
          <option value="personal">Pribadi</option>
          <option value="other">Lainnya</option>
        </Select>

        <Select
          label="Prioritas"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as Goal['priority'] })}
        >
          <option value="low">Rendah</option>
          <option value="medium">Sedang</option>
          <option value="high">Tinggi</option>
        </Select>
      </div>

      <Input
        label="Target Tanggal (opsional)"
        type="date"
        value={form.targetDate}
        onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
      />

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          {initialData ? 'Simpan Perubahan' : 'Buat Tujuan'}
        </Button>
      </div>
    </form>
  )
}
