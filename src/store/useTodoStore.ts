import { create } from 'zustand'
import type { TodoItem } from '../types'
import { generateId } from '../utils/generateId'
import { toISODate } from '../utils/formatDate'
import { db } from '../db/database'

interface TodoStore {
  items: TodoItem[]
  _hydrate: () => Promise<void>
  addItem: (item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt' | 'isPinned'> & Partial<Pick<TodoItem, 'isCompleted' | 'completedAt' | 'isPinned'>>) => Promise<void>
  updateItem: (id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  clearCompleted: () => Promise<void>
  markTodayAsDone: () => Promise<void>
}

export const useTodoStore = create<TodoStore>()((set, get) => ({
  items: [],
  _hydrate: async () => {
    const items = await db.todos.toArray()
    set({ items })
  },
  addItem: async (item) => {
    const newItem: TodoItem = {
      isCompleted: false,
      isPinned: false,
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.todos.put(newItem)
    set((s) => ({ items: [...s.items, newItem] }))
  },
  updateItem: async (id, updates) => {
    const existing = get().items.find((i) => i.id === id)
    if (!existing) return
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    await db.todos.put(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },
  deleteItem: async (id) => {
    await db.todos.delete(id)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
  },
  toggleComplete: async (id) => {
    const existing = get().items.find((i) => i.id === id)
    if (!existing) return
    const updated = {
      ...existing,
      isCompleted: !existing.isCompleted,
      completedAt: !existing.isCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    }
    await db.todos.put(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },
  togglePin: async (id) => {
    const existing = get().items.find((i) => i.id === id)
    if (!existing) return
    const updated = { ...existing, isPinned: !existing.isPinned, updatedAt: new Date().toISOString() }
    await db.todos.put(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },
  clearCompleted: async () => {
    const completed = get().items.filter((i) => i.isCompleted)
    await db.todos.bulkDelete(completed.map((i) => i.id))
    set((s) => ({ items: s.items.filter((i) => !i.isCompleted) }))
  },
  markTodayAsDone: async () => {
    const today = toISODate(new Date())
    const toUpdate = get().items
      .filter((i) => !i.isCompleted && i.dueDate === today)
      .map((i) => ({
        ...i,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    if (toUpdate.length === 0) return
    await db.todos.bulkPut(toUpdate)
    set((s) => ({
      items: s.items.map((i) => {
        const updated = toUpdate.find((u) => u.id === i.id)
        return updated ?? i
      }),
    }))
  },
}))
