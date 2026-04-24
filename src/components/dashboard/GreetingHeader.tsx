import { useLocalDate } from '../../hooks/useLocalDate'
import { formatDate } from '../../utils/formatDate'

function getGreeting(hour: number): string {
  if (hour < 10) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function GreetingHeader() {
  const now = useLocalDate()
  const greeting = getGreeting(now.getHours())
  const dateStr = formatDate(now.toISOString())

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">{greeting} 👋</h1>
      <p className="text-sm text-text-muted mt-1">{dateStr}</p>
    </div>
  )
}
