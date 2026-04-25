interface AILabelProps {
  className?: string
}

export function AILabel({ className = '' }: AILabelProps) {
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ${className}`}>
      ✦ AI
    </span>
  )
}
