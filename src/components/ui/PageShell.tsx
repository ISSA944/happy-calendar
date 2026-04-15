import type { ReactNode } from 'react'

interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className = '' }: PageShellProps) {
  return (
    <div className={`flex flex-col min-h-full bg-background ${className}`}>
      {children}
    </div>
  )
}
