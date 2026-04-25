import { create } from 'zustand'
import type { DebtItem } from '../types'
import { generateId } from '../utils/generateId'
import { db } from '../db/database'

type DebtInput = Omit<DebtItem, 'id' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'payments' | 'paidDate'> & {
  paidAmount?: number
  payments?: DebtItem['payments']
  paidDate?: string
}

interface DebtStore {
  items: DebtItem[]
  _hydrate: () => Promise<void>
  addItem: (item: DebtInput) => Promise<void>
  updateItem: (id: string, updates: Partial<Omit<DebtItem, 'id' | 'createdAt'>>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  markPaid: (id: string, paidDate: string) => Promise<void>
  addPayment: (id: string, amount: number, date: string, note?: string) => Promise<void>
  markUnpaid: (id: string) => Promise<void>
}

export const useDebtStore = create<DebtStore>()((set, get) => ({
  items: [],
  _hydrate: async () => {
    const items = (await db.debts.toArray()).map((i) => {
      const paidAmount = Math.max(0, Math.min(i.paidAmount ?? 0, i.amount))
      return {
        ...i,
        paidAmount,
        payments: i.payments ?? [],
        isPaid: paidAmount >= i.amount,
        paidDate: paidAmount >= i.amount ? i.paidDate : undefined,
      }
    })
    set({ items })
  },
  addItem: async (item) => {
    const paidAmount = Math.max(0, Math.min(item.paidAmount ?? 0, item.amount))
    const newItem: DebtItem = {
      ...item,
      paidAmount,
      payments: item.payments ?? [],
      paidDate: paidAmount >= item.amount ? (item.paidDate ?? item.date) : undefined,
      isPaid: paidAmount >= item.amount,
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

    const nextAmount = updates.amount ?? existing.amount
    const nextPaidAmount = Math.max(0, Math.min(updates.paidAmount ?? existing.paidAmount ?? 0, nextAmount))
    const isPaid = nextPaidAmount >= nextAmount

    const updated: DebtItem = {
      ...existing,
      ...updates,
      amount: nextAmount,
      paidAmount: nextPaidAmount,
      payments: updates.payments ?? existing.payments ?? [],
      isPaid,
      paidDate: isPaid ? (updates.paidDate ?? existing.paidDate ?? existing.date) : undefined,
      updatedAt: new Date().toISOString(),
    }

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

    const paidAmount = Math.max(0, Math.min(existing.paidAmount ?? 0, existing.amount))
    const remaining = Math.max(existing.amount - paidAmount, 0)
    const nextPayments = [...(existing.payments ?? [])]

    if (remaining > 0) {
      nextPayments.push({
        id: generateId(),
        amount: remaining,
        date: paidDate,
        note: 'Pelunasan penuh',
        createdAt: new Date().toISOString(),
      })
    }

    const updated: DebtItem = {
      ...existing,
      paidAmount: existing.amount,
      payments: nextPayments,
      isPaid: true,
      paidDate,
      updatedAt: new Date().toISOString(),
    }

    await db.debts.put(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },
  addPayment: async (id, amount, date, note) => {
    const existing = get().items.find((i) => i.id === id)
    if (!existing) return

    const currentPaid = Math.max(0, Math.min(existing.paidAmount ?? 0, existing.amount))
    const remaining = Math.max(existing.amount - currentPaid, 0)
    if (remaining <= 0) return

    const appliedAmount = Math.min(Math.max(0, amount), remaining)
    if (appliedAmount <= 0) return

    const newPaidAmount = Math.min(existing.amount, currentPaid + appliedAmount)
    const isPaid = newPaidAmount >= existing.amount

    const updated: DebtItem = {
      ...existing,
      paidAmount: newPaidAmount,
      payments: [
        ...(existing.payments ?? []),
        {
          id: generateId(),
          amount: appliedAmount,
          date,
          note: note?.trim() || undefined,
          createdAt: new Date().toISOString(),
        },
      ],
      isPaid,
      paidDate: isPaid ? date : undefined,
      updatedAt: new Date().toISOString(),
    }

    await db.debts.put(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },
  markUnpaid: async (id) => {
    const existing = get().items.find((i) => i.id === id)
    if (!existing) return

    const updated: DebtItem = {
      ...existing,
      isPaid: false,
      paidAmount: 0,
      paidDate: undefined,
      payments: [],
      updatedAt: new Date().toISOString(),
    }

    await db.debts.put(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },
}))
