export interface DebtItem {
  id: string
  type: 'owe' | 'lend'
  personName: string
  amount: number
  description: string
  date: string
  dueDate?: string
  isPaid: boolean
  paidDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  title: string
  description?: string
  category: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'other'
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number[]
  dayOfMonth?: number
  date?: string
  timeStart?: string
  timeEnd?: string
  priority: 'low' | 'medium' | 'high'
  color?: string
  isActive: boolean
  createdAt: string
}

export interface GoalStep {
  id: string
  goalId: string
  title: string
  description?: string
  targetDate?: string
  isCompleted: boolean
  completedAt?: string
  order: number
}

export interface Goal {
  id: string
  title: string
  description?: string
  category: 'career' | 'finance' | 'health' | 'education' | 'personal' | 'other'
  targetDate?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'paused'
  steps: GoalStep[]
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

export interface TodoItem {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  dueDate?: string
  dueTime?: string
  isCompleted: boolean
  completedAt?: string
  isPinned: boolean
  goalId?: string
  createdAt: string
  updatedAt: string
}

export type Theme = 'light' | 'dark' | 'system'

export type TodoGroup = 'today' | 'tomorrow' | 'this_week' | 'later' | 'done'

export type ActivityCategory = Activity['category']
export type GoalCategory = Goal['category']
export type GoalStatus = Goal['status']
export type Priority = 'low' | 'medium' | 'high'
export type TodoPriority = TodoItem['priority']
