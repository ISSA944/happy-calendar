// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ReadyTabOutlet, cachedPageLoader } from './ReadyTabOutlet'
import { LazyMotion, domAnimation } from 'framer-motion'
import type { ReactNode } from 'react'

afterEach(cleanup)
const home = async () => ({ default: () => <p>Home content</p> })
const wrapper = ({ children }: { children: ReactNode }) => <LazyMotion features={domAnimation}>{children}</LazyMotion>

it('retains the current screen while the first target import is pending and ignores superseded loads', async () => {
  let finish!: (value: { default: () => React.JSX.Element }) => void
  const loaders = {
    home,
    bookmarks: () => new Promise<{ default: () => React.JSX.Element }>(resolve => { finish = resolve }),
    settings: async () => ({ default: () => <p>Settings content</p> }),
  }
  const view = render(<ReadyTabOutlet path="home" loaders={loaders} />, { wrapper })
  await waitFor(() => expect(screen.getByText('Home content')).toBeVisible())
  view.rerender(<ReadyTabOutlet path="bookmarks" loaders={loaders} />)
  expect(screen.getByText('Home content')).toBeVisible()
  view.rerender(<ReadyTabOutlet path="settings" loaders={loaders} />)
  await screen.findByText('Settings content')
  await act(async () => finish({ default: () => <p>Bookmarks content</p> }))
  expect(screen.queryByText('Bookmarks content')).not.toBeInTheDocument()
})

it('keeps the current screen on import failure and retries the destination', async () => {
  const target = vi.fn().mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ default: () => <p>Loaded after retry</p> })
  const loaders = { home, target }
  const view = render(<ReadyTabOutlet path="home" loaders={loaders} />, { wrapper })
  await waitFor(() => expect(screen.getByText('Home content')).toBeVisible())
  view.rerender(<ReadyTabOutlet path="target" loaders={loaders} />)
  const retry = await screen.findByRole('button', { name: 'Повторить переход' })
  expect(screen.getByText('Home content')).toBeVisible()
  fireEvent.click(retry)
  await screen.findByText('Loaded after retry')
})

it('reuses successful preload promises but permits retry after a failed import', async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementation(home)
  const cached = cachedPageLoader(load)
  await expect(cached()).rejects.toThrow('offline')
  const first = cached()
  expect(cached()).toBe(first)
  await first
  expect(load).toHaveBeenCalledTimes(2)
})
