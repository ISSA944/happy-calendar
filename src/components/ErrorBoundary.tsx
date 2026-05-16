import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center px-6 text-center"
          style={{ background: '#fcf9f4' }}
        >
          <div className="max-w-sm space-y-4">
            <span className="material-symbols-outlined text-[48px] text-primary/60">error_outline</span>
            <h1 className="font-headline text-xl font-bold text-on-surface">Что-то пошло не так</h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Произошла непредвиденная ошибка. Попробуйте обновить страницу — обычно это помогает.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-4 h-12 w-full rounded-full bg-primary text-white font-headline font-bold text-base active:scale-[0.98] transition-transform"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
