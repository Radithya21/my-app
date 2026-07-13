import { create } from 'zustand'
import type { Kesibukan, KesibukanStatus } from '../types'
import { generateId } from '../utils/generateId'
import { db } from '../db/database'

interface KesibukanStore {
  items: Kesibukan[]
  _hydrate: () => Promise<void>
  add: (k: Omit<Kesibukan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  update: (id: string, updates: Partial<Omit<Kesibukan, 'id' | 'createdAt'>>) => Promise<void>
  remove: (id: string) => Promise<void>
  setStatus: (id: string, status: KesibukanStatus) => Promise<void>
}

const save = async (k: Kesibukan) => db.kesibukan.put(k)

export const useKesibukanStore = create<KesibukanStore>()((set, get) => ({
  items: [],

  _hydrate: async () => {
    const items = await db.kesibukan.toArray()
    set({ items })
  },

  add: async (k) => {
    const newItem: Kesibukan = {
      ...k,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await save(newItem)
    set((s) => ({ items: [...s.items, newItem] }))
  },

  update: async (id, updates) => {
    const existing = get().items.find((k) => k.id === id)
    if (!existing) return
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === id ? updated : k)) }))
  },

  remove: async (id) => {
    await db.kesibukan.delete(id)
    set((s) => ({ items: s.items.filter((k) => k.id !== id) }))
  },

  setStatus: async (id, status) => {
    const existing = get().items.find((k) => k.id === id)
    if (!existing) return
    const updated = { ...existing, status, updatedAt: new Date().toISOString() }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === id ? updated : k)) }))
  },
}))
