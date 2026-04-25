import { db } from './database'

const MIGRATION_SENTINEL = 'personal-os-migrated-v1.4'

type MigrateEntry = { lsKey: string; stateKey: string; table: 'debts' | 'activities' | 'goals' | 'todos' }

const STORE_MAP: MigrateEntry[] = [
  { lsKey: 'personal-os-debt',     table: 'debts',      stateKey: 'items'      },
  { lsKey: 'personal-os-schedule', table: 'activities', stateKey: 'activities' },
  { lsKey: 'personal-os-goals',    table: 'goals',      stateKey: 'goals'      },
  { lsKey: 'personal-os-todos',    table: 'todos',      stateKey: 'items'      },
]

async function migrateTable(table: MigrateEntry['table'], items: unknown[]): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db[table] as any).bulkPut(items)
}

export async function runMigrationIfNeeded(): Promise<void> {
  if (localStorage.getItem(MIGRATION_SENTINEL) === 'done') return

  console.info('[PersonalOS] Migrasi data ke IndexedDB...')

  for (const { lsKey, table, stateKey } of STORE_MAP) {
    try {
      const raw = localStorage.getItem(lsKey)
      if (!raw) continue

      const parsed = JSON.parse(raw)
      const items: unknown[] = parsed?.state?.[stateKey] ?? parsed?.state?.items ?? []

      if (Array.isArray(items) && items.length > 0) {
        await migrateTable(table, items)
        console.info(`[PersonalOS] Migrasi ${items.length} item dari ${lsKey}`)
      }
    } catch (err) {
      console.error(`[PersonalOS] Gagal migrasi ${lsKey}:`, err)
    }
  }

  try {
    const rawCache = localStorage.getItem('personal-os-ai-cache')
    if (rawCache) {
      const cacheMap: Record<string, { data: unknown; expiresAt: number }> = JSON.parse(rawCache)
      const entries = Object.entries(cacheMap).map(([key, e]) => ({
        id: crypto.randomUUID(),
        cacheKey: key,
        value: JSON.stringify(e.data),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(e.expiresAt).toISOString(),
      }))
      if (entries.length > 0) await db.aiCache.bulkPut(entries)
    }
  } catch { /* skip cache migration errors */ }

  localStorage.setItem(MIGRATION_SENTINEL, 'done')
  STORE_MAP.forEach(({ lsKey }) => localStorage.removeItem(lsKey))
  localStorage.removeItem('personal-os-ai-cache')
  localStorage.removeItem('personal-os-cmd-history')

  console.info('[PersonalOS] Migrasi selesai.')
}
