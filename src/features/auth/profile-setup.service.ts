import { apiClient } from '../../api'

type ProfileSetupInput = {
  hadNameOnEntry: boolean
  nameDraft: string
  birthdate: string
  zodiacSign: string
  gender: 'F' | 'M' | 'UNKNOWN'
  timezone: string
}

export async function saveProfileSetup(input: ProfileSetupInput) {
  const name = input.nameDraft.trim()
  return apiClient.patch('profile', {
    ...(!input.hadNameOnEntry && name ? { name } : {}),
    birthdate: input.birthdate,
    zodiacSign: input.zodiacSign,
    gender: input.gender,
    timezone: input.timezone,
  })
}
