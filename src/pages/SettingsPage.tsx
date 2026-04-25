import { useRef, useState } from 'react'
import { Sun, Moon, Monitor, Download, Upload, Trash2, Eye, EyeOff, Sparkles, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Select } from '../components/ui/Input'
import { useUIStore } from '../store/useUIStore'
import { useDebtStore } from '../store/useDebtStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useGoalStore } from '../store/useGoalStore'
import { useTodoStore } from '../store/useTodoStore'
import { exportAllData, importAllData } from '../utils/exportImport'
import { resetClient } from '../ai/geminiClient'
import { db } from '../db/database'
import type { Theme, AIModel } from '../types'

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Terang', icon: <Sun size={16} /> },
  { value: 'dark', label: 'Gelap', icon: <Moon size={16} /> },
  { value: 'system', label: 'Sistem', icon: <Monitor size={16} /> },
]

export default function SettingsPage() {
  const {
    theme, setTheme,
    geminiModel, geminiCoachModel,
    setGeminiApiKey, setGeminiModel, setGeminiCoachModel,
    aiWritingAssistEnabled, setAIWritingAssistEnabled,
  } = useUIStore()
  const hasApiKey = !!useUIStore((s) => s.geminiApiKey)
  const debtItems = useDebtStore((s) => s.items)
  const activities = useScheduleStore((s) => s.activities)
  const goals = useGoalStore((s) => s.goals)
  const todos = useTodoStore((s) => s.items)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

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

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      toast.error('API key tidak boleh kosong')
      return
    }
    setGeminiApiKey(apiKeyInput.trim())
    resetClient()
    setApiKeyInput('')
    toast.success('API key tersimpan')
  }

  const handleClearApiKey = () => {
    setGeminiApiKey('')
    resetClient()
    setApiKeyInput('')
    toast.success('API key dihapus')
  }

  const handleClearAICache = async () => {
    await db.aiCache.clear()
    toast.success('Cache AI dihapus')
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
          Data tersimpan di browser kamu via IndexedDB. Export untuk backup, import untuk restore.
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

      <section className="bg-bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <h2 className="text-sm font-semibold text-text-primary">Integrasi AI</h2>
          {hasApiKey && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">Aktif</span>
          )}
        </div>
        <p className="text-xs text-text-muted">
          Gunakan Google Gemini API untuk Command Bar, Daily Digest, dan Smart Goal Coach.
          API key disimpan di browser ini saja, lalu dipakai untuk request ke endpoint aplikasi kamu yang meneruskan ke Google.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-medium text-text-primary">
            {hasApiKey ? 'Ganti API Key' : 'Gemini API Key (Google AI Studio)'}
          </label>
          {hasApiKey && (
            <p className="text-xs text-text-muted">API key sudah tersimpan. Isi field di bawah untuk mengganti.</p>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={hasApiKey ? 'AIza•••••••• (kosongkan jika tidak ingin mengubah)' : 'AIza...'}
                className="w-full h-9 px-3 pr-9 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Button size="sm" onClick={handleSaveApiKey}>Simpan</Button>
          </div>
          {hasApiKey && (
            <button
              onClick={handleClearApiKey}
              className="text-xs text-danger hover:underline"
            >
              Hapus API key
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Model Command Bar & Digest"
            value={geminiModel}
            onChange={(e) => setGeminiModel(e.target.value as AIModel)}
            disabled={!hasApiKey}
          >
            <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (cepat)</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash (lebih cerdas)</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash (lebih kompatibel)</option>
          </Select>
          <Select
            label="Model Goal Coach"
            value={geminiCoachModel}
            onChange={(e) => setGeminiCoachModel(e.target.value as AIModel)}
            disabled={!hasApiKey}
          >
            <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (cepat)</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash (lebih cerdas)</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash (lebih kompatibel)</option>
          </Select>
        </div>

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-text-primary">AI Writing Assist</p>
            <p className="text-xs text-text-muted">Tombol ✦ di form untuk melengkapi field otomatis</p>
          </div>
          <button
            onClick={() => setAIWritingAssistEnabled(!aiWritingAssistEnabled)}
            className={[
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              aiWritingAssistEnabled ? 'bg-accent' : 'bg-border',
            ].join(' ')}
          >
            <span className={[
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
              aiWritingAssistEnabled ? 'translate-x-4' : 'translate-x-0.5',
            ].join(' ')} />
          </button>
        </div>

        <p className="text-xs text-text-muted">
          Belum punya API key?{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Dapatkan gratis di Google AI Studio →
          </a>
        </p>
      </section>

      <section className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Database size={15} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Storage</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Database</span>
            <span className="text-text-muted">IndexedDB (Dexie)</span>
          </div>
        </div>
        <div className="pt-2 border-t border-border">
          <Button variant="secondary" size="sm" onClick={handleClearAICache}>
            Hapus cache AI
          </Button>
        </div>
      </section>

      <section className="bg-bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-2">Tentang</h2>
        <div className="space-y-1 text-xs text-text-muted">
          <p>PersonalOS v1.4.0</p>
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
