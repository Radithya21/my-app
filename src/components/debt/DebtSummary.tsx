import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { id } from 'date-fns/locale'
import { useDebtStore } from '../../store/useDebtStore'
import { useUIStore } from '../../store/useUIStore'
import { formatCurrency } from '../../utils/formatCurrency'

export function DebtSummary() {
  const items = useDebtStore((s) => s.items)
  const theme = useUIStore((s) => s.theme)

  const unpaidDebts = items.filter((i) => i.type === 'owe' && !i.isPaid)
  const unpaidLends = items.filter((i) => i.type === 'lend' && !i.isPaid)
  const totalDebt = unpaidDebts.reduce((s, i) => s + i.amount, 0)
  const totalLend = unpaidLends.reduce((s, i) => s + i.amount, 0)
  const net = totalLend - totalDebt

  const chartData = useMemo(() => {
    const now = new Date()
    return [-2, -1, 0].map((offset) => {
      const month = subMonths(now, -offset)
      const start = startOfMonth(month)
      const end = endOfMonth(month)
      const monthItems = items.filter((i) =>
        isWithinInterval(new Date(i.date), { start, end })
      )
      return {
        name: format(month, 'MMM', { locale: id }),
        Hutang: monthItems.filter((i) => i.type === 'owe').reduce((s, i) => s + i.amount, 0),
        Piutang: monthItems.filter((i) => i.type === 'lend').reduce((s, i) => s + i.amount, 0),
      }
    })
  }, [items, theme])

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const textColor = isDark ? '#A1A1AA' : '#71717A'

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-bg-secondary rounded-lg">
          <p className="text-xs text-text-muted">Total Hutang</p>
          <p className="text-base font-bold font-mono text-danger mt-0.5">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="text-center p-3 bg-bg-secondary rounded-lg">
          <p className="text-xs text-text-muted">Total Piutang</p>
          <p className="text-base font-bold font-mono text-success mt-0.5">{formatCurrency(totalLend)}</p>
        </div>
        <div className="text-center p-3 bg-bg-secondary rounded-lg">
          <p className="text-xs text-text-muted">Net Balance</p>
          <p className={['text-base font-bold font-mono mt-0.5', net >= 0 ? 'text-success' : 'text-danger'].join(' ')}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </p>
        </div>
      </div>

      {chartData.some((d) => d.Hutang > 0 || d.Piutang > 0) && (
        <div>
          <p className="text-xs text-text-muted mb-2">3 Bulan Terakhir</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barSize={12}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: isDark ? '#1C1C1F' : '#fff',
                  border: `1px solid ${isDark ? '#27272A' : '#E4E4E7'}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: isDark ? '#FAFAFA' : '#09090B',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Hutang" fill="#EF4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Piutang" fill="#22C55E" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
