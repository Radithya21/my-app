import { format, formatDistanceToNow, differenceInDays, isToday, isTomorrow, isThisWeek, startOfDay } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return format(d, 'EEEE, dd MMM yyyy', { locale: id })
}

export function formatDateShort(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return format(d, 'dd MMM yyyy', { locale: id })
}

export function formatDateMini(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return format(d, 'dd MMM', { locale: id })
}

export function formatTime(time: string): string {
  return time
}

export function formatRelative(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: id })
}

export function daysUntil(iso: string): number {
  if (!iso) return Infinity
  const d = new Date(iso)
  if (isNaN(d.getTime())) return Infinity
  return differenceInDays(startOfDay(d), startOfDay(new Date()))
}

export function isDateToday(iso: string): boolean {
  return isToday(new Date(iso))
}

export function isDateTomorrow(iso: string): boolean {
  return isTomorrow(new Date(iso))
}

export function isDateThisWeek(iso: string): boolean {
  return isThisWeek(new Date(iso), { weekStartsOn: 1 })
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
