import { useState } from 'react'
import { addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, getDay } from 'date-fns'
import { id } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ActivityCard } from './ActivityCard'
import type { Activity } from '../../types'
import { toISODate } from '../../utils/formatDate'

interface WeeklyViewProps {
  activities: Activity[]
  onEdit: (activity: Activity) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string) => void
}

function getActivitiesForDay(activities: Activity[], date: Date): Activity[] {
  const isoDate = toISODate(date)
  const dayOfWeek = getDay(date)
  const dayOfMonth = date.getDate()

  return activities.filter((a) => {
    if (!a.isActive) return false
    if (a.recurrence === 'once') return a.date === isoDate
    if (a.recurrence === 'daily') return true
    if (a.recurrence === 'weekly') return a.dayOfWeek?.includes(dayOfWeek) ?? false
    if (a.recurrence === 'monthly') return a.dayOfMonth === dayOfMonth
    return false
  })
}

export function WeeklyView({ activities, onEdit, onDelete, onToggleActive }: WeeklyViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDay, setSelectedDay] = useState(() => toISODate(new Date()))

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const selectedDayActivities = getActivitiesForDay(
    activities,
    new Date(selectedDay + 'T00:00:00')
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart((w) => subWeeks(w, 1))}
          className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary transition-colors"
          aria-label="Minggu sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-text-primary">
          {format(weekStart, 'd MMM', { locale: id })} – {format(weekEnd, 'd MMM yyyy', { locale: id })}
        </span>
        <button
          onClick={() => setWeekStart((w) => addWeeks(w, 1))}
          className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary transition-colors"
          aria-label="Minggu berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Mobile: horizontal day selector */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin md:hidden">
        {days.map((day) => {
          const iso = toISODate(day)
          const dayActivities = getActivitiesForDay(activities, day)
          const today = isToday(day)
          const selected = selectedDay === iso
          return (
            <button
              key={iso}
              onClick={() => setSelectedDay(iso)}
              className={[
                'flex-1 min-w-[3rem] flex flex-col items-center py-2 px-1 rounded-xl transition-colors',
                selected ? 'bg-accent text-white' : today ? 'bg-blue-50 dark:bg-blue-900/20 text-accent' : 'hover:bg-bg-secondary text-text-secondary',
              ].join(' ')}
            >
              <span className="text-xs">{format(day, 'EEE', { locale: id })}</span>
              <span className="text-sm font-bold">{format(day, 'd')}</span>
              {dayActivities.length > 0 && (
                <span className={['w-1 h-1 rounded-full mt-0.5', selected ? 'bg-white' : 'bg-accent'].join(' ')} />
              )}
            </button>
          )
        })}
      </div>

      {/* Mobile: activities for selected day */}
      <div className="md:hidden space-y-2">
        {selectedDayActivities.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">Tidak ada aktivitas</p>
        ) : (
          selectedDayActivities.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))
        )}
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {days.map((day) => {
          const iso = toISODate(day)
          const dayActivities = getActivitiesForDay(activities, day)
          const today = isToday(day)
          return (
            <div
              key={iso}
              className={[
                'rounded-xl border p-2 min-h-[120px]',
                today ? 'border-accent bg-blue-50/50 dark:bg-blue-900/10' : 'border-border bg-bg-card',
              ].join(' ')}
            >
              <div className="text-center mb-2">
                <p className="text-xs text-text-muted">{format(day, 'EEE', { locale: id })}</p>
                <p className={['text-sm font-bold', today ? 'text-accent' : 'text-text-primary'].join(' ')}>
                  {format(day, 'd')}
                </p>
              </div>
              <div className="space-y-1">
                {dayActivities.map((a) => (
                  <ActivityCard
                    key={a.id}
                    activity={a}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleActive={onToggleActive}
                    compact
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
