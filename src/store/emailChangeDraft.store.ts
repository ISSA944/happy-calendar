import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface EmailChangeDraftState {
  email: string
  consent: boolean
  marketing: boolean
  update: (patch: Partial<Pick<EmailChangeDraftState, 'email' | 'consent' | 'marketing'>>) => void
  clear: () => void
}

const EMPTY_DRAFT = {
  email: '',
  consent: false,
  marketing: false,
}

export const useEmailChangeDraft = create<EmailChangeDraftState>()(
  persist(
    (set) => ({
      ...EMPTY_DRAFT,
      update: (patch) => set(patch),
      clear: () => set(EMPTY_DRAFT),
    }),
    {
      name: 'yoyojoy-email-change-draft',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
