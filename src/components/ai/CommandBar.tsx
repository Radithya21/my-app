import { useEffect } from 'react'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Calendar, CheckSquare, Target, Clock } from 'lucide-react'
import { useAIStore } from '../../store/useAIStore'
import { useCommandBar } from '../../hooks/useCommandBar'
import { CommandBarInput } from './CommandBarInput'
import { CommandResult } from './CommandResult'

const quickLinks = [
  { label: 'Tambah Tugas', to: '/todo', icon: <CheckSquare size={13} /> },
  { label: 'Tambah Hutang', to: '/debt', icon: <CreditCard size={13} /> },
  { label: 'Tambah Jadwal', to: '/schedule', icon: <Calendar size={13} /> },
  { label: 'Tambah Tujuan', to: '/goals', icon: <Target size={13} /> },
]

export function CommandBar() {
  const { isCommandBarOpen, closeCommandBar } = useAIStore()
  const { query, setQuery, isLoading, result, history, handleExecute, clearResult, reset } = useCommandBar()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isCommandBarOpen) reset()
  }, [isCommandBarOpen, reset])

  const handleOpenChange = (open: boolean) => {
    if (!open) closeCommandBar()
  }

  return (
    <Command.Dialog
      open={isCommandBarOpen}
      onOpenChange={handleOpenChange}
      label="Command Bar"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      overlayClassName=""
    >
      <Dialog.Title className="sr-only">Command Bar</Dialog.Title>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeCommandBar}
      />
      <div className="relative w-full max-w-lg bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <CommandBarInput isLoading={isLoading} />

        <Command.List className="max-h-80 overflow-y-auto">
          {result ? (
            <CommandResult
              result={result}
              onExecute={handleExecute}
              onDismiss={clearResult}
            />
          ) : (
            <>
              {!query && history.length > 0 && (
                <Command.Group heading={<span className="text-[10px] font-medium text-text-muted uppercase tracking-wide px-3 py-1.5 block">Riwayat</span>}>
                  {history.slice(0, 5).map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.query}
                      onSelect={() => setQuery(item.query)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary cursor-pointer transition-colors aria-selected:bg-bg-secondary aria-selected:text-text-primary"
                    >
                      <Clock size={12} className="shrink-0 text-text-muted" />
                      {item.query}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading={<span className="text-[10px] font-medium text-text-muted uppercase tracking-wide px-3 py-1.5 block">Navigasi Cepat</span>}>
                {quickLinks.map((link) => (
                  <Command.Item
                    key={link.to}
                    value={link.label}
                    onSelect={() => { closeCommandBar(); navigate(link.to) }}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary cursor-pointer transition-colors aria-selected:bg-bg-secondary aria-selected:text-text-primary"
                  >
                    <span className="text-text-muted">{link.icon}</span>
                    {link.label}
                  </Command.Item>
                ))}
              </Command.Group>

              {query && (
                <Command.Empty className="px-3 py-4 text-sm text-text-muted text-center">
                  Tidak ada hasil. AI sedang memproses...
                </Command.Empty>
              )}
            </>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  )
}
