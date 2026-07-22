import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store'
import { usePWAInstall } from '../hooks'
import { BottomSheet } from './ui/BottomSheet'

/**
 * Плашка «установить на телефон» + инструкции iOS/Android — вынесена из HomePage.tsx,
 * монтируется один раз на уровне AppLayout (App.tsx), поэтому видна на всех вкладках
 * (Home/Закладки/Настройки/Уведомления), а не только на Home. По требованию клиента
 * плашка больше НЕ прячется навсегда после 2 закрытий — только на текущую сессию
 * (sessionDismissed сбрасывается при каждом новом открытии приложения).
 */
export function InstallBanner() {
  const dismissInstallBanner = useAppStore(s => s.dismissInstallBanner)
  const [sessionDismissed, setSessionDismissed] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [showAndroidModal, setShowAndroidModal] = useState(false)

  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall()
  const showInstallBanner = isInstallable && !isInstalled && !sessionDismissed

  useEffect(() => {
    const isModalOpen = showIOSModal || showAndroidModal
    if (!isModalOpen) return
    const b = document.body.style
    const h = document.documentElement.style
    const prevBodyOverflow = b.overflow
    const prevHtmlOverflow = h.overflow
    const prevBodyOverscroll = b.overscrollBehavior
    b.overflow = 'hidden'
    h.overflow = 'hidden'
    b.overscrollBehavior = 'none'
    return () => {
      b.overflow = prevBodyOverflow
      h.overflow = prevHtmlOverflow
      b.overscrollBehavior = prevBodyOverscroll
    }
  }, [showIOSModal, showAndroidModal])

  const handleInstallClick = useCallback(async () => {
    if (isIOS) {
      setShowIOSModal(true)
    } else {
      const success = await triggerInstall()
      if (!success) {
        setShowAndroidModal(true)
      }
    }
  }, [isIOS, triggerInstall])

  const closeIOSModal = useCallback(() => {
    setShowIOSModal(false)
    setSessionDismissed(true)
    dismissInstallBanner()
  }, [dismissInstallBanner])

  const closeAndroidModal = useCallback(() => {
    setShowAndroidModal(false)
    setSessionDismissed(true)
    dismissInstallBanner()
  }, [dismissInstallBanner])

  return (
    <>
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            key="pwa-banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ willChange: 'opacity' }}
            className="bg-surface-container-low rounded-[24px] p-4 border border-white/40 flex flex-col gap-3 relative shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-8 overflow-hidden"
          >
            <button
              onClick={() => {
                setSessionDismissed(true)
                dismissInstallBanner()
              }}
              className="absolute top-3 right-3 text-on-surface-variant/30 hover:text-on-surface-variant transition-colors active:scale-90 z-10"
              aria-label="Закрыть"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <div className="flex items-center gap-3 pr-8">
              <div className="w-12 h-12 landscape:w-10 landscape:h-10 flex-shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline font-bold text-on-surface text-sm tracking-tight">Установить приложение</p>
                <p className="text-[12px] text-on-surface-variant/80 font-medium leading-tight">Работает офлайн · как родное приложение</p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="w-full bg-primary-container text-white py-2.5 rounded-full font-bold text-xs shadow-sm active:scale-95 transition-colors"
            >
              Установить
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iOS Install Modal ── */}
      <BottomSheet isOpen={showIOSModal} onClose={closeIOSModal} hideDragIndicator={false}>
        <div className="px-6 pb-2 flex items-center gap-4 mb-6 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
          </div>
          <div>
            <p className="font-headline font-bold text-on-surface text-base">Установить на iPhone</p>
            <p className="text-xs text-on-surface-variant mt-0.5">3 простых шага в Safari</p>
          </div>
        </div>
        <div className="px-6 pb-8">
          <div className="space-y-4 mb-8">
            {[
              { icon: 'ios_share', text: 'Нажмите иконку "Поделиться" внизу Safari' },
              { icon: 'add_box', text: 'Выберите "На экран «Домой»"' },
              { icon: 'check_circle', text: 'Нажмите "Добавить" — готово!' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">{step.icon}</span>
                </div>
                <p className="text-sm text-on-surface font-medium">{step.text}</p>
              </div>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={closeIOSModal}
            className="w-full py-4 bg-primary-container text-white rounded-full font-headline font-bold text-sm"
          >
            Понятно
          </motion.button>
        </div>
      </BottomSheet>

      {/* ── Android Install Modal ── */}
      <BottomSheet isOpen={showAndroidModal} onClose={closeAndroidModal} hideDragIndicator={false}>
        <div className="px-6 pb-2 flex items-center gap-4 mb-6 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
          </div>
          <div>
            <p className="font-headline font-bold text-on-surface text-base">Установить на Android</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Через меню Chrome</p>
          </div>
        </div>
        <div className="px-6 pb-8">
          <div className="space-y-4 mb-8">
            {[
              { icon: 'more_vert', text: 'Нажмите на три точки в углу браузера' },
              { icon: 'add_to_home_screen', text: 'Выберите пункт "Добавить на главный экран"' },
              { icon: 'install_mobile', text: 'Выберите пункт "Установить приложение"' },
              { icon: 'check_circle', text: 'Подтвердите установку — готово!' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">{step.icon}</span>
                </div>
                <p className="text-sm text-on-surface font-medium">{step.text}</p>
              </div>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={closeAndroidModal}
            className="w-full py-4 bg-primary-container text-white rounded-full font-headline font-bold text-sm"
          >
            Понятно
          </motion.button>
        </div>
      </BottomSheet>
    </>
  )
}
