import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAIErrorMessage, getClient } from '../../ai/geminiClient'
import { WRITING_ASSIST_PROMPTS } from '../../ai/prompts'
import { useUIStore } from '../../store/useUIStore'

interface AIAssistButtonProps {
  formType: keyof typeof WRITING_ASSIST_PROMPTS
  titleValue: string
  onResult: (fields: Record<string, unknown>) => void
  disabled?: boolean
}

export function AIAssistButton({ formType, titleValue, onResult, disabled }: AIAssistButtonProps) {
  const [loading, setLoading] = useState(false)
  const aiWritingAssistEnabled = useUIStore((s) => s.aiWritingAssistEnabled)

  if (!aiWritingAssistEnabled) return null

  const handleClick = async () => {
    if (!titleValue.trim() || loading) return
    setLoading(true)
    try {
      const { geminiModel } = useUIStore.getState()
      const client = getClient()
      const response = await client.chat.completions.create({
        model: geminiModel,
        messages: [
          { role: 'system', content: WRITING_ASSIST_PROMPTS[formType] },
          { role: 'user', content: `Title: ${titleValue}` },
        ],
        response_format: { type: 'json_object' },
      })
      const raw = response.choices[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(raw)
      onResult(parsed)
    } catch (err) {
      console.error('[AIAssistButton] Gemini error:', err)
      toast.error(getAIErrorMessage(err, 'AI tidak bisa membantu saat ini.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || !titleValue.trim()}
      title="Lengkapi dengan AI"
      className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-50 hover:bg-blue-100 text-accent dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : '✦'}
    </button>
  )
}
