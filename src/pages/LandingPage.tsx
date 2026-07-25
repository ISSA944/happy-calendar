import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LandingHero } from '../features/landing/LandingHero'
import { LandingAbout } from '../features/landing/LandingAbout'
import { LandingHolidays } from '../features/landing/LandingHolidays'
import { LandingGoals } from '../features/landing/LandingGoals'
import { LandingMood } from '../features/landing/LandingMood'
import { LandingTrust } from '../features/landing/LandingTrust'

/**
 * Промо-лендинг (главная страница сайта) — витрина уже реализованного в приложении, по ТЗ Оли
 * (Downloads/Telegram Desktop/ТЗ_Лендинг_YoYoJoy.pdf, референс — prototype/landing.html).
 * Рендерится в RootGuard для неавторизованных визитёров вместо старого WelcomePage.
 *
 * #root/body у всего приложения — фиксированной высоты с overflow:hidden (SPA-шелл, см. src/index.css),
 * поэтому сам скролл длинной страницы обеспечивает этот компонент (overflow-y-auto), а не document —
 * IntersectionObserver ниже привязан именно к этому контейнеру (root), не к window.
 */
export function LandingPage() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return

    // Память скролла: если ушли на /register по CTA и вернулись назад (не дошли до конца) —
    // лендинг открывается там же, откуда ушли, а не сверху. Восстанавливаем ДО настройки
    // IntersectionObserver ниже, чтобы уже проскроленные блоки сразу считались видимыми.
    const savedScroll = sessionStorage.getItem('landing-scroll')
    if (savedScroll) {
      root.scrollTop = Number(savedScroll)
      sessionStorage.removeItem('landing-scroll')
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('landing-visible')
        })
      },
      { root, threshold: 0.15 },
    )
    root.querySelectorAll('.landing-fade-in-scroll').forEach((el) => observer.observe(el))

    let saveTimer: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        sessionStorage.setItem('landing-scroll', String(root.scrollTop))
      }, 150)
    }
    root.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      root.removeEventListener('scroll', onScroll)
      if (saveTimer) clearTimeout(saveTimer)
    }
  }, [])

  return (
    <div
      ref={scrollRef}
      className="relative h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none bg-surface"
    >
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-surface border-b border-surface-container-high px-6 flex items-center justify-between py-3 landscape:py-2">
        <img src="/logo.yoyo.svg" alt="YoYoJoy" className="h-9 w-auto" />
        <button
          onClick={() => navigate('/register')}
          className="landing-cta-gradient text-white px-6 py-2.5 rounded-full font-headline font-bold text-sm shadow-lg active:scale-95 transition-transform animate-landing-button-pulse whitespace-nowrap"
        >
          Попробовать
        </button>
      </header>

      <main>
        <LandingHero />
        <LandingAbout />
        <LandingHolidays />
        <LandingGoals />
        <LandingMood />
        <LandingTrust />
      </main>

      <footer className="bg-surface border-t border-surface-container py-14 landscape:py-8 px-6 text-center">
        <img src="/logo.yoyo.svg" alt="YoYoJoy" className="h-8 w-auto mx-auto mb-6 opacity-40" />
        <p className="text-[12px] text-on-surface-variant/50 font-medium tracking-wider uppercase">
          © {new Date().getFullYear()} YoYoJoy. Все права защищены.
        </p>
      </footer>
    </div>
  )
}
