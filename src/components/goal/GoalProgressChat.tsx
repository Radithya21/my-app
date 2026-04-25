import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatBubble } from './ChatBubble'
import { ChatStreamingBubble } from './ChatStreamingBubble'
import { ChatInput } from './ChatInput'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { getAIErrorMessage } from '../../ai/geminiClient'
import { useGoalChat } from '../../hooks/useGoalChat'
import { useUIStore } from '../../store/useUIStore'
import type { Goal } from '../../types'

const SUGGESTED_PROMPTS = [
  'Apakah aku masih on track?',
  'Langkah mana yang paling mendesak?',
  'Apa risikonya jika deadline tidak tercapai?',
]

interface GoalProgressChatProps {
  goal: Goal
}

export function GoalProgressChat({ goal }: GoalProgressChatProps) {
  const hasApiKey = !!useUIStore((s) => s.geminiApiKey)
  const { messages, streamingContent, isStreaming, sendMessage, clearHistory } = useGoalChat(goal.id)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <p className="text-sm text-text-muted">Set up Grok API key di Settings untuk mulai chat.</p>
      </div>
    )
  }

  const handleSend = async (content: string) => {
    try {
      await sendMessage(content, goal, goal.steps)
    } catch (err) {
      console.error('[GoalProgressChat] Gemini error:', err)
      toast.error(getAIErrorMessage(err, 'Gagal mengirim pesan.'))
    }
  }

  const handleClear = async () => {
    await clearHistory()
    setShowClearConfirm(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={messages.length === 0}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-danger disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={11} />
          Hapus riwayat
        </button>
      </div>

      <div className="flex flex-col gap-2.5 min-h-[120px] max-h-64 overflow-y-auto">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col gap-2 py-2">
            <p className="text-xs text-text-muted text-center mb-1">Tanya AI tentang goal ini</p>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="text-left text-xs px-3 py-2 rounded-xl border border-border hover:bg-bg-secondary text-text-secondary transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
            {isStreaming && streamingContent !== null && (
              <ChatStreamingBubble content={streamingContent} />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isStreaming} />

      <ConfirmDialog
        isOpen={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Hapus Riwayat Chat"
        message="Semua riwayat percakapan untuk goal ini akan dihapus. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, hapus"
      />
    </div>
  )
}
