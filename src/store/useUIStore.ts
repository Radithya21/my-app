import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, AIModel } from '../types'

interface UIStore {
  theme: Theme
  sidebarOpen: boolean
  geminiApiKey: string
  geminiModel: AIModel
  geminiCoachModel: AIModel
  aiWritingAssistEnabled: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  applyTheme: () => void
  setGeminiApiKey: (key: string) => void
  getGeminiApiKey: () => string
  setGeminiModel: (model: AIModel) => void
  setGeminiCoachModel: (model: AIModel) => void
  setAIWritingAssistEnabled: (v: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      geminiApiKey: '',
      geminiModel: 'gemini-2.0-flash-lite',
      geminiCoachModel: 'gemini-2.0-flash',
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
      setGeminiApiKey: (key) => {
        set({ geminiApiKey: key ? btoa(key) : '' })
      },
      getGeminiApiKey: () => {
        const encoded = get().geminiApiKey
        if (!encoded) return ''
        try { return atob(encoded) } catch { return '' }
      },
      setGeminiModel: (model) => set({ geminiModel: model }),
      setGeminiCoachModel: (model) => set({ geminiCoachModel: model }),
      setAIWritingAssistEnabled: (v) => set({ aiWritingAssistEnabled: v }),
    }),
    { name: 'personal-os-ui' }
  )
)
