import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TodoItem } from '../types'
import { generateId } from '../utils/generateId'
import { toISODate } from '../utils/formatDate'

interface TodoStore {
  items: TodoItem[]
  addItem: (item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt' | 'isPinned'> & Partial<Pick<TodoItem, 'isCompleted' | 'completedAt' | 'isPinned'>>) => void
  updateItem: (id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>) => void
  deleteItem: (id: string) => void
  toggleComplete: (id: string) => void
  togglePin: (id: string) => void
  clearCompleted: () => void
  markTodayAsDone: () => void
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              isCompleted: false,
              isPinned: false,
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
      toggleComplete: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  isCompleted: !i.isCompleted,
                  completedAt: !i.isCompleted ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
        })),
      togglePin: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, isPinned: !i.isPinned, updatedAt: new Date().toISOString() } : i
          ),
        })),
      clearCompleted: () =>
        set((s) => ({ items: s.items.filter((i) => !i.isCompleted) })),
      markTodayAsDone: () => {
        const today = toISODate(new Date())
        set((s) => ({
          items: s.items.map((i) =>
            !i.isCompleted && i.dueDate === today
              ? { ...i, isCompleted: true, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : i
          ),
        }))
      },
    }),
    { name: 'personal-os-todos' }
  )
)
