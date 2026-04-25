import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { GreetingHeader } from '../dashboard/GreetingHeader'
import { getAIErrorMessage, getAIErrorStatus, getClient } from '../../ai/geminiClient'
import { SYSTEM_DIGEST } from '../../ai/prompts'
import { cacheGet, cacheSet, cacheInvalidate } from '../../lib/aiCache'
import { useUIStore } from '../../store/useUIStore'
import { useAIStore } from '../../store/useAIStore'
import type { AIModel, DigestContext } from '../../types'

interface DigestCache {
  text: string
  itemCount: number
}

interface DailyDigestProps {
  context: DigestContext
}

function buildLocalDigest(ctx: DigestContext): string {
  const activityCount = ctx.todayActivities.length
  const urgentTodoCount = ctx.urgentTodos.length
  const nearDueTodoCount = ctx.nearDueTodos.length
  const pendingDebtCount = ctx.pendingDebts.length
  const activeGoalCount = ctx.activeGoals.length

  if (activityCount === 0 && urgentTodoCount === 0 && nearDueTodoCount === 0 && pendingDebtCount === 0 && activeGoalCount === 0) {
    return 'Hari ini belum ada item aktif. Saat yang tepat untuk mulai satu langkah kecil agar progres tetap jalan.'
  }

  const parts: string[] = []
  parts.push(`Hari ini ada ${activityCount} aktivitas terjadwal dan ${activeGoalCount} tujuan aktif.`)

  if (urgentTodoCount > 0) {
    parts.push(`Kamu punya ${urgentTodoCount} tugas prioritas tinggi yang sebaiknya diselesaikan lebih dulu.`)
  } else if (nearDueTodoCount > 0) {
    parts.push(`Ada ${nearDueTodoCount} tugas dengan deadline dekat, prioritaskan yang paling berdampak.`)
  }

  if (pendingDebtCount > 0) {
    parts.push(`Terdapat ${pendingDebtCount} catatan hutang/piutang yang belum selesai, cek agar tidak terlewat.`)
  }

  parts.push('Fokus pada 1 sampai 3 hal terpenting supaya ritme harimu tetap stabil.')
  return parts.join(' ')
}

function DigestSkeleton() {
  return (
    <div className="animate-pulse space-y-2 py-1">
      <div className="h-3.5 bg-bg-secondary rounded w-3/4" />
      <div className="h-3.5 bg-bg-secondary rounded w-full" />
      <div className="h-3.5 bg-bg-secondary rounded w-5/6" />
      <div className="h-3.5 bg-bg-secondary rounded w-1/2" />
    </div>
  )
}

function totalItemCount(ctx: DigestContext): number {
  return ctx.todayActivities.length + ctx.pendingDebts.length + ctx.nearDueTodos.length + ctx.urgentTodos.length + ctx.activeGoals.length
}

