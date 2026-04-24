import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { arrayMove } from '@dnd-kit/sortable'
import type { Goal, GoalStep, GoalStatus } from '../types'
import { generateId } from '../utils/generateId'

interface GoalStore {
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id' | 'steps' | 'createdAt' | 'updatedAt'>) => void
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'steps' | 'createdAt'>>) => void
  deleteGoal: (id: string) => void
  setGoalStatus: (id: string, status: GoalStatus) => void
  addStep: (goalId: string, step: Omit<GoalStep, 'id' | 'goalId' | 'order'>) => void
  updateStep: (goalId: string, stepId: string, updates: Partial<Omit<GoalStep, 'id' | 'goalId'>>) => void
  deleteStep: (goalId: string, stepId: string) => void
  toggleStep: (goalId: string, stepId: string) => void
  reorderSteps: (goalId: string, activeId: string, overId: string) => void
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set) => ({
      goals: [],
      addGoal: (goal) =>
        set((s) => ({
          goals: [
            ...s.goals,
            {
              ...goal,
              id: generateId(),
              steps: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateGoal: (id, updates) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
          ),
        })),
      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      setGoalStatus: (id, status) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, status, updatedAt: new Date().toISOString() } : g
          ),
        })),
      addStep: (goalId, step) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g
            const order = g.steps.length
            return {
              ...g,
              steps: [
                ...g.steps,
                { ...step, id: generateId(), goalId, order },
              ],
              updatedAt: new Date().toISOString(),
            }
          }),
        })),
      updateStep: (goalId, stepId, updates) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g
            return {
              ...g,
              steps: g.steps.map((step) =>
                step.id === stepId ? { ...step, ...updates } : step
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),
      deleteStep: (goalId, stepId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g
            const filtered = g.steps
              .filter((step) => step.id !== stepId)
              .map((step, i) => ({ ...step, order: i }))
            return { ...g, steps: filtered, updatedAt: new Date().toISOString() }
          }),
        })),
      toggleStep: (goalId, stepId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g
            return {
              ...g,
              steps: g.steps.map((step) =>
                step.id === stepId
                  ? {
                      ...step,
                      isCompleted: !step.isCompleted,
                      completedAt: !step.isCompleted ? new Date().toISOString() : undefined,
                    }
                  : step
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),
      reorderSteps: (goalId, activeId, overId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g
            const sorted = [...g.steps].sort((a, b) => a.order - b.order)
            const activeIdx = sorted.findIndex((step) => step.id === activeId)
            const overIdx = sorted.findIndex((step) => step.id === overId)
            if (activeIdx === -1 || overIdx === -1) return g
            const reordered = arrayMove(sorted, activeIdx, overIdx).map((step, i) => ({
              ...step,
              order: i,
            }))
            return { ...g, steps: reordered, updatedAt: new Date().toISOString() }
          }),
        })),
    }),
    { name: 'personal-os-goals' }
  )
)
