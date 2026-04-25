import { create } from 'zustand'

interface AIStore {
  isCommandBarOpen: boolean
  digestUnread: boolean
  openCommandBar: () => void
  closeCommandBar: () => void
  setDigestUnread: (v: boolean) => void
}

export const useAIStore = create<AIStore>()((set) => ({
  isCommandBarOpen: false,
  digestUnread: false,
  openCommandBar: () => set({ isCommandBarOpen: true }),
  closeCommandBar: () => set({ isCommandBarOpen: false }),
  setDigestUnread: (v) => set({ digestUnread: v }),
}))
