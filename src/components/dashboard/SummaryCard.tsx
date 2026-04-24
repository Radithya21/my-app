interface SummaryCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: 'default' | 'danger' | 'success' | 'warning' | 'accent'
  subtitle?: string
}

const colorClasses = {
  default: 'text-text-primary',
  danger: 'text-danger',
  success: 'text-success',
  warning: 'text-warning',
  accent: 'text-accent',
}

const iconBgClasses = {
  default: 'bg-bg-secondary',
  danger: 'bg-red-100 dark:bg-red-900/20',
  success: 'bg-green-100 dark:bg-green-900/20',
  warning: 'bg-amber-100 dark:bg-amber-900/20',
  accent: 'bg-blue-100 dark:bg-blue-900/20',
}

export function SummaryCard({ label, value, icon, color = 'default', subtitle }: SummaryCardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
      <div className={['p-2 rounded-lg', iconBgClasses[color]].join(' ')}>
        <span className={colorClasses[color]}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted font-medium truncate">{label}</p>
        <p className={['text-xl font-bold font-mono mt-0.5', colorClasses[color]].join(' ')}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  )
}
