import { ReactNode } from 'react'

export function MagicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 9L20.25 11.75L23 13L20.25 14.25L19 17L17.75 14.25L15 13L17.75 11.75L19 9ZM11.5 9.5L9 4L6.5 9.5L1 12L6.5 14.5L9 20L11.5 14.5L17 12L11.5 9.5ZM19 19L17.75 20.25L15 21.5L17.75 22.75L19 24L20.25 22.75L23 21.5L20.25 20.25L19 19Z" fill="currentColor"/>
    </svg>
  )
}

export function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z" fill="currentColor"/>
    </svg>
  )
}

export function PartyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 22L10 14M2 22L12 20M2 22L4 12M22 2L14 10M22 2L12 4M22 2L20 12M12 4L14 10L20 12L12 20L10 14L4 12L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
