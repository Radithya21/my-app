import { Command } from 'cmdk'
import { Search, Loader2 } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import { Link } from 'react-router-dom'

interface CommandBarInputProps {
  isLoading: boolean
}

export function CommandBarInput({ isLoading }: CommandBarInputProps) {
  const hasApiKey = !!useUIStore((s) => s.geminiApiKey)

  return (
    <div className="flex flex-col border-b border-border">
      <div className="flex items-center gap-2 px-3 py-2">
        {isLoading
          ? <Loader2 size={15} className="text-accent animate-spin shrink-0" />
          : <Search size={15} className="text-text-muted shrink-0" />
        }
        <Command.Input
          placeholder="Ketik perintah atau pertanyaan..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
        <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-text-muted border border-border rounded px-1 py-0.5">
          ESC
        </kbd>
      </div>
      {!hasApiKey && (
        <div className="px-3 pb-2">
          <p className="text-xs text-text-muted">
            ✦ Tambahkan{' '}
            <Link to="/settings" className="text-accent hover:underline">
              Gemini API key
            </Link>{' '}
            untuk perintah AI. Kamu tetap bisa navigasi manual di bawah.
          </p>
        </div>
      )}
    </div>
  )
}
