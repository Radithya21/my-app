export interface DebtItem {
  id: string
  type: 'owe' | 'lend'
  personName: string
  amount: number
  description: string
  date: string
  dueDate?: string
  isPaid: boolean
  paidAmount: number
  paidDate?: string
  payments: DebtPayment[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DebtPayment {
  id: string
  amount: number
  date: string
  note?: string
  createdAt: string
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
  source?: 'manual' | 'ai'
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
  aiCoached?: boolean
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
export type AIModel = 'gemini-2.0-flash-lite' | 'gemini-2.0-flash' | 'gemini-1.5-flash'

export interface CommandResult {
  intent: 'create_todo' | 'create_goal' | 'create_debt' | 'create_activity' | 'query' | 'unknown'
  parsedData?: {
    title?: string
    priority?: TodoItem['priority']
    dueDate?: string
    amount?: number
    personName?: string
    type?: 'owe' | 'lend'
    description?: string
    category?: string
  }
  answer?: string
  confidence: 'high' | 'low'
}

export interface CommandHistoryItem {
  id: string
  query: string
  result: CommandResult
  executedAt: string
}

export interface GoalChatMessage {
  id: string
  goalId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface AICacheEntry {
  id: string
  cacheKey: string
  value: string
  createdAt: string
  expiresAt: string
}

export interface DigestContext {
  date: string
  todayActivities: Activity[]
  pendingDebts: DebtItem[]
  nearDueTodos: TodoItem[]
  urgentTodos: TodoItem[]
  activeGoals: Goal[]
}

// Kesibukan v2.0 — Hierarchical Activity Management

export interface KesibukanStep {
  id: string
  name: string
  deadline?: string
  isCompleted: boolean
  notes?: string
  order: number
}

export interface SubKesibukan {
  id: string
  name: string
  deadline?: string
  steps: KesibukanStep[]
  order: number
}

export type KesibukanStatus = 'aktif' | 'ditunda' | 'selesai'

export interface Kesibukan {
  id: string
  name: string
  description?: string
  deadline?: string
  status: KesibukanStatus
  colorLabel: string
  subKesibukan: SubKesibukan[]
  createdAt: string
  updatedAt: string
}
