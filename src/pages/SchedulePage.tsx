import { useState } from 'react'
import { Plus, LayoutGrid, List, ChevronDown, Kanban, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { KesibukanCard } from '../components/schedule/KesibukanCard'
import { KesibukanForm } from '../components/schedule/KesibukanForm'
import { KanbanView } from '../components/schedule/KanbanView'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { useKesibukanStore, calcKesibukanProgress } from '../store/useKesibukanStore'
import type { Kesibukan, KesibukanStatus } from '../types'

type FilterStatus = 'semua' | KesibukanStatus
type SortMode = 'deadline' | 'progress' | 'terbaru'
type ViewMode = 'card' | 'list' | 'kanban'

const filterLabels: Record<FilterStatus, string> = {
  semua: 'Semua',
  aktif: 'Aktif',
  ditunda: 'Ditunda',
  selesai: 'Arsip',
}

export default function SchedulePage() {
  const {
    items,
    add, update, remove, setStatus,
    addSub, updateSub, deleteSub,
    addStep, updateStep, deleteStep, toggleStep,
  } = useKesibukanStore()

  const [view, setView] = useState<ViewMode>('card')
  const [filter, setFilter] = useState<FilterStatus>('aktif')
  const [sort, setSort] = useState<SortMode>('deadline')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Kesibukan | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleAdd = (data: Omit<Kesibukan, 'id' | 'subKesibukan' | 'createdAt' | 'updatedAt'>) => {
    add(data)
    toast.success('Kesibukan ditambahkan')
    setShowForm(false)
  }

  const handleEdit = (data: Omit<Kesibukan, 'id' | 'subKesibukan' | 'createdAt' | 'updatedAt'>) => {
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

  const handleSetStatus = (id: string, status: KesibukanStatus) => {
    setStatus(id, status)
    const labels: Record<KesibukanStatus, string> = {
      aktif: 'diaktifkan',
      ditunda: 'ditunda',
      selesai: 'diselesaikan',
    }
    toast.success(`Kesibukan ${labels[status]}`)
  }

  const isKanban = view === 'kanban'

  const filtered = items.filter((k) => {
    if (filter === 'semua') return true
    return k.status === filter
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'terbaru') return b.createdAt.localeCompare(a.createdAt)
    if (sort === 'progress') return calcKesibukanProgress(a) - calcKesibukanProgress(b)
    if (sort === 'deadline') {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.localeCompare(b.deadline)
    }
    return 0
  })

  const activeCount = items.filter((k) => k.status === 'aktif').length
  const archivedCount = items.filter((k) => k.status === 'selesai').length

  const viewToggle = (
    <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg">
      {(
        [
          { id: 'card', icon: <LayoutGrid size={14} />, label: 'Card view' },
          { id: 'list', icon: <List size={14} />, label: 'List view' },
          { id: 'kanban', icon: <Kanban size={14} />, label: 'Kanban view' },
        ] as { id: ViewMode; icon: React.ReactNode; label: string }[]
      ).map(({ id, icon, label }) => (
        <button
          key={id}
          onClick={() => setView(id)}
          aria-label={label}
          className={[
            'p-1.5 rounded-md transition-colors',
            view === id
              ? 'bg-bg-card shadow-sm text-text-primary'
              : 'text-text-muted hover:text-text-secondary',
          ].join(' ')}
        >
          {icon}
        </button>
      ))}
    </div>
  )

  return (
    <div className={['space-y-4', isKanban ? '' : 'max-w-4xl mx-auto'].join(' ')}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Mapping Kesibukan</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {activeCount} aktif{archivedCount > 0 ? ` · ${archivedCount} arsip` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewToggle}

          {!isKanban && (
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="text-xs bg-bg-secondary border border-border rounded-lg pl-2 pr-6 py-1.5 text-text-secondary outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer"
              >
                <option value="deadline">Deadline Terdekat</option>
                <option value="progress">Progress Terendah</option>
                <option value="terbaru">Terbaru Ditambahkan</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          )}

          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            Tambah
          </Button>
        </div>
      </div>

      {/* Filter tabs — hidden in kanban mode */}
      {!isKanban && (
        <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl w-fit">
          {(Object.keys(filterLabels) as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                filter === f
                  ? 'bg-bg-card shadow-sm text-text-primary'
                  : 'text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {filterLabels[f]}
              {f === 'aktif' && activeCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-accent text-white text-[10px] rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isKanban ? (
        <KanbanView items={items} onSetStatus={handleSetStatus} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Layers size={40} />}
          title={filter === 'selesai' ? 'Belum ada arsip' : 'Belum ada kesibukan'}
          message={
            filter === 'selesai'
              ? 'Kesibukan yang diselesaikan akan muncul di sini.'
              : 'Tambah kesibukan pertama kamu — dari skripsi, magang, hingga proyek apapun.'
          }
          ctaLabel={filter !== 'selesai' ? 'Tambah Kesibukan' : undefined}
          onCta={filter !== 'selesai' ? () => setShowForm(true) : undefined}
        />
      ) : view === 'card' ? (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {sorted.map((k) => (
              <motion.div
                key={k.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <KesibukanCard
                  kesibukan={k}
                  onEdit={setEditItem}
                  onDelete={(id) => setDeleteId(id)}
                  onSetStatus={handleSetStatus}
                  onAddSub={addSub}
                  onUpdateSub={updateSub}
                  onDeleteSub={deleteSub}
                  onToggleStep={toggleStep}
                  onDeleteStep={deleteStep}
                  onAddStep={addStep}
                  onUpdateStep={updateStep}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sorted.map((k) => (
              <motion.div
                key={k.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <KesibukanCard
                  kesibukan={k}
                  onEdit={setEditItem}
                  onDelete={(id) => setDeleteId(id)}
                  onSetStatus={handleSetStatus}
                  onAddSub={addSub}
                  onUpdateSub={updateSub}
                  onDeleteSub={deleteSub}
                  onToggleStep={toggleStep}
                  onDeleteStep={deleteStep}
                  onAddStep={addStep}
                  onUpdateStep={updateStep}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Tambah Kesibukan Baru">
        <KesibukanForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Kesibukan">
        {editItem && (
          <KesibukanForm
            initialData={editItem}
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
        message="Yakin ingin menghapus kesibukan ini? Semua sub-kesibukan dan langkah di dalamnya juga akan dihapus."
      />
    </div>
  )
}
