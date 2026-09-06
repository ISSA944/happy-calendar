// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../store'
import { PostcardContent } from './PostcardSheet'

const holiday = { id: 'holiday-1', title: 'Праздник', themeKey: 'city', scope: 'ru' } as const
const card = { ...holiday, text: 'Тёплая открытка', tone: 'cute', postcardReady: false }
afterEach(cleanup)

describe('postcard tone loading', () => {
  it('keeps the current tone readable when it is selected again', async () => {
    const getHolidayCard = vi.fn().mockResolvedValue(card)
    useAppStore.setState({ getHolidayCard, bookmarks: [] })
    render(<PostcardContent holiday={holiday as never} />)
    await screen.findByText('Тёплая открытка')
    fireEvent.click(screen.getByRole('button', { name: 'Милая' }))
    await waitFor(() => expect(screen.getByText('Тёплая открытка')).toBeVisible())
    expect(getHolidayCard).toHaveBeenCalledTimes(1)
  })

  it('cannot save a stale card while the new tone is pending and offers retry on error', async () => {
    let reject!: (err: Error) => void
    const getHolidayCard = vi.fn().mockResolvedValueOnce(card)
      .mockImplementationOnce(() => new Promise((_, fail) => { reject = fail }))
      .mockResolvedValueOnce({ ...card, tone: 'humor', text: 'Весёлая открытка' })
    useAppStore.setState({ getHolidayCard, bookmarks: [] })
    render(<PostcardContent holiday={holiday as never} />)
    await screen.findByText('Тёплая открытка')
    fireEvent.click(screen.getByRole('button', { name: 'С юмором' }))
    expect(screen.getByRole('button', { name: /Сохранить/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Поделиться/ })).toBeDisabled()
    await act(async () => reject(new Error('offline')))
    fireEvent.click(await screen.findByRole('button', { name: 'Повторить загрузку' }))
    await waitFor(() => expect(screen.getByText('Весёлая открытка')).toBeVisible())
  })
})
