import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      style={{ willChange: 'opacity' }}
      className="relative h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 80% 10%, rgba(0,106,101,0.06) 0%, transparent 50%), radial-gradient(circle at 20% 70%, rgba(47,167,160,0.05) 0%, transparent 50%)' }}
      />

      {/* Portrait: flex-col. Landscape: 2-column grid */}
      <div
        className="relative z-10 h-full flex flex-col justify-between px-8 landscape:grid landscape:grid-cols-2 landscape:gap-8 landscape:px-10 landscape:items-center"
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* LEFT column: text + features */}
        <div className="flex flex-col landscape:justify-center landscape:py-4">
          {/* Hero text */}
          <div className="pt-6 landscape:pt-0 text-center landscape:text-left mb-2 landscape:mb-6">
            <h1 className="font-headline font-extrabold text-4xl landscape:text-3xl leading-tight text-on-surface tracking-tight mb-3 landscape:mb-2">
              Здесь можно выдохнуть
            </h1>
            <p className="font-body text-on-surface-variant text-lg landscape:text-base leading-relaxed px-2 landscape:px-0">
              Персональный гороскоп дня и поддержка по настроению. Нежно, без давления.
            </p>
          </div>

          {/* Features — hidden on portrait (shown below orb), visible in landscape */}
          <div className="hidden landscape:flex flex-col space-y-4 mt-4">
            <Feature icon="auto_awesome" label="Гороскоп по твоему знаку" />
            <Feature icon="favorite" label="Поддержка в моменте" />
            <Feature icon="celebration" label="Поздравления с праздниками" />
          </div>
        </div>

        {/* RIGHT column (portrait: center section, landscape: right) */}
        <div className="flex flex-col items-center landscape:justify-center landscape:py-4 gap-6 landscape:gap-8">
          {/* Orb */}
          <div className="relative flex items-center justify-center w-full max-h-[260px] landscape:max-h-[220px] aspect-square">
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ willChange: 'transform, opacity' }}
              className="absolute w-64 h-64 landscape:w-48 landscape:h-48 border border-primary/10 rounded-full"
            />
            <div className="absolute w-48 h-48 landscape:w-36 landscape:h-36 border border-secondary/10 rounded-full" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
              style={{ willChange: 'transform, opacity' }}
              className="relative w-40 h-40 landscape:w-32 landscape:h-32 bg-gradient-to-tr from-[#006a65] to-[#2fa7a0] rounded-full shadow-2xl shadow-[#2fa7a0]/30 flex items-center justify-center overflow-hidden"
            >
              <img
                className="w-full h-full object-cover mix-blend-overlay opacity-60"
                alt="Декоративный фон"
                loading="eager"
                decoding="async"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDO7drcpWG-UfbzgVikkY0RF0tA0Hp4jOxsW5jaW6EUzOTh_i6Fex4cfxyXKVq5uouZMCi8x0z0jR4OoZugyMtws3TfKNb1vJzH93p-KzWKa541DyKv5-QF-FiKdh2_vvXyi3zM92sKg_6sAN9Iq8ACCHSgBnk9c9ranxkkolbm075kUlgBupIz0CP9BFd-9YfD42Q9w3rW9pC1Eav7mnGUHOmDNHr2YXW7wR1JvJM_XUmgDDzKJEC1pp9sVGJVJNOiYhaz22EyI4xY"
              />
              <span
                className="absolute material-symbols-outlined text-white text-5xl landscape:text-4xl opacity-90"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                spa
              </span>
            </motion.div>
          </div>

          {/* Features — portrait only (landscape shows in left column) */}
          <div className="flex landscape:hidden flex-col space-y-4 w-full px-2">
            <Feature icon="auto_awesome" label="Гороскоп по твоему знаку" />
            <Feature icon="favorite" label="Поддержка в моменте" />
            <Feature icon="celebration" label="Поздравления с праздниками" />
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            className="w-full h-14 landscape:h-12 bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white font-headline font-bold text-lg landscape:text-base rounded-full shadow-lg shadow-[#2fa7a0]/30 transition-transform duration-150"
          >
            Начать
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
      </div>
      <span className="font-body text-on-surface font-medium">{label}</span>
    </div>
  )
}
