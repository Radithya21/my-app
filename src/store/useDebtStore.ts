import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DebtItem } from '../types'
import { generateId } from '../utils/generateId'

interface DebtStore {
  items: DebtItem[]
  addItem: (item: Omit<DebtItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateItem: (id: string, updates: Partial<Omit<DebtItem, 'id' | 'createdAt'>>) => void
  deleteItem: (id: string) => void
  markPaid: (id: string, paidDate: string) => void
  markUnpaid: (id: string) => void
}

export const useDebtStore = create<DebtStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              ...item,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateItem: (id, updates) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        })),
      deleteItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      markPaid: (id, paidDate) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? { ...i, isPaid: true, paidDate, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
      markUnpaid: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? { ...i, isPaid: false, paidDate: undefined, updatedAt: new Date().toISOString() }
              : i
          ),
        })),
    }),
    { name: 'personal-os-debt' }
  )
)
