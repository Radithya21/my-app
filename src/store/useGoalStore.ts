import { create } from 'zustand'
import { arrayMove } from '@dnd-kit/sortable'
import type { Goal, GoalStep, GoalStatus } from '../types'
import { generateId } from '../utils/generateId'
import { db } from '../db/database'

interface GoalStore {
  goals: Goal[]
  _hydrate: () => Promise<void>
  addGoal: (goal: Omit<Goal, 'id' | 'steps' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'steps' | 'createdAt'>>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  setGoalStatus: (id: string, status: GoalStatus) => Promise<void>
  addStep: (goalId: string, step: Omit<GoalStep, 'id' | 'goalId' | 'order'>) => Promise<void>
  updateStep: (goalId: string, stepId: string, updates: Partial<Omit<GoalStep, 'id' | 'goalId'>>) => Promise<void>
  deleteStep: (goalId: string, stepId: string) => Promise<void>
  toggleStep: (goalId: string, stepId: string) => Promise<void>
  reorderSteps: (goalId: string, activeId: string, overId: string) => Promise<void>
}

export const useGoalStore = create<GoalStore>()((set, get) => ({
  goals: [],
  _hydrate: async () => {
    const goals = await db.goals.toArray()
    set({ goals })
  },
  addGoal: async (goal) => {
    const newGoal: Goal = {
      ...goal,
      id: generateId(),
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.goals.put(newGoal)
    set((s) => ({ goals: [...s.goals, newGoal] }))
  },
  updateGoal: async (id, updates) => {
    const existing = get().goals.find((g) => g.id === id)
    if (!existing) return
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    await db.goals.put(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? updated : g)) }))
  },
  deleteGoal: async (id) => {
    await db.goals.delete(id)
    await db.goalChats.where('goalId').equals(id).delete()
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
  },
  setGoalStatus: async (id, status) => {
    const existing = get().goals.find((g) => g.id === id)
    if (!existing) return
    const updated = { ...existing, status, updatedAt: new Date().toISOString() }
    await db.goals.put(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? updated : g)) }))
  },
  addStep: async (goalId, step) => {
    const goal = get().goals.find((g) => g.id === goalId)
    if (!goal) return
    const newStep: GoalStep = { ...step, id: generateId(), goalId, order: goal.steps.length }
    const updated = { ...goal, steps: [...goal.steps, newStep], updatedAt: new Date().toISOString() }
    await db.goals.put(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === goalId ? updated : g)) }))
  },
  updateStep: async (goalId, stepId, updates) => {
    const goal = get().goals.find((g) => g.id === goalId)
    if (!goal) return
    const updated = {
      ...goal,
      steps: goal.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
      updatedAt: new Date().toISOString(),
    }
    await db.goals.put(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === goalId ? updated : g)) }))
  },
  deleteStep: async (goalId, stepId) => {
    const goal = get().goals.find((g) => g.id === goalId)
    if (!goal) return
    const steps = goal.steps
      .filter((s) => s.id !== stepId)
      .map((s, i) => ({ ...s, order: i }))
    const updated = { ...goal, steps, updatedAt: new Date().toISOString() }
    await db.goals.put(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === goalId ? updated : g)) }))
  },
  toggleStep: async (goalId, stepId) => {
    const goal = get().goals.find((g) => g.id === goalId)
    if (!goal) return
    const updated = {
      ...goal,
      steps: goal.steps.map((s) =>
        s.id === stepId
          ? { ...s, isCompleted: !s.isCompleted, completedAt: !s.isCompleted ? new Date().toISOString() : undefined }
          : s
      ),
      updatedAt: new Date().toISOString(),
    }
    await db.goals.put(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === goalId ? updated : g)) }))
  },
  reorderSteps: async (goalId, activeId, overId) => {
    const goal = get().goals.find((g) => g.id === goalId)
    if (!goal) return
    const sorted = [...goal.steps].sort((a, b) => a.order - b.order)
    const activeIdx = sorted.findIndex((s) => s.id === activeId)
    const overIdx = sorted.findIndex((s) => s.id === overId)
    if (activeIdx === -1 || overIdx === -1) return
    const reordered = arrayMove(sorted, activeIdx, overIdx).map((s, i) => ({ ...s, order: i }))
    const updated = { ...goal, steps: reordered, updatedAt: new Date().toISOString() }
    await db.goals.put(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === goalId ? updated : g)) }))
  },
}))
