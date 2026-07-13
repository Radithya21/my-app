import OpenAI from 'openai'
import { useUIStore } from '../store/useUIStore'

let _client: OpenAI | null = null
let _clientKey: string | null = null

interface AIErrorLike {
  status?: number
  message?: string
  error?: { message?: string }
}

export function getAIErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const e = error as AIErrorLike
  return e.status
}

function getErrorDetails(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  const e = error as AIErrorLike
  return e.error?.message || e.message || ''
}

export function getAIErrorMessage(error: unknown, fallback: string): string {
  const e = (error && typeof error === 'object') ? (error as AIErrorLike) : undefined
  const details = getErrorDetails(error)

  if (e?.status === 401) return 'API key Groq tidak valid. Cek ulang di Pengaturan.'
  if (e?.status === 403) return 'Akses Groq ditolak. Pastikan API key punya izin.'
  if (e?.status === 404) return 'Model Groq tidak ditemukan. Ganti model di Pengaturan.'
  if (e?.status === 429) return 'Kuota Groq habis atau terlalu banyak request. Coba lagi sebentar.'

  return details ? `${fallback} ${details}` : fallback
}

export function getClient(): OpenAI {
  const key = useUIStore.getState().getGroqApiKey()
  if (!key) throw new Error('API key belum diisi. Buka Pengaturan › Integrasi AI.')
  if (!_client || _clientKey !== key) {
    _client = new OpenAI({
      apiKey: key,
      baseURL: 'https://api.groq.com/openai/v1',
      maxRetries: 0,
      dangerouslyAllowBrowser: true,
    })
    _clientKey = key
  }
  return _client
}

export function resetClient(): void {
  _client = null
  _clientKey = null
}
