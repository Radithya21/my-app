import { format, formatDistanceToNow, differenceInDays, isToday, isTomorrow, isThisWeek, startOfDay } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatDate(iso: string): string {
  return format(new Date(iso), 'EEEE, dd MMM yyyy', { locale: id })
}

export function formatDateShort(iso: string): string {
  return format(new Date(iso), 'dd MMM yyyy', { locale: id })
}

export function formatDateMini(iso: string): string {
  return format(new Date(iso), 'dd MMM', { locale: id })
}

export function formatTime(time: string): string {
  return time
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: id })
}

export function daysUntil(iso: string): number {
  return differenceInDays(startOfDay(new Date(iso)), startOfDay(new Date()))
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
