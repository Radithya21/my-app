import { create } from 'zustand'
import type { Kesibukan, SubKesibukan, KesibukanStep, KesibukanStatus } from '../types'
import { generateId } from '../utils/generateId'
import { db } from '../db/database'

export function calcSubProgress(sub: SubKesibukan): number {
  if (sub.steps.length === 0) return 0
  const done = sub.steps.filter((s) => s.isCompleted).length
  return Math.round((done / sub.steps.length) * 100)
}

export function calcKesibukanProgress(k: Kesibukan): number {
  if (k.subKesibukan.length === 0) return 0
  const total = k.subKesibukan.reduce((sum, sub) => sum + calcSubProgress(sub), 0)
  return Math.round(total / k.subKesibukan.length)
}

export function calcSubStatus(sub: SubKesibukan): 'belum_mulai' | 'berjalan' | 'selesai' {
  const p = calcSubProgress(sub)
  if (p === 0) return 'belum_mulai'
  if (p === 100) return 'selesai'
  return 'berjalan'
}

interface KesibukanStore {
  items: Kesibukan[]
  _hydrate: () => Promise<void>
  add: (k: Omit<Kesibukan, 'id' | 'subKesibukan' | 'createdAt' | 'updatedAt'>) => Promise<void>
  update: (id: string, updates: Partial<Omit<Kesibukan, 'id' | 'subKesibukan' | 'createdAt'>>) => Promise<void>
  remove: (id: string) => Promise<void>
  setStatus: (id: string, status: KesibukanStatus) => Promise<void>
  addSub: (kId: string, sub: { name: string; deadline?: string }) => Promise<void>
  updateSub: (kId: string, subId: string, updates: { name?: string; deadline?: string }) => Promise<void>
  deleteSub: (kId: string, subId: string) => Promise<void>
  addStep: (kId: string, subId: string, step: { name: string; deadline?: string; notes?: string }) => Promise<void>
  updateStep: (kId: string, subId: string, stepId: string, updates: Partial<Omit<KesibukanStep, 'id' | 'order'>>) => Promise<void>
  deleteStep: (kId: string, subId: string, stepId: string) => Promise<void>
  toggleStep: (kId: string, subId: string, stepId: string) => Promise<void>
  setSubComplete: (kId: string, subId: string, complete: boolean) => Promise<void>
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
      subKesibukan: [],
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

  addSub: async (kId, sub) => {
    const k = get().items.find((k) => k.id === kId)
    if (!k) return
    const newSub: SubKesibukan = {
      id: generateId(),
      name: sub.name,
      deadline: sub.deadline,
      steps: [],
      order: k.subKesibukan.length,
    }
    const updated = { ...k, subKesibukan: [...k.subKesibukan, newSub], updatedAt: new Date().toISOString() }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === kId ? updated : k)) }))
  },

  updateSub: async (kId, subId, updates) => {
    const k = get().items.find((k) => k.id === kId)
    if (!k) return
    const updated = {
      ...k,
      subKesibukan: k.subKesibukan.map((s) => (s.id === subId ? { ...s, ...updates } : s)),
      updatedAt: new Date().toISOString(),
    }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === kId ? updated : k)) }))
  },

  deleteSub: async (kId, subId) => {
    const k = get().items.find((k) => k.id === kId)
    if (!k) return
    const updated = {
      ...k,
      subKesibukan: k.subKesibukan
        .filter((s) => s.id !== subId)
        .map((s, i) => ({ ...s, order: i })),
      updatedAt: new Date().toISOString(),
    }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === kId ? updated : k)) }))
  },

  addStep: async (kId, subId, step) => {
    const k = get().items.find((k) => k.id === kId)
    if (!k) return
    const sub = k.subKesibukan.find((s) => s.id === subId)
    if (!sub) return
    const newStep: KesibukanStep = {
      id: generateId(),
      name: step.name,
      deadline: step.deadline,
      isCompleted: false,
      notes: step.notes,
      order: sub.steps.length,
    }
    const updated = {
      ...k,
      subKesibukan: k.subKesibukan.map((s) =>
        s.id === subId ? { ...s, steps: [...s.steps, newStep] } : s
      ),
      updatedAt: new Date().toISOString(),
    }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === kId ? updated : k)) }))
  },

  updateStep: async (kId, subId, stepId, updates) => {
    const k = get().items.find((k) => k.id === kId)
    if (!k) return
    const updated = {
      ...k,
      subKesibukan: k.subKesibukan.map((s) =>
        s.id === subId
          ? { ...s, steps: s.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)) }
          : s
      ),
      updatedAt: new Date().toISOString(),
    }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === kId ? updated : k)) }))
  },

  deleteStep: async (kId, subId, stepId) => {
    const k = get().items.find((k) => k.id === kId)
    if (!k) return
    const updated = {
      ...k,
      subKesibukan: k.subKesibukan.map((s) =>
        s.id === subId
          ? {
              ...s,
              steps: s.steps
                .filter((step) => step.id !== stepId)
                .map((step, i) => ({ ...step, order: i })),
            }
          : s
      ),
      updatedAt: new Date().toISOString(),
    }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === kId ? updated : k)) }))
  },

  toggleStep: async (kId, subId, stepId) => {
    const k = get().items.find((k) => k.id === kId)
    if (!k) return
    const updated = {
      ...k,
      subKesibukan: k.subKesibukan.map((s) =>
        s.id === subId
          ? {
              ...s,
              steps: s.steps.map((step) =>
                step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
              ),
            }
          : s
      ),
      updatedAt: new Date().toISOString(),
    }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === kId ? updated : k)) }))
  },

  setSubComplete: async (kId, subId, complete) => {
    const k = get().items.find((k) => k.id === kId)
    if (!k) return
    const updated = {
      ...k,
      subKesibukan: k.subKesibukan.map((s) =>
        s.id === subId
          ? { ...s, steps: s.steps.map((step) => ({ ...step, isCompleted: complete })) }
          : s
      ),
      updatedAt: new Date().toISOString(),
    }
    await save(updated)
    set((s) => ({ items: s.items.map((k) => (k.id === kId ? updated : k)) }))
  },
}))
