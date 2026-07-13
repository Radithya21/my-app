import Dexie, { type EntityTable } from 'dexie'
import type {
  DebtItem, Activity, Goal, TodoItem,
  AICacheEntry, CommandHistoryItem, GoalChatMessage, Kesibukan,
} from '../types'

export const db = new Dexie('PersonalOSDatabase') as Dexie & {
  debts: EntityTable<DebtItem, 'id'>
  activities: EntityTable<Activity, 'id'>
  goals: EntityTable<Goal, 'id'>
  todos: EntityTable<TodoItem, 'id'>
  aiCache: EntityTable<AICacheEntry, 'id'>
  commandHistory: EntityTable<CommandHistoryItem, 'id'>
  goalChats: EntityTable<GoalChatMessage, 'id'>
  kesibukan: EntityTable<Kesibukan, 'id'>
}

db.version(1).stores({
  debts: 'id, type, isPaid, dueDate, createdAt',
  activities: 'id, category, recurrence, isActive',
  goals: 'id, status, targetDate, createdAt',
  todos: 'id, priority, isCompleted, dueDate, isPinned, createdAt',
  aiCache: 'id, cacheKey, expiresAt',
  commandHistory: 'id, executedAt',
  goalChats: 'id, goalId, createdAt',
})

db.version(2).stores({
  kesibukan: 'id, status, deadline, createdAt',
})

// v3: Kesibukan simplified to category labels; todos gain kesibukanId
db.version(3).stores({
  kesibukan: 'id, status, createdAt',
  todos: 'id, priority, isCompleted, dueDate, isPinned, kesibukanId, createdAt',
}).upgrade(async (tx) => {
  // Migrate old Kesibukan: remove subKesibukan field
  await tx.table('kesibukan').toCollection().modify((item: Record<string, unknown>) => {
    delete item['subKesibukan']
    delete item['deadline']
  })
})
