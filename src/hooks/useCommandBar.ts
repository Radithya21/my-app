import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { CommandResult, CommandHistoryItem } from '../types'
import { parseCommandLocally } from '../ai/commandParser'
import { getAIErrorMessage, getClient } from '../ai/geminiClient'
import { SYSTEM_COMMAND_PARSER } from '../ai/prompts'
import { useUIStore } from '../store/useUIStore'
import { useAIStore } from '../store/useAIStore'
import { useTodoStore } from '../store/useTodoStore'
import { generateId } from '../utils/generateId'
import { toISODate } from '../utils/formatDate'

const HISTORY_KEY = 'personal-os-cmd-history'
const MAX_HISTORY = 10

function loadHistory(): CommandHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToHistory(item: CommandHistoryItem) {
  const existing = loadHistory()
  const updated = [item, ...existing].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function useCommandBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CommandResult | null>(null)
  const [history, setHistory] = useState<CommandHistoryItem[]>(() => loadHistory())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { closeCommandBar } = useAIStore()
  const { geminiModel, getGeminiApiKey } = useUIStore.getState()

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setResult(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      // Fast path: local regex
      const localResult = parseCommandLocally(q)
      if (localResult) {
        setResult(localResult)
        return
      }

      // Slow path: API
      const apiKey = getGeminiApiKey()
      if (!apiKey) {
        setResult({ intent: 'unknown', confidence: 'low' })
        return
      }

      setIsLoading(true)
      try {
        const today = toISODate(new Date())
        const response = await getClient().chat.completions.create({
          model: geminiModel,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_COMMAND_PARSER.replace('{DATE}', today) },
            { role: 'user', content: q },
          ],
          max_tokens: 256,
        })
        const text = response.choices[0].message.content ?? '{}'
        const parsed: CommandResult = JSON.parse(text)
        setResult(parsed)
      } catch (err) {
        console.error('[CommandBar] Gemini error:', err)
        toast.error(getAIErrorMessage(err, 'Gagal memproses perintah.'))
        setResult(null)
      } finally {
        setIsLoading(false)
      }
    }, 400)
  }, [geminiModel, getGeminiApiKey])

  const handleExecute = useCallback((res: CommandResult) => {
    const historyItem: CommandHistoryItem = {
      id: generateId(),
      query,
      result: res,
      executedAt: new Date().toISOString(),
    }
    saveToHistory(historyItem)
    setHistory(loadHistory())

    if (res.intent === 'query') {
      closeCommandBar()
      return
    }

    if (res.intent === 'create_todo' && res.parsedData) {
      const { title, priority, dueDate, category, description } = res.parsedData
      if (title) {
        useTodoStore.getState().addItem({
          title,
          priority: priority ?? 'medium',
          dueDate,
          category,
          description,
          isPinned: false,
        })
        toast.success('Tugas ditambahkan')
      }
      closeCommandBar()
      return
    }

    if (res.intent === 'create_goal' && res.parsedData?.title) {
      sessionStorage.setItem('prefill-goal', JSON.stringify(res.parsedData))
      closeCommandBar()
      navigate('/goals')
      return
    }

    if (res.intent === 'create_debt' && res.parsedData) {
      sessionStorage.setItem('prefill-debt', JSON.stringify(res.parsedData))
      closeCommandBar()
      navigate('/debt')
      return
    }

    if (res.intent === 'create_activity' && res.parsedData) {
      sessionStorage.setItem('prefill-activity', JSON.stringify(res.parsedData))
      closeCommandBar()
      navigate('/schedule')
      return
    }

    closeCommandBar()
  }, [query, closeCommandBar, navigate])

  const clearResult = useCallback(() => setResult(null), [])

  const reset = useCallback(() => {
    setQuery('')
    setResult(null)
    setIsLoading(false)
  }, [])

  return { query, setQuery: handleSearch, isLoading, result, history, handleExecute, clearResult, reset }
}
