import { create } from 'zustand'
import type { DebtItem } from '../types'
import { generateId } from '../utils/generateId'
import { db } from '../db/database'

interface DebtStore {
  items: DebtItem[]
  _hydrate: () => Promise<void>
  addItem: (item: Omit<DebtItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateItem: (id: string, updates: Partial<Omit<DebtItem, 'id' | 'createdAt'>>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  markPaid: (id: string, paidDate: string) => Promise<void>
  markUnpaid: (id: string) => Promise<void>
}

export const useDebtStore = create<DebtStore>()((set, get) => ({
  items: [],
  _hydrate: async () => {
    const items = await db.debts.toArray()
    set({ items })
  },
  addItem: async (item) => {
    const newItem: DebtItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.debts.put(newItem)
    set((s) => ({ items: [...s.items, newItem] }))
  },
  updateItem: async (id, updates) => {
    const existing = get().items.find((i) => i.id === id)
    if (!existing) return
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    await db.debts.put(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },
  deleteItem: async (id) => {
    await db.debts.delete(id)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
  },
  markPaid: async (id, paidDate) => {
    const existing = get().items.find((i) => i.id === id)
    if (!existing) return
    const updated = { ...existing, isPaid: true, paidDate, updatedAt: new Date().toISOString() }
    await db.debts.put(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },
  markUnpaid: async (id) => {
    const existing = get().items.find((i) => i.id === id)
    if (!existing) return
    const updated = { ...existing, isPaid: false, paidDate: undefined, updatedAt: new Date().toISOString() }
    await db.debts.put(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },
}))
