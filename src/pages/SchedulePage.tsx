import { useState } from 'react'
import { Plus, Trash2, Edit2, Tag, BookOpen, Trophy, Briefcase, Code, Layers, Heart, Music } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { useKesibukanStore } from '../store/useKesibukanStore'
import { useTodoStore } from '../store/useTodoStore'
import { useNavigate } from 'react-router-dom'
import type { Kesibukan, KesibukanStatus } from '../types'

const COLOR_PRESETS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#14b8a6', label: 'Teal' },
]

const ICON_OPTIONS = [
  { value: 'book', label: 'Kuliah', icon: BookOpen },
  { value: 'trophy', label: 'Lomba', icon: Trophy },
  { value: 'briefcase', label: 'Magang/Kerja', icon: Briefcase },
  { value: 'code', label: 'Proyek', icon: Code },
  { value: 'heart', label: 'Personal', icon: Heart },
  { value: 'music', label: 'Hobi', icon: Music },
  { value: 'tag', label: 'Lainnya', icon: Tag },
]

function getIconComponent(iconName?: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName)
  return found ? found.icon : Tag
}

interface KesibukanFormData {
  name: string
  description: string
  colorLabel: string
  icon: string
  status: KesibukanStatus
}

function KesibukanFormModal({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Kesibukan>
  onSubmit: (data: KesibukanFormData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<KesibukanFormData>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    colorLabel: initial?.colorLabel ?? '#6366f1',
    icon: initial?.icon ?? 'tag',
    status: initial?.status ?? 'aktif',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nama kesibukan wajib diisi'); return }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-text-primary mb-1">Nama Kesibukan</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="misal: Kuliah, Lomba, Magang..."
          className="w-full h-9 px-3 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-primary mb-1">Deskripsi (opsional)</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Keterangan singkat..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-primary mb-2">Ikon</label>
        <div className="grid grid-cols-4 gap-2">
          {ICON_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, icon: opt.value })}
                className={[
                  'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all',
                  form.icon === opt.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-muted hover:border-accent/50',
                ].join(' ')}
              >
                <Icon size={16} />
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-primary mb-2">Warna Label</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm({ ...form, colorLabel: c.value })}
              style={{ backgroundColor: c.value }}
              className={[
                'w-7 h-7 rounded-full transition-all',
                form.colorLabel === c.value ? 'ring-2 ring-offset-2 ring-offset-bg-primary ring-current scale-110' : 'hover:scale-110',
              ].join(' ')}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Batal</Button>
        <Button type="submit">{initial?.id ? 'Simpan Perubahan' : 'Tambah Kesibukan'}</Button>
      </div>
    </form>
  )
}

function KesibukanCard({
  k,
  todoCount,
  onEdit,
  onDelete,
  onNavigate,
}: {
  k: Kesibukan
  todoCount: number
  onEdit: (k: Kesibukan) => void
  onDelete: (id: string) => void
  onNavigate: (id: string) => void
}) {
  const IconComp = getIconComponent(k.icon)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onNavigate(k.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: k.colorLabel + '20', color: k.colorLabel }}
          >
            <IconComp size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-sm leading-tight">{k.name}</h3>
            {k.description && (
              <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{k.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(k)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(k.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium"
          style={{ backgroundColor: k.colorLabel + '15', color: k.colorLabel }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: k.colorLabel }} />
          {k.status === 'aktif' ? 'Aktif' : k.status === 'ditunda' ? 'Ditunda' : 'Selesai'}
        </div>
        <span className="text-xs text-text-muted">
          {todoCount > 0 ? `${todoCount} to-do` : 'Belum ada to-do'}
        </span>
      </div>
    </motion.div>
  )
}

export default function SchedulePage() {
  const { items, add, update, remove } = useKesibukanStore()
  const todos = useTodoStore((s) => s.items)
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Kesibukan | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleAdd = (data: KesibukanFormData) => {
    add(data)
    toast.success('Kesibukan ditambahkan')
    setShowForm(false)
  }

  const handleEdit = (data: KesibukanFormData) => {
    if (!editItem) return
    update(editItem.id, data)
    toast.success('Kesibukan diperbarui')
    setEditItem(null)
  }

  const handleDelete = (id: string) => {
    remove(id)
    toast.success('Kesibukan dihapus')
    setDeleteId(null)
  }

  const getTodoCount = (kId: string) =>
    todos.filter((t) => t.kesibukanId === kId && !t.isCompleted).length

  const activeItems = items.filter((k) => k.status !== 'selesai')
  const archivedItems = items.filter((k) => k.status === 'selesai')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Kesibukan</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {activeItems.length} aktif · Kategori utama untuk to-do kamu
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          Tambah Kesibukan
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl p-3">
        <Tag size={16} className="text-accent mt-0.5 flex-shrink-0" />
        <p className="text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Kesibukan</span> adalah kategori induk untuk to-do kamu.
          Tambahkan dulu (misal: Kuliah, Lomba), lalu di halaman{' '}
          <button
            className="text-accent font-medium hover:underline"
            onClick={() => navigate('/todo')}
          >
            To-Do →
          </button>{' '}
          pilih kesibukan mana yang terkait saat menambah tugas.
        </p>
      </div>

      {/* Active cards */}
      {activeItems.length === 0 && archivedItems.length === 0 ? (
        <EmptyState
          icon={<Layers size={40} />}
          title="Belum ada kesibukan"
          message="Tambah kesibukan seperti Kuliah, Lomba, atau Magang sebagai kategori to-do kamu."
          ctaLabel="Tambah Kesibukan"
          onCta={() => setShowForm(true)}
        />
      ) : (
        <>
          {activeItems.length > 0 && (
            <div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {activeItems.map((k) => (
                    <KesibukanCard
                      key={k.id}
                      k={k}
                      todoCount={getTodoCount(k.id)}
                      onEdit={setEditItem}
                      onDelete={(id) => setDeleteId(id)}
                      onNavigate={(id) => navigate(`/todo?kesibukan=${id}`)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {archivedItems.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                Arsip · {archivedItems.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {archivedItems.map((k) => (
                    <KesibukanCard
                      key={k.id}
                      k={k}
                      todoCount={getTodoCount(k.id)}
                      onEdit={setEditItem}
                      onDelete={(id) => setDeleteId(id)}
                      onNavigate={(id) => navigate(`/todo?kesibukan=${id}`)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Tambah Kesibukan Baru">
        <KesibukanFormModal onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Kesibukan">
        {editItem && (
          <KesibukanFormModal
            initial={editItem}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Hapus Kesibukan"
        message="Yakin ingin menghapus kesibukan ini? To-do yang terhubung tidak akan ikut terhapus."
      />
    </div>
  )
}
