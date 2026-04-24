import { useRef, useState } from 'react'
import { Sun, Moon, Monitor, Download, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useUIStore } from '../store/useUIStore'
import { useDebtStore } from '../store/useDebtStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useGoalStore } from '../store/useGoalStore'
import { useTodoStore } from '../store/useTodoStore'
import { exportAllData, importAllData } from '../utils/exportImport'
import type { Theme } from '../types'

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Terang', icon: <Sun size={16} /> },
  { value: 'dark', label: 'Gelap', icon: <Moon size={16} /> },
  { value: 'system', label: 'Sistem', icon: <Monitor size={16} /> },
]

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore()
  const debtItems = useDebtStore((s) => s.items)
  const activities = useScheduleStore((s) => s.activities)
  const goals = useGoalStore((s) => s.goals)
  const todos = useTodoStore((s) => s.items)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    exportAllData({ debt: debtItems, schedule: activities, goals, todos })
    toast.success('Data berhasil diekspor')
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await importAllData(file)
      useDebtStore.setState({ items: data.debt ?? [] })
      useScheduleStore.setState({ activities: data.schedule ?? [] })
      useGoalStore.setState({ goals: data.goals ?? [] })
      useTodoStore.setState({ items: data.todos ?? [] })
      toast.success('Data berhasil diimpor')
    } catch (err) {
      toast.error((err as Error).message)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleReset = () => {
    useDebtStore.setState({ items: [] })
    useScheduleStore.setState({ activities: [] })
    useGoalStore.setState({ goals: [] })
    useTodoStore.setState({ items: [] })
    toast.success('Semua data berhasil direset')
    setShowResetConfirm(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Pengaturan</h1>

      <section className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Tampilan</h2>
        <div className="flex gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={[
                'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-all text-sm',
                theme === opt.value
                  ? 'border-accent bg-blue-50 dark:bg-blue-900/10 text-accent'
                  : 'border-border text-text-secondary hover:bg-bg-secondary',
              ].join(' ')}
            >
              {opt.icon}
              <span className="text-xs">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Data</h2>
        <p className="text-xs text-text-muted">
          Data tersimpan di browser kamu via localStorage. Export untuk backup, import untuk restore.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={12} />
            Export JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={12} />
            Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        <div className="pt-2 border-t border-border">
          <Button variant="danger" size="sm" onClick={() => setShowResetConfirm(true)}>
            <Trash2 size={12} />
            Reset Semua Data
          </Button>
        </div>
      </section>

      <section className="bg-bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-2">Tentang</h2>
        <div className="space-y-1 text-xs text-text-muted">
          <p>PersonalOS v1.0.0</p>
          <p>Aplikasi manajemen diri — 100% lokal, tanpa backend.</p>
          <p>Data: {debtItems.length} hutang · {todos.length} tugas · {goals.length} tujuan · {activities.length} aktivitas</p>
        </div>
      </section>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset Semua Data"
        message="Semua data (hutang, tugas, tujuan, aktivitas) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, hapus semua"
      />
    </div>
  )
}
