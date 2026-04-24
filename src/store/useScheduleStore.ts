import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Activity } from '../types'
import { generateId } from '../utils/generateId'

interface ScheduleStore {
  activities: Activity[]
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void
  updateActivity: (id: string, updates: Partial<Omit<Activity, 'id' | 'createdAt'>>) => void
  deleteActivity: (id: string) => void
  toggleActive: (id: string) => void
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      activities: [],
      addActivity: (activity) =>
        set((s) => ({
          activities: [
            ...s.activities,
            {
              ...activity,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateActivity: (id, updates) =>
        set((s) => ({
          activities: s.activities.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      deleteActivity: (id) =>
        set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),
      toggleActive: (id) =>
        set((s) => ({
          activities: s.activities.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive } : a
          ),
        })),
    }),
    { name: 'personal-os-schedule' }
  )
)