export function DailyDigest({ context }: DailyDigestProps) {
  const hasApiKey = !!useUIStore((s) => s.geminiApiKey)
  const { setDigestUnread } = useAIStore()
  const [digestText, setDigestText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStale, setIsStale] = useState(false)
  const isGeneratingRef = useRef(false)
  const rateLimitedUntilRef = useRef(0)

  const cacheKey = `digest:${context.date}`
  const currentItemCount = totalItemCount(context)

  const generate = useCallback(async () => {
    if (isGeneratingRef.current) return
    if (Date.now() < rateLimitedUntilRef.current) return

    isGeneratingRef.current = true
    setIsLoading(true)
    try {
      const { geminiModel } = useUIStore.getState()

      const fallbackModel: AIModel | null =
        geminiModel === 'gemini-2.0-flash-lite'
          ? 'gemini-2.0-flash'
          : geminiModel === 'gemini-2.0-flash'
            ? 'gemini-2.0-flash-lite'
            : null

      const modelsToTry: AIModel[] = fallbackModel ? [geminiModel, fallbackModel] : [geminiModel]

      let generatedText: string | null = null
      let lastError: unknown = null

      for (const model of modelsToTry) {
        try {
          const created = await getClient().chat.completions.create({
            model,
            messages: [
              { role: 'system', content: SYSTEM_DIGEST.replace('{DATE}', context.date) },
              {
                role: 'user',
                content: JSON.stringify({
                  aktivitas_hari_ini: context.todayActivities.map((a) => a.title),
                  hutang_pending: context.pendingDebts.map((d) => ({ nama: d.personName, jumlah: d.amount, jatuh_tempo: d.dueDate })),
                  todo_mendesak: context.urgentTodos.map((t) => ({ judul: t.title, deadline: t.dueDate })),
                  todo_deadline_dekat: context.nearDueTodos.map((t) => ({ judul: t.title, deadline: t.dueDate })),
                  tujuan_aktif: context.activeGoals.map((g) => ({ judul: g.title, status: g.status })),
                }),
              },
            ],
            max_tokens: 512,
          })
          generatedText = created.choices[0].message.content ?? ''
          if (model !== geminiModel) {
            toast(`Ringkasan dibuat pakai model fallback (${model}).`, { id: 'digest-fallback' })
          }
          break
        } catch (err) {
          lastError = err
          const status = getAIErrorStatus(err)
          const shouldTryNext = (status === 429 || status === 404) && model !== modelsToTry[modelsToTry.length - 1]
          if (!shouldTryNext) throw err
        }
      }

      if (generatedText === null) throw lastError

      const text = generatedText
      setDigestText(text)
      setIsStale(false)
      await cacheSet<DigestCache>(cacheKey, { text, itemCount: currentItemCount }, 24 * 3600 * 1000)
      setDigestUnread(true)
    } catch (err) {
      const status = getAIErrorStatus(err)
      if (status === 429) {
        // Cooldown singkat untuk mencegah spam request saat quota/rate-limit.
        rateLimitedUntilRef.current = Date.now() + 60_000
      }

      if (status === 429 || status === 404) {
        const localText = buildLocalDigest(context)
        setDigestText(localText)
        setIsStale(false)
        await cacheSet<DigestCache>(cacheKey, { text: localText, itemCount: currentItemCount }, 6 * 3600 * 1000)
        toast('Gemini sedang limit/tidak tersedia. Menampilkan ringkasan lokal.', { id: 'digest-local-fallback' })
        return
      }

      console.error('[DailyDigest] Gemini error:', err)
      toast.error(
        getAIErrorMessage(err, 'Gagal membuat ringkasan hari ini.'),
        { id: 'digest-error' }
      )
    } finally {
      isGeneratingRef.current = false
      setIsLoading(false)
    }
  }, [context, cacheKey, currentItemCount, setDigestUnread])

  useEffect(() => {
    if (!hasApiKey) return
    let cancelled = false
    cacheGet<DigestCache>(cacheKey).then((cached) => {
      if (cancelled) return
      if (cached) {
        setDigestText(cached.text)
        if (Math.abs(currentItemCount - cached.itemCount) > 3) {
          setIsStale(true)
        }
        return
      }
      generate()
    })
    return () => { cancelled = true }
  }, [hasApiKey, cacheKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    const waitMs = rateLimitedUntilRef.current - Date.now()
    if (waitMs > 0) {
      const waitSec = Math.ceil(waitMs / 1000)
      toast.error(`Masih kena limit Gemini. Coba lagi ${waitSec} detik lagi.`, { id: 'digest-rate-limit' })
      return
    }
    await cacheInvalidate(cacheKey)
    generate()
  }

  return (
    <div className="space-y-3">
      <GreetingHeader />
      {hasApiKey && (
        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent" />
              <span className="text-xs font-medium text-text-muted">Ringkasan Hari Ini</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">✦ AI</span>
            </div>
            {isStale && !isLoading && (
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 text-[11px] text-accent hover:underline"
              >
                <RefreshCw size={10} />
                Perbarui ringkasan
              </button>
            )}
          </div>
          {isLoading ? (
            <DigestSkeleton />
          ) : digestText ? (
            <p className="text-sm text-text-secondary leading-relaxed">{digestText}</p>
          ) : (
            <p className="text-sm text-text-muted italic">Tidak bisa membuat ringkasan hari ini. Cek koneksi atau API key kamu.</p>
          )}
        </div>
      )}
    </div>
  )
}
