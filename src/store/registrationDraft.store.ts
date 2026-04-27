import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface RegistrationDraft {
  name: string
  email: string
  consent: boolean
  marketing: boolean
}

interface RegistrationDraftState extends RegistrationDraft {
  update: (patch: Partial<RegistrationDraft>) => void
  clear: () => void
}

const EMPTY_DRAFT: RegistrationDraft = {
  name: '',
  email: '',
  consent: false,
  marketing: false,
}

export const useRegistrationDraft = create<RegistrationDraftState>()(
  persist(
    (set) => ({
      ...EMPTY_DRAFT,
      update: (patch) => set(patch),
      clear: () => set(EMPTY_DRAFT),
    }),
    {
      name: 'yoyojoy-registration-draft',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
