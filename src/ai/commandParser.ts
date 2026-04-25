import type { CommandResult } from '../types'
import { toISODate } from '../utils/formatDate'

function parseCurrencyText(text: string): number | null {
  const clean = text.replace(/[.,\s]/g, '').toLowerCase()
  const match = clean.match(/^(\d+(?:[.,]\d+)?)(jt|juta|rb|ribu|k)?$/)
  if (!match) return null
  const num = parseFloat(match[1].replace(',', '.'))
  const suffix = match[2]
  if (suffix === 'jt' || suffix === 'juta') return num * 1_000_000
  if (suffix === 'rb' || suffix === 'ribu') return num * 1_000
  if (suffix === 'k') return num * 1_000
  return num
}

function parseRelativeDate(text: string): string | null {
  const today = new Date()
  const lower = text.toLowerCase()
  if (lower === 'hari ini' || lower === 'sekarang') return toISODate(today)
  if (lower === 'besok') {
    const d = new Date(today); d.setDate(d.getDate() + 1); return toISODate(d)
  }
  if (lower === 'lusa') {
    const d = new Date(today); d.setDate(d.getDate() + 2); return toISODate(d)
  }
  if (lower === 'minggu depan') {
    const d = new Date(today); d.setDate(d.getDate() + 7); return toISODate(d)
  }
  if (lower === 'bulan depan') {
    const d = new Date(today); d.setMonth(d.getMonth() + 1); return toISODate(d)
  }
  return null
}

export function parseCommandLocally(input: string): CommandResult | null {
  const text = input.trim()
  const lower = text.toLowerCase()

  // create_todo: "tambah todo/tugas <title>"
  const todoMatch = lower.match(/^(?:tambah|buat|bikin|add)\s+(?:todo|tugas|task)\s+(.+)$/i)
  if (todoMatch) {
    const rest = text.slice(text.toLowerCase().indexOf(todoMatch[1]))
    const priorityMatch = rest.match(/\b(urgent|mendesak|tinggi|high|rendah|low)\b/i)
    const dateMatch = rest.match(/\b(besok|lusa|hari ini|minggu depan|bulan depan)\b/i)
    const priority = priorityMatch
      ? ({ urgent: 'urgent', mendesak: 'urgent', tinggi: 'high', high: 'high', rendah: 'low', low: 'low' } as Record<string, CommandResult['parsedData'] & object extends never ? never : NonNullable<CommandResult['parsedData']>['priority']>)[priorityMatch[1].toLowerCase()] ?? 'medium'
      : 'medium'
    const dueDate = dateMatch ? parseRelativeDate(dateMatch[1]) ?? undefined : undefined
    const title = rest.replace(/\b(urgent|mendesak|tinggi|high|rendah|low)\b/gi, '').replace(/\b(besok|lusa|hari ini|minggu depan|bulan depan)\b/gi, '').trim()
    return {
      intent: 'create_todo',
      parsedData: { title, priority: priority as NonNullable<CommandResult['parsedData']>['priority'], dueDate },
      confidence: 'high',
    }
  }

  // create_goal: "tambah/buat goal/tujuan <title>"
  const goalMatch = lower.match(/^(?:tambah|buat|bikin|add)\s+(?:goal|tujuan|target)\s+(.+)$/i)
  if (goalMatch) {
    const title = text.slice(text.toLowerCase().indexOf(goalMatch[1])).trim()
    return { intent: 'create_goal', parsedData: { title }, confidence: 'high' }
  }

  // create_debt (owe): "hutang ke <nama> <amount>"
  const debtOweMatch = lower.match(/^(?:hutang|pinjam ke|catat hutang)\s+(?:ke\s+)?([a-zA-Z]+)\s+([\d.,]+(?:rb|ribu|jt|juta|k)?)/i)
  if (debtOweMatch) {
    const amount = parseCurrencyText(debtOweMatch[2])
    if (amount) {
      return {
        intent: 'create_debt',
        parsedData: { personName: debtOweMatch[1], amount, type: 'owe', description: `Hutang ke ${debtOweMatch[1]}` },
        confidence: 'high',
      }
    }
  }

  // create_debt (lend): "piutang/pinjamkan ke <nama> <amount>"
  const debtLendMatch = lower.match(/^(?:piutang|pinjamkan|kasih pinjam|lend)\s+(?:ke\s+)?([a-zA-Z]+)\s+([\d.,]+(?:rb|ribu|jt|juta|k)?)/i)
  if (debtLendMatch) {
    const amount = parseCurrencyText(debtLendMatch[2])
    if (amount) {
      return {
        intent: 'create_debt',
        parsedData: { personName: debtLendMatch[1], amount, type: 'lend', description: `Piutang ke ${debtLendMatch[1]}` },
        confidence: 'high',
      }
    }
  }

  // create_activity: "jadwal/tambah jadwal <title> besok/jam X"
  const activityMatch = lower.match(/^(?:jadwal|tambah jadwal|schedule|tambah kesibukan)\s+(.+)$/i)
  if (activityMatch) {
    const rest = text.slice(text.toLowerCase().indexOf(activityMatch[1])).trim()
    const dateMatch = rest.match(/\b(besok|lusa|hari ini|minggu depan)\b/i)
    const timeMatch = rest.match(/jam\s+(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?/i)
    const dueDate = dateMatch ? parseRelativeDate(dateMatch[1]) ?? undefined : undefined
    let timeStart: string | undefined
    if (timeMatch) {
      let hour = parseInt(timeMatch[1])
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const period = timeMatch[3]?.toLowerCase()
      if ((period === 'sore' || period === 'malam') && hour < 12) hour += 12
      timeStart = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }
    const title = rest
      .replace(/\b(besok|lusa|hari ini|minggu depan)\b/gi, '')
      .replace(/jam\s+\d{1,2}(?::\d{2})?\s*(?:pagi|siang|sore|malam)?/gi, '')
      .trim()
    return {
      intent: 'create_activity',
      parsedData: { title, dueDate, ...(timeStart ? { description: `Jam mulai: ${timeStart}` } : {}) },
      confidence: 'high',
    }
  }

  return null
}
