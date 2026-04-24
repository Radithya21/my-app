export function formatCurrency(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function parseCurrency(value: string): number {
  return parseInt(value.replace(/\./g, '').replace(/[^0-9]/g, ''), 10) || 0
}

export function formatCurrencyInput(value: string): string {
  const num = parseCurrency(value)
  if (!num) return ''
  return num.toLocaleString('id-ID')
}
