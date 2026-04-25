import { create } from 'zustand'
import type { Activity } from '../types'
import { generateId } from '../utils/generateId'
import { db } from '../db/database'

interface ScheduleStore {
  activities: Activity[]
  _hydrate: () => Promise<void>
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>
  updateActivity: (id: string, updates: Partial<Omit<Activity, 'id' | 'createdAt'>>) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  toggleActive: (id: string) => Promise<void>
}

export const useScheduleStore = create<ScheduleStore>()((set, get) => ({
  activities: [],
  _hydrate: async () => {
    const activities = await db.activities.toArray()
    set({ activities })
  },
  addActivity: async (activity) => {
    const newActivity: Activity = {
      ...activity,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    await db.activities.put(newActivity)
    set((s) => ({ activities: [...s.activities, newActivity] }))
  },
  updateActivity: async (id, updates) => {
    const existing = get().activities.find((a) => a.id === id)
    if (!existing) return
    const updated = { ...existing, ...updates }
    await db.activities.put(updated)
    set((s) => ({ activities: s.activities.map((a) => (a.id === id ? updated : a)) }))
  },
  deleteActivity: async (id) => {
    await db.activities.delete(id)
    set((s) => ({ activities: s.activities.filter((a) => a.id !== id) }))
  },
  toggleActive: async (id) => {
    const existing = get().activities.find((a) => a.id === id)
    if (!existing) return
    const updated = { ...existing, isActive: !existing.isActive }
    await db.activities.put(updated)
    set((s) => ({ activities: s.activities.map((a) => (a.id === id ? updated : a)) }))
  },
}))
