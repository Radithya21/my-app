import { useState } from 'react'
import toast from 'react-hot-toast'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import type { TodoItem, TodoPriority } from '../../types'

type TodoFormData = Omit<TodoItem, 'id' | 'isCompleted' | 'completedAt' | 'createdAt' | 'updatedAt'>

interface TodoFormProps {
  initialData?: Partial<TodoItem>
  onSubmit: (data: TodoFormData) => void
  onCancel: () => void
}

export function TodoForm({ initialData, onSubmit, onCancel }: TodoFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    priority: initialData?.priority ?? 'medium' as TodoPriority,
    category: initialData?.category ?? '',
    dueDate: initialData?.dueDate ?? '',
    dueTime: initialData?.dueTime ?? '',
    isPinned: initialData?.isPinned ?? false,
    goalId: initialData?.goalId ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
      priority: form.priority,
      category: form.category.trim() || undefined,
      dueDate: form.dueDate || undefined,
      dueTime: form.dueTime || undefined,
      isPinned: form.isPinned,
      goalId: form.goalId || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Judul Tugas"
        placeholder="Apa yang perlu dilakukan?"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        error={errors.title}
        autoFocus
      />

      <Textarea
        label="Deskripsi (opsional)"
        placeholder="Detail tambahan..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Prioritas"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as TodoPriority })}
        >
          <option value="urgent">Mendesak</option>
          <option value="high">Tinggi</option>
          <option value="medium">Sedang</option>
          <option value="low">Rendah</option>
        </Select>

        <Input
          label="Kategori (tag)"
          placeholder="kantor, rumah..."
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Deadline"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
        <Input
          label="Jam"
          type="time"
          value={form.dueTime}
          onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPinned}
          onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
          className="w-4 h-4 rounded accent-accent"
        />
        <span className="text-sm text-text-primary">Pin tugas ini di atas</span>
      </label>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          {initialData ? 'Simpan Perubahan' : 'Tambah Tugas'}
        </Button>
      </div>
    </form>
  )
}
