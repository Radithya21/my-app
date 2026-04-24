import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toISODate } from '../../utils/formatDate'

interface QuickAddProps {
  onAdd: (title: string, dueDate: string) => void
  onOpenFull: () => void
}

export function QuickAdd({ onAdd, onOpenFull }: QuickAddProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed, toISODate(new Date()))
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        className="flex-1 px-4 py-2.5 text-sm bg-bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-text-muted text-text-primary transition-shadow"
        placeholder="Tambah tugas cepat... (Enter untuk simpan)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button
        type="button"
        onClick={onOpenFull}
        aria-label="Form lengkap"
        className="flex items-center justify-center w-10 h-10 bg-accent hover:bg-accent-hover text-white rounded-xl transition-colors"
      >
        <Plus size={16} />
      </button>
    </form>
  )
}
