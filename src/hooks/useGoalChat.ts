import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { getClient } from '../ai/geminiClient'
import { buildGoalChatSystemPrompt } from '../ai/prompts'
import { useUIStore } from '../store/useUIStore'
import type { Goal, GoalStep, GoalChatMessage } from '../types'

export function useGoalChat(goalId: string) {
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const messages = useLiveQuery(
    () =>
      db.goalChats
        .where('goalId')
        .equals(goalId)
        .sortBy('createdAt'),
    [goalId]
  )

  const sendMessage = async (content: string, goal: Goal, steps: GoalStep[]) => {
    const userMsg: GoalChatMessage = {
      id: crypto.randomUUID(),
      goalId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    await db.goalChats.put(userMsg)

    const history = (messages ?? []).slice(-20).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const { geminiCoachModel } = useUIStore.getState()

    setIsStreaming(true)
    setStreamingContent('')

    try {
      const stream = await getClient().chat.completions.create({
        model: geminiCoachModel,
        stream: true,
        messages: [
          { role: 'system', content: buildGoalChatSystemPrompt(goal, steps) },
          ...history,
          { role: 'user', content },
        ],
      })

      let fullResponse = ''
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        fullResponse += delta
        setStreamingContent(fullResponse)
      }

      await db.goalChats.put({
        id: crypto.randomUUID(),
        goalId,
        role: 'assistant',
        content: fullResponse,
        createdAt: new Date().toISOString(),
      })
    } finally {
      setStreamingContent(null)
      setIsStreaming(false)
    }
  }

  const clearHistory = async () => {
    await db.goalChats.where('goalId').equals(goalId).delete()
  }

  return {
    messages: messages ?? [],
    streamingContent,
    isStreaming,
    sendMessage,
    clearHistory,
  }
}
