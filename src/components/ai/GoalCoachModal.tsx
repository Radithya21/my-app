import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { getAIErrorMessage, getClient } from '../../ai/geminiClient'
import { SYSTEM_GOAL_COACH } from '../../ai/prompts'
import { useGoalStore } from '../../store/useGoalStore'
import { useUIStore } from '../../store/useUIStore'
import { toISODate } from '../../utils/formatDate'
import type { Goal } from '../../types'

interface CoachStep {
  title: string
  description: string
  targetDate: string | null
}

interface GoalCoachModalProps {
  isOpen: boolean
  goal: Goal | null
  onClose: () => void
  onDone: () => void
}

function tryParseSteps(text: string): CoachStep[] {
  try {
    const parsed = JSON.parse(text)
    const steps = parsed.steps ?? parsed
    if (Array.isArray(steps)) {
      return steps.filter((s: unknown) => s && typeof (s as CoachStep).title === 'string')
    }
  } catch {
    // Not valid JSON yet
  }
  return []
}

export function GoalCoachModal({ isOpen, goal, onClose, onDone }: GoalCoachModalProps) {
  const [phase, setPhase] = useState<'intro' | 'loading' | 'review'>('intro')
  const [steps, setSteps] = useState<CoachStep[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const { addStep, updateGoal } = useGoalStore()

  useEffect(() => {
    if (isOpen) setPhase('intro')
  }, [isOpen])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const startCoaching = useCallback(async () => {
    if (!goal) return
    setPhase('loading')
    setSteps([])
    abortRef.current = new AbortController()

    try {
      const today = toISODate(new Date())
      const { geminiCoachModel } = useUIStore.getState()
      const stream = await getClient().chat.completions.create(
        {
          model: geminiCoachModel,
          response_format: { type: 'json_object' },
          stream: true,
          messages: [
            { role: 'system', content: SYSTEM_GOAL_COACH.replace('{DATE}', today) },
            {
              role: 'user',
              content: JSON.stringify({
                judul: goal.title,
                deskripsi: goal.description ?? '',
                kategori: goal.category,
                prioritas: goal.priority,
                target_tanggal: goal.targetDate ?? 'tidak ditentukan',
                catatan: goal.description ?? '',
              }),
            },
          ],
        },
        { signal: abortRef.current.signal }
      )

      let accumulated = ''
      for await (const chunk of stream) {
        accumulated += chunk.choices[0]?.delta?.content ?? ''
        const parsed = tryParseSteps(accumulated)
        if (parsed.length > 0) setSteps(parsed)
      }

      const finalSteps = tryParseSteps(accumulated)
      if (finalSteps.length > 0) {
        setSteps(finalSteps)
        setPhase('review')
      } else {
        toast.error('AI tidak berhasil membuat rencana. Kamu tetap bisa tambah langkah secara manual.')
        onClose()
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('[GoalCoachModal] Gemini error:', err)
        toast.error(getAIErrorMessage(err, 'AI tidak berhasil membuat rencana.'))
        onClose()
      }
    }
  }, [goal, onClose])

  const handleSaveAll = () => {
    if (!goal) return
    steps.forEach((step) => {
      addStep(goal.id, {
        title: step.title,
        description: step.description || undefined,
        targetDate: step.targetDate ?? undefined,
        isCompleted: false,
        completedAt: undefined,
        source: 'ai',
      })
    })
    updateGoal(goal.id, { aiCoached: true })
    toast.success(`${steps.length} langkah ditambahkan`)
    onDone()
  }

  const handleDeleteStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEditTitle = (index: number, value: string) => {
    setSteps((prev) => prev.map((s, i) => i === index ? { ...s, title: value } : s))
  }

  const handleClose = () => {
    abortRef.current?.abort()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <span>Smart Goal Coach</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">✦ AI</span>
        </div>
      }
    >
      <div className="space-y-4">
        {phase === 'intro' && (
          <>
            <div className="bg-bg-secondary rounded-xl p-4 space-y-1">
              <p className="text-xs text-text-muted">Goal</p>
              <p className="text-sm font-medium text-text-primary">{goal?.title}</p>
            </div>
            <p className="text-sm text-text-secondary">
              Mau bantu bikin rencana langkah-langkahnya? AI akan generate 5-8 langkah konkret yang bisa kamu edit sebelum disimpan.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={handleClose}>Tidak, buat sendiri</Button>
              <Button onClick={startCoaching}>
                <Sparkles size={13} />
                Ya, buatkan
              </Button>
            </div>
          </>
        )}

        {phase === 'loading' && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 size={14} className="animate-spin text-accent" />
              Sedang membuat rencana...
            </div>
            {steps.length > 0 && (
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-bg-secondary rounded-lg">
                    <span className="text-xs text-text-muted shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-sm text-text-primary">{step.title}</p>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-xs text-text-muted animate-pulse">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Memproses...
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'review' && steps.length > 0 && (
          <>
            <p className="text-xs text-text-muted">
              {steps.length} langkah digenerate. Edit atau hapus sesuai kebutuhan, lalu simpan.
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-bg-secondary rounded-lg group">
                  <span className="text-xs text-text-muted shrink-0 mt-2">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <input
                      value={step.title}
                      onChange={(e) => handleEditTitle(i, e.target.value)}
                      className="w-full bg-transparent text-sm text-text-primary outline-none focus:underline"
                    />
                    {step.description && (
                      <p className="text-xs text-text-muted mt-0.5">{step.description}</p>
                    )}
                    {step.targetDate && (
                      <p className="text-[11px] text-text-muted mt-0.5">Target: {step.targetDate}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteStep(i)}
                    className="text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={handleClose}>Batal</Button>
              <Button onClick={handleSaveAll} disabled={steps.length === 0}>
                Simpan Semua ({steps.length} langkah)
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
