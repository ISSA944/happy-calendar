import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../api'
import { saveProfileSetup } from './profile-setup.service'

vi.mock('../../api', () => ({
  apiClient: { patch: vi.fn() },
}))

describe('saveProfileSetup', () => {
  beforeEach(() => vi.mocked(apiClient.patch).mockReset())

  it('sends a newly entered trimmed name exactly once with the profile', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })

    await saveProfileSetup({
      hadNameOnEntry: false,
      nameDraft: '  Александра  ',
      birthdate: '01.02.1990',
      zodiacSign: 'Водолей ♒︎',
      gender: 'F',
      timezone: 'Europe/Moscow',
    })

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    expect(apiClient.patch).toHaveBeenCalledWith('profile', {
      name: 'Александра',
      birthdate: '01.02.1990',
      zodiacSign: 'Водолей ♒︎',
      gender: 'F',
      timezone: 'Europe/Moscow',
    })
  })

  it('does not overwrite a name that existed at registration', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })

    await saveProfileSetup({
      hadNameOnEntry: true,
      nameDraft: 'Ольга',
      birthdate: '01.02.1990',
      zodiacSign: 'Водолей ♒︎',
      gender: 'F',
      timezone: 'Europe/Moscow',
    })

    expect(apiClient.patch).toHaveBeenCalledWith(
      'profile',
      expect.not.objectContaining({ name: expect.anything() }),
    )
  })
})
