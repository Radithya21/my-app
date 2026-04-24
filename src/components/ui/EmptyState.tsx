import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
  ctaLabel?: string
  onCta?: () => void
}

export function EmptyState({ icon, title, message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 text-text-muted opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text-secondary mb-1">{title}</h3>
      {message && <p className="text-sm text-text-muted max-w-xs mb-4">{message}</p>}
      {ctaLabel && onCta && (
        <Button onClick={onCta} size="sm">
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
