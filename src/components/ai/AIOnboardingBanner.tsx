import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Sparkles } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'

const DISMISSED_KEY = 'personal-os-ai-onboard-dismissed'

export function AIOnboardingBanner() {
  const hasApiKey = !!useUIStore((s) => s.geminiApiKey)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  )

  if (hasApiKey || dismissed) return null

  return (
    <div className="bg-blue-50 dark:bg-blue-900/10 border border-accent/30 rounded-xl p-4 flex items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-accent" />
          <p className="text-sm font-medium text-text-primary">Aktifkan Fitur AI</p>
        </div>
        <p className="text-xs text-text-muted">
          Set API key Google Gemini di Pengaturan untuk menggunakan Command Bar (⌘K), Daily Digest, dan Smart Goal Coach.
        </p>
        <Link
          to="/settings"
          className="inline-block text-xs text-accent hover:underline mt-1"
        >
          Buka Pengaturan →
        </Link>
      </div>
      <button
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, '1')
          setDismissed(true)
        }}
        className="text-text-muted hover:text-text-primary transition-colors shrink-0"
        aria-label="Tutup banner"
      >
        <X size={14} />
      </button>
    </div>
  )
}
