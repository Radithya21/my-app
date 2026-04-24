import type { DebtItem, Activity, Goal, TodoItem } from '../types'

interface BackupData {
  version: number
  exportedAt: string
  debt: DebtItem[]
  schedule: Activity[]
  goals: Goal[]
  todos: TodoItem[]
}

export function exportAllData(data: Omit<BackupData, 'version' | 'exportedAt'>): void {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `personalos-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importAllData(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData
        if (!data.version || !data.debt || !data.todos) {
          reject(new Error('Format file tidak valid'))
          return
        }
        resolve(data)
      } catch {
        reject(new Error('File tidak dapat dibaca'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsText(file)
  })
}
