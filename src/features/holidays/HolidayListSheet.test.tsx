// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { HolidayListSheet } from './HolidayListSheet'
import { useAppStore } from '../../store'

afterEach(cleanup)

it('restores the holiday list scroll after opening a postcard and going back', async () => {
  const holiday = { id: 'test', title: 'Тестовый праздник', themeKey: 'city', date: '06.09', scope: 'ru', imageUrl: null, postcardReady: false }
  useAppStore.setState({ getHolidayCard: vi.fn().mockResolvedValue({ ...holiday, tone: 'cute', text: 'Текст открытки' }), bookmarks: [] })
  render(<HolidayListSheet isOpen onClose={() => undefined} holidays={[holiday]} />)
  const list = screen.getByRole('region', { name: 'Список праздников' })
  list.scrollTop = 240
  fireEvent.scroll(list)
  fireEvent.click(screen.getByRole('button', { name: /Тестовый праздник/ }))
  await screen.findByText('Текст открытки')
  fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
  expect(screen.getByRole('region', { name: 'Список праздников' }).scrollTop).toBe(240)
})
