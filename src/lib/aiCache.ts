import { db } from '../db/database'

export async function cacheGet<T>(key: string): Promise<T | null> {
  const entry = await db.aiCache.where('cacheKey').equals(key).first()
  if (!entry) return null
  if (new Date(entry.expiresAt) <= new Date()) {
    await db.aiCache.where('cacheKey').equals(key).delete()
    return null
  }
  try {
    return JSON.parse(entry.value) as T
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const existing = await db.aiCache.where('cacheKey').equals(key).first()
  const expiresAt = new Date(Date.now() + ttlMs).toISOString()
  const value = JSON.stringify(data)
  if (existing) {
    await db.aiCache.update(existing.id, { value, expiresAt })
  } else {
    await db.aiCache.add({
      id: crypto.randomUUID(),
      cacheKey: key,
      value,
      createdAt: new Date().toISOString(),
      expiresAt,
    })
  }
}

export async function cacheHas(key: string): Promise<boolean> {
  return (await cacheGet(key)) !== null
}

export async function cacheInvalidate(key: string): Promise<void> {
  await db.aiCache.where('cacheKey').equals(key).delete()
}

export async function getCachedOrFetch(
  cacheKey: string,
  ttlHours: number,
  fetcher: () => Promise<string>
): Promise<string> {
  const cached = await db.aiCache.where('cacheKey').equals(cacheKey).first()
  if (cached && new Date(cached.expiresAt) > new Date()) {
    return cached.value
  }
  const value = await fetcher()
  const expiresAt = new Date(Date.now() + ttlHours * 3_600_000).toISOString()
  await db.aiCache.put({
    id: crypto.randomUUID(),
    cacheKey,
    value,
    createdAt: new Date().toISOString(),
    expiresAt,
  })
  return value
}

export async function purgeExpiredCache(): Promise<void> {
  const now = new Date().toISOString()
  await db.aiCache.where('expiresAt').below(now).delete()
}
