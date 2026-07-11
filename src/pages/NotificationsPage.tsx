import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useWebPush } from '../hooks'
import { NotificationCategoriesEditor } from '../features/notifications/NotificationCategoriesEditor'
import { useNotificationCategories } from '../features/notifications/useNotificationCategories'

export function NotificationsPage() {
  const navigate = useNavigate()
  const { subscribe, error: hookError } = useWebPush()
  const notificationCategories = useNotificationCategories()

  const [pushError,        setPushError]        = useState('')
  const [isRequestingPush, setIsRequestingPush] = useState(false)
  const [showIosInstruction, setShowIosInstruction] = useState(false)

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches

  const handleAllow = async () => {
    if (isRequestingPush) return
    
    // Logic for iOS browser users
    if (isIOS && !isStandalone) {
      setShowIosInstruction(true)
      return
    }

    setIsRequestingPush(true)
    setPushError('')
    try {
      const success = await subscribe()
      if (success) {
        navigate('/profile-setup')
        return
      }
      
      setPushError(hookError || 'Не удалось подключить push. Попробуйте ещё раз.')
    } catch {
      setPushError('Критическая ошибка подключения.')
    } finally {
      setIsRequestingPush(false)
    }
  }

  const handleSkip = () => navigate('/profile-setup')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      className="relative bg-background text-on-surface font-body h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-hidden flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-background/95 px-5 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center h-14 relative">
          <button
            onClick={() => showIosInstruction ? setShowIosInstruction(false) : navigate(-1)}
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-on-surface tracking-tight">
            {showIosInstruction ? 'Инструкция' : 'Уведомления'}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-10 landscape:pb-20 pt-4">
        <AnimatePresence mode="wait">
          {showIosInstruction ? (
            <motion.div
              key="instruction"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 text-center max-w-xl mx-auto"
            >
              <div className="space-y-4">
                <h2 className="font-headline font-bold text-2xl leading-tight text-on-surface">
                  Добавьте приложение на главный экран
                </h2>
                <p className="font-body text-base text-on-surface-variant leading-relaxed px-4">
                  Пуш-уведомления доступны только в PWA-версии. Это позволит вам получать гороскоп и поддержку вовремя.
                </p>
              </div>

              <div className="flex flex-col gap-4 text-left">
                {/* Steps with grid for landscape */}
                <div className="grid grid-cols-1 landscape:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-[20px] shadow-soft">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">ios_share</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-0.5">Шаг 1</span>
                      <p className="font-body text-[14px] font-semibold text-on-surface">Нажмите «Поделиться»</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-[20px] shadow-soft">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">add_to_home_screen</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-0.5">Шаг 2</span>
                      <p className="font-body text-[14px] font-semibold text-on-surface">«На экран Домой»</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-[20px] shadow-soft">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">done</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-0.5">Шаг 3</span>
                      <p className="font-body text-[14px] font-semibold text-on-surface">Нажмите «Добавить»</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Landscape-only action button inside scroll */}
              <div className="hidden landscape:block mt-4">
                <button
                  onClick={() => navigate('/profile-setup')}
                  className="w-full h-14 bg-primary text-on-primary rounded-2xl font-headline font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                >
                  Понятно, спасибо
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-5 landscape:grid landscape:grid-cols-2 landscape:items-start"
            >
              {/* Что и когда присылать — 4 категории, каждая со своим временем */}
              <section className="bg-white rounded-[24px] p-6 shadow-soft landscape:col-span-2">
                <h2 className="font-headline font-bold text-[17px] mb-1 text-on-surface">Что присылать</h2>
                <p className="text-xs text-on-surface-variant font-body mb-2">Можно изменить в любой момент в Настройках</p>
                <NotificationCategoriesEditor categories={notificationCategories} />
              </section>

              {/* Landscape-only action area - Full width button + Centered skip */}
              <div className="hidden landscape:flex landscape:flex-col landscape:items-center landscape:col-span-2 mt-4 gap-3 w-full">
                <div className="w-full">
                  <button
                    onClick={handleAllow}
                    disabled={isRequestingPush}
                    className="w-full h-14 bg-primary text-on-primary font-headline font-bold text-base rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                  >
                    {isRequestingPush ? 'Подключаем...' : 'Разрешить уведомления'}
                  </button>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-on-surface-variant font-body font-medium text-sm hover:text-on-surface transition-colors"
                >
                  Настрою позже
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Action Panel - PORTRAIT ONLY */}
      <div className="landscape:hidden fixed bottom-0 left-0 right-0 p-5 pb-10 bg-background/98 z-[60] flex flex-col items-center border-t border-outline-variant/20">
        <div className="w-full max-w-[390px]">
          {showIosInstruction ? (
            <button
              onClick={() => navigate('/profile-setup')}
              className="w-full h-14 bg-primary text-on-primary rounded-2xl font-headline font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
            >
              Понятно, спасибо
            </button>
          ) : (
            <div className="flex flex-col items-stretch gap-3 w-full">
              <button
                onClick={handleAllow}
                disabled={isRequestingPush}
                className="w-full h-14 bg-primary text-on-primary font-headline font-bold text-base rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                {isRequestingPush ? 'Подключаем...' : 'Разрешить уведомления'}
              </button>

              <button
                onClick={handleSkip}
                className="text-on-surface-variant font-body font-medium text-sm hover:text-on-surface transition-colors text-center py-1"
              >
                Настрою позже
              </button>

              {pushError && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-center text-xs font-medium text-error leading-snug">{pushError}</p>
                  <button
                    type="button"
                    onClick={() => { setPushError(''); void handleAllow(); }}
                    className="text-primary text-sm font-semibold underline underline-offset-2 active:opacity-70"
                  >
                    Попробовать снова
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
