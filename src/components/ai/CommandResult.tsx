import { Command } from 'cmdk'
import { CheckCircle, HelpCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import type { CommandResult as CommandResultType } from '../../types'
import { formatCurrency } from '../../utils/formatCurrency'

interface CommandResultProps {
  result: CommandResultType
  onExecute: (result: CommandResultType) => void
  onDismiss: () => void
}

const intentLabels: Record<string, string> = {
  create_todo: 'Tambah Tugas',
  create_goal: 'Tambah Tujuan',
  create_debt: 'Catat Hutang',
  create_activity: 'Tambah Jadwal',
  query: 'Jawaban',
  unknown: 'Tidak dikenali',
}

const priorityLabels: Record<string, string> = {
  urgent: 'Mendesak',
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
}

export function CommandResult({ result, onExecute, onDismiss }: CommandResultProps) {
  if (result.intent === 'unknown') {
    return (
      <Command.Item className="flex items-center gap-2 px-3 py-3 text-sm text-text-muted" disabled>
        <HelpCircle size={14} />
        Perintah tidak dikenali. Coba tuliskan lebih spesifik.
      </Command.Item>
    )
  }

  if (result.intent === 'query' && result.answer) {
    return (
      <div className="px-3 py-3 space-y-2">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Jawaban</p>
        <p className="text-sm text-text-primary">{result.answer}</p>
      </div>
    )
  }

  const { parsedData } = result
  if (!parsedData) return null

  return (
    <div className="px-3 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle size={13} className="text-accent" />
        <span className="text-xs font-medium text-accent">{intentLabels[result.intent]}</span>
        {result.confidence === 'high' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Terdeteksi</span>
        )}
      </div>

      <div className="bg-bg-secondary rounded-lg p-3 space-y-1.5 text-xs">
        {parsedData.title && (
          <div className="flex gap-2">
            <span className="text-text-muted w-20 shrink-0">Judul</span>
            <span className="text-text-primary font-medium">{parsedData.title}</span>
          </div>
        )}
        {parsedData.priority && (
          <div className="flex gap-2">
            <span className="text-text-muted w-20 shrink-0">Prioritas</span>
            <span className="text-text-primary">{priorityLabels[parsedData.priority] ?? parsedData.priority}</span>
          </div>
        )}
        {parsedData.dueDate && (
          <div className="flex gap-2">
            <span className="text-text-muted w-20 shrink-0">Deadline</span>
            <span className="text-text-primary">{parsedData.dueDate}</span>
          </div>
        )}
        {parsedData.personName && (
          <div className="flex gap-2">
            <span className="text-text-muted w-20 shrink-0">Nama</span>
            <span className="text-text-primary">{parsedData.personName}</span>
          </div>
        )}
        {parsedData.amount !== undefined && (
          <div className="flex gap-2">
            <span className="text-text-muted w-20 shrink-0">Jumlah</span>
            <span className="text-text-primary">{formatCurrency(parsedData.amount)}</span>
          </div>
        )}
        {parsedData.type && (
          <div className="flex gap-2">
            <span className="text-text-muted w-20 shrink-0">Tipe</span>
            <span className="text-text-primary">{parsedData.type === 'owe' ? 'Hutang saya' : 'Piutang'}</span>
          </div>
        )}
        {parsedData.description && (
          <div className="flex gap-2">
            <span className="text-text-muted w-20 shrink-0">Keterangan</span>
            <span className="text-text-primary">{parsedData.description}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onExecute(result)}>
          Tambahkan
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Abaikan
        </Button>
      </div>
    </div>
  )
}
