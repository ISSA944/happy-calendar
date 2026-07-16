import { useId } from 'react'
import { THEME_GRADIENTS } from './themeGradients'

/**
 * Тематическая SVG-иллюстрация-фон для карточек праздников и дней заботы.
 * Пока клиент не прислал реальные WebP (ТЗ п. 7.1) — это осмысленный фолбэк:
 * мягкий градиент темы + декоративный «боке» + узнаваемый мотив (стиль Zen-Emerald).
 * Когда придут реальные картинки — они подставляются в `imageUrl`, а ThemeArt
 * остаётся запасным вариантом. 19 тем 1:1 с THEME_GRADIENTS / backend themes.constant.ts.
 */

const DEFAULT_THEME = 'Уютные пустяки и радости'

/** Мотив по теме, нарисованный вокруг центра (0,0), белым с прозрачностью. */
function motif(themeKey: string) {
  const w = 'rgba(255,255,255,0.92)' // основной штрих
  const s = 'rgba(255,255,255,0.55)' // вспомогательный
  switch (themeKey) {
    case 'Новый год и волшебство':
      return (
        <g fill={w}>
          <path d="M0,-42 L9,-9 L42,0 L9,9 L0,42 L-9,9 L-42,0 L-9,-9 Z" />
          <circle cx="34" cy="-30" r="4" fill={s} />
          <circle cx="-32" cy="26" r="3" fill={s} />
        </g>
      )
    case 'Зима и снег':
      return (
        <g stroke={w} strokeWidth="4" strokeLinecap="round" fill="none">
          {[0, 60, 120].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <line x1="0" y1="-38" x2="0" y2="38" />
              <line x1="0" y1="-38" x2="-9" y2="-28" />
              <line x1="0" y1="-38" x2="9" y2="-28" />
              <line x1="0" y1="38" x2="-9" y2="28" />
              <line x1="0" y1="38" x2="9" y2="28" />
            </g>
          ))}
        </g>
      )
    case 'Весна и цветение':
      return (
        <g fill={w}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-22" rx="10" ry="20" transform={`rotate(${a})`} />
          ))}
          <circle cx="0" cy="0" r="9" fill={s} />
        </g>
      )
    case 'Осень и уют':
      return (
        <g fill={w}>
          <path d="M0,-40 C24,-24 24,20 0,40 C-24,20 -24,-24 0,-40 Z" />
          <line x1="0" y1="-30" x2="0" y2="36" stroke={s} strokeWidth="3" />
        </g>
      )
    case 'Лето и море':
      return (
        <g>
          <circle cx="0" cy="-8" r="20" fill={w} />
          <g stroke={w} strokeWidth="4" strokeLinecap="round">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line key={a} x1="0" y1="-34" x2="0" y2="-42" transform={`rotate(${a}) translate(0 6)`} />
            ))}
          </g>
          <path d="M-38,30 q10,-10 19,0 t19,0 t19,0" stroke={s} strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'Космос и наука':
      return (
        <g>
          <circle cx="0" cy="0" r="20" fill={w} />
          <ellipse cx="0" cy="0" rx="40" ry="14" fill="none" stroke={s} strokeWidth="4" transform="rotate(-20)" />
          <path d="M30,-28 l3,8 l8,3 l-8,3 l-3,8 l-3,-8 l-8,-3 l8,-3 Z" fill={w} />
        </g>
      )
    case 'Животные и питомцы':
      return (
        <g fill={w}>
          <ellipse cx="0" cy="14" rx="20" ry="16" />
          <circle cx="-20" cy="-14" r="8" />
          <circle cx="-7" cy="-24" r="8" />
          <circle cx="7" cy="-24" r="8" />
          <circle cx="20" cy="-14" r="8" />
        </g>
      )
    case 'Еда и вкусности':
      return (
        <g fill={w}>
          <path d="M-22,-4 h44 l-6,34 a4,4 0 0 1 -4,4 h-20 a4,4 0 0 1 -4,-4 Z" />
          <path d="M-24,-4 a24,18 0 0 1 48,0 Z" fill={s} />
          <circle cx="0" cy="-26" r="6" fill={w} />
        </g>
      )
    case 'Спорт и движение':
      return (
        <g>
          <circle cx="0" cy="0" r="38" fill="rgba(255,255,255,0.16)" />
          <path d="M6,-32 L-16,6 L-1,6 L-6,32 L18,-6 L2,-6 Z" fill={w} />
        </g>
      )
    case 'Музыка, кино и искусство':
      return (
        <g fill={w}>
          <ellipse cx="-14" cy="26" rx="12" ry="9" transform="rotate(-18 -14 26)" />
          <ellipse cx="20" cy="18" rx="12" ry="9" transform="rotate(-18 20 18)" />
          <path d="M-2,26 L-2,-30 L32,-38 L32,18" stroke={w} strokeWidth="5" fill="none" />
        </g>
      )
    case 'Путешествия и города':
      return (
        <g fill={w}>
          <path d="M-38,-6 L40,-34 L14,38 L4,10 Z" />
          <path d="M4,10 L14,38 L20,16 Z" fill={s} />
        </g>
      )
    case 'Технологии и интернет':
      return (
        <g stroke={w} strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M-34,-6 a48,48 0 0 1 68,0" />
          <path d="M-20,10 a28,28 0 0 1 40,0" opacity="0.75" />
          <circle cx="0" cy="30" r="5" fill={w} stroke="none" />
        </g>
      )
    case 'Знания и образование':
      return (
        <g fill="none" stroke={w} strokeWidth="4" strokeLinejoin="round">
          <path d="M-38,-20 L0,-10 L38,-20 L0,-30 Z" fill={w} />
          <path d="M0,-10 L0,26" />
          <path d="M-24,-14 v22 a30,10 0 0 0 48,0 v-22" />
        </g>
      )
    case 'Природа и планета':
      return (
        <g fill="none" stroke={w} strokeWidth="4">
          <circle cx="0" cy="0" r="34" fill="rgba(255,255,255,0.18)" />
          <circle cx="0" cy="0" r="34" />
          <ellipse cx="0" cy="0" rx="14" ry="34" />
          <line x1="-34" y1="0" x2="34" y2="0" />
        </g>
      )
    case 'Любовь, семья и дружба':
      return <path d="M0,38 C-40,10 -34,-30 0,-14 C34,-30 40,10 0,38 Z" fill={w} />
    case 'Забота о себе и спокойствие':
      return (
        <g fill={w}>
          {[0, 40, 80, 120, 160].map((a) => (
            <ellipse key={a} cx="0" cy="-20" rx="9" ry="24" transform={`rotate(${a - 80})`} opacity="0.9" />
          ))}
          <path d="M-40,34 q40,16 80,0" stroke={s} strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'Красота и стиль':
      return (
        <g fill={w}>
          <path d="M0,-38 L26,-14 L0,40 L-26,-14 Z" />
          <path d="M-26,-14 L26,-14" stroke={s} strokeWidth="3" />
        </g>
      )
    case 'Профессии и труд':
      return (
        <g fill="none" stroke={w} strokeWidth="4" strokeLinejoin="round">
          <rect x="-34" y="-14" width="68" height="44" rx="8" fill="rgba(255,255,255,0.16)" />
          <rect x="-34" y="-14" width="68" height="44" rx="8" />
          <path d="M-14,-14 v-8 a6,6 0 0 1 6,-6 h16 a6,6 0 0 1 6,6 v8" />
        </g>
      )
    default: // Уютные пустяки и радости + фолбэк — чашка с паром
      return (
        <g fill="none" stroke={w} strokeWidth="5" strokeLinecap="round">
          <path d="M-26,2 h44 v18 a22,22 0 0 1 -44,0 Z" fill="rgba(255,255,255,0.16)" />
          <path d="M18,6 a12,12 0 0 1 0,22" />
          <path d="M-8,-26 q6,6 0,14" opacity="0.8" />
          <path d="M6,-26 q6,6 0,14" opacity="0.8" />
        </g>
      )
  }
}

interface ThemeArtProps {
  themeKey: string
  className?: string
}

export function ThemeArt({ themeKey, className }: ThemeArtProps) {
  const id = useId().replace(/:/g, '')
  const [from, to] = THEME_GRADIENTS[themeKey] ?? THEME_GRADIENTS[DEFAULT_THEME]

  return (
    <svg
      className={`block${className ? ` ${className}` : ''}`}
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#g-${id})`} />
      {/* Мягкий «боке» для глубины */}
      <circle cx="60" cy="40" r="70" fill="rgba(255,255,255,0.10)" />
      <circle cx="340" cy="170" r="90" fill="rgba(255,255,255,0.08)" />
      <circle cx="330" cy="30" r="34" fill="rgba(255,255,255,0.10)" />
      <g transform="translate(200 100)">{motif(themeKey)}</g>
    </svg>
  )
}
