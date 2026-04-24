import { Edit2, Trash2, Pause, Play } from 'lucide-react'
import type { Activity, ActivityCategory } from '../../types'

const categoryColors: Record<ActivityCategory, string> = {
  work: '#2563EB',
  personal: '#D97706',
  health: '#16A34A',
  learning: '#7C3AED',
  social: '#DB2777',
  other: '#71717A',
}

const categoryLabels: Record<ActivityCategory, string> = {
  work: 'Kerja',
  personal: 'Pribadi',
  health: 'Kesehatan',
  learning: 'Belajar',
  social: 'Sosial',
  other: 'Lainnya',
}

interface ActivityCardProps {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string) => void
  compact?: boolean
}

export function ActivityCard({ activity, onEdit, onDelete, onToggleActive, compact }: ActivityCardProps) {
  const color = categoryColors[activity.category]

  if (compact) {
    return (
      <div
        className="px-2 py-1.5 rounded-lg text-xs"
        style={{ backgroundColor: color + '20', borderLeft: `2px solid ${color}` }}
      >
        <p className="font-medium truncate" style={{ color }}>
          {activity.title}
        </p>
        {activity.timeStart && (
          <p className="text-text-muted">{activity.timeStart}{activity.timeEnd ? `–${activity.timeEnd}` : ''}</p>
        )}
      </div>
    )
  }

  return (
    <div className={['bg-bg-card border border-border rounded-xl p-4', !activity.isActive ? 'opacity-50' : ''].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: color + '20', color }}
            >
              {categoryLabels[activity.category]}
            </span>
            <span className={[
              'text-xs px-1.5 py-0.5 rounded',
              activity.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
              activity.priority === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
              'bg-bg-secondary text-text-muted',
            ].join(' ')}>
              {activity.priority === 'high' ? 'Tinggi' : activity.priority === 'medium' ? 'Sedang' : 'Rendah'}
            </span>
          </div>
          <p className="font-semibold text-text-primary mt-1.5">{activity.title}</p>
          {activity.description && (
            <p className="text-sm text-text-secondary mt-0.5">{activity.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
            {activity.timeStart && (
              <span>{activity.timeStart}{activity.timeEnd ? ` – ${activity.timeEnd}` : ''}</span>
            )}
            <span>
              {activity.recurrence === 'once' ? 'Sekali' :
               activity.recurrence === 'daily' ? 'Setiap hari' :
               activity.recurrence === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleActive(activity.id)}
            aria-label={activity.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
          >
            {activity.isActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => onEdit(activity)}
            aria-label="Edit"
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(activity.id)}
            aria-label="Hapus"
            className="p-1.5 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
