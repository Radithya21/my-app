import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { DebtCard } from '../components/debt/DebtCard'
import { DebtForm } from '../components/debt/DebtForm'
import { DebtSummary } from '../components/debt/DebtSummary'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useDebtStore } from '../store/useDebtStore'
import type { DebtItem } from '../types'
import { CreditCard } from 'lucide-react'

type TabType = 'owe' | 'lend'
type FilterType = 'all' | 'unpaid' | 'paid'
type SortType = 'newest' | 'oldest' | 'largest' | 'due'

export default function DebtPage() {
  const { items, addItem, addPayment, updateItem, deleteItem, markUnpaid } = useDebtStore()
  const [activeTab, setActiveTab] = useState<TabType>('owe')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('newest')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<DebtItem | null>(null)

  const getRemainingAmount = (item: DebtItem) => Math.max(item.amount - (item.paidAmount ?? 0), 0)

  const tabItems = items.filter((i) => i.type === activeTab)

  const filtered = tabItems
    .filter((i) => {
      const remaining = getRemainingAmount(i)
      if (filter === 'unpaid') return remaining > 0
      if (filter === 'paid') return remaining <= 0
      return true
    })
    .filter((i) => i.personName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === 'largest') return getRemainingAmount(b) - getRemainingAmount(a)
      if (sort === 'due') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    })

  const handleAdd = (data: Omit<DebtItem, 'id' | 'isPaid' | 'paidAmount' | 'payments' | 'paidDate' | 'createdAt' | 'updatedAt'>) => {
    addItem({ ...data, isPaid: false, paidAmount: 0, payments: [] })
    toast.success('Catatan ditambahkan')
    setShowForm(false)
  }

  const handleEdit = (data: Omit<DebtItem, 'id' | 'isPaid' | 'paidAmount' | 'payments' | 'paidDate' | 'createdAt' | 'updatedAt'>) => {
    if (!editItem) return
    updateItem(editItem.id, data)
    toast.success('Catatan diperbarui')
    setEditItem(null)
  }

  const handleDelete = (id: string) => {
    deleteItem(id)
    toast.success('Catatan dihapus')
  }

  const handleAddPayment = (id: string, amount: number, paymentDate: string, note?: string) => {
    const current = items.find((i) => i.id === id)
    if (!current) return

    const remaining = getRemainingAmount(current)
    const applied = Math.min(Math.max(0, amount), remaining)
    if (applied <= 0) return

    addPayment(id, amount, paymentDate, note)

    if (applied >= remaining) {
      toast.success('Pembayaran dicatat. Hutang sudah lunas.')
    } else {
      toast.success(`Pembayaran cicilan ${applied.toLocaleString('id-ID')} berhasil dicatat.`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Manajemen Hutang</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          Tambah
        </Button>
      </div>

      <DebtSummary />

      <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl">
        {(['owe', 'lend'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-bg-card text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary',
            ].join(' ')}
          >
            {tab === 'owe' ? '💸 Hutang Saya' : '💰 Piutang'}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-text-muted text-text-primary"
            placeholder="Cari nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-2 text-sm bg-bg-card border border-border rounded-lg text-text-secondary outline-none cursor-pointer"
          >
            <option value="all">Semua</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="paid">Lunas</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-3 py-2 text-sm bg-bg-card border border-border rounded-lg text-text-secondary outline-none cursor-pointer"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="largest">Terbesar</option>
            <option value="due">Jatuh Tempo</option>
          </select>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={40} />}
            title={activeTab === 'owe' ? 'Tidak ada hutang' : 'Tidak ada piutang'}
            message={activeTab === 'owe' ? 'Semoga keuangan selalu sehat! 💪' : 'Belum ada yang berhutang ke kamu.'}
            ctaLabel="Tambah Sekarang"
            onCta={() => setShowForm(true)}
          />
        ) : (
          filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <DebtCard
                item={item}
                onEdit={setEditItem}
                onDelete={handleDelete}
                onAddPayment={handleAddPayment}
                onMarkUnpaid={markUnpaid}
              />
            </motion.div>
          ))
        )}
      </AnimatePresence>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Tambah Catatan Hutang"
      >
        <DebtForm
          defaultType={activeTab}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Catatan Hutang"
      >
        {editItem && (
          <DebtForm
            initialData={editItem}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>
    </div>
  )
}
