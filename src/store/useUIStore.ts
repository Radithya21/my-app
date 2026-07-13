import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, AIModel } from '../types'

interface UIStore {
  theme: Theme
  sidebarOpen: boolean
  groqApiKey: string
  groqModel: AIModel
  groqCoachModel: AIModel
  aiWritingAssistEnabled: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  applyTheme: () => void
  setGroqApiKey: (key: string) => void
  getGroqApiKey: () => string
  setGroqModel: (model: AIModel) => void
  setGroqCoachModel: (model: AIModel) => void
  setAIWritingAssistEnabled: (v: boolean) => void
  // Legacy compat aliases
  setGeminiApiKey: (key: string) => void
  getGeminiApiKey: () => string
  setGeminiModel: (model: AIModel) => void
  setGeminiCoachModel: (model: AIModel) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      groqApiKey: '',
      groqModel: 'llama-3.3-70b-versatile',
      groqCoachModel: 'llama-3.3-70b-versatile',
      aiWritingAssistEnabled: true,
      setTheme: (theme) => {
        set({ theme })
        get().applyTheme()
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      applyTheme: () => {
        const { theme } = get()
        const isDark =
          theme === 'dark' ||
          (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
      },
      setGroqApiKey: (key) => {
        set({ groqApiKey: key ? btoa(key) : '' })
      },
      getGroqApiKey: () => {
        const encoded = get().groqApiKey
        if (!encoded) return ''
        try { return atob(encoded) } catch { return '' }
      },
      setGroqModel: (model) => set({ groqModel: model }),
      setGroqCoachModel: (model) => set({ groqCoachModel: model }),
      setAIWritingAssistEnabled: (v) => set({ aiWritingAssistEnabled: v }),
      // Legacy compat — so older refs to setGeminiApiKey still work
      setGeminiApiKey: (key) => get().setGroqApiKey(key),
      getGeminiApiKey: () => get().getGroqApiKey(),
      setGeminiModel: (model) => get().setGroqModel(model),
      setGeminiCoachModel: (model) => get().setGroqCoachModel(model),
    }),
    { name: 'personal-os-ui' }
  )
)
