import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      style={{
        willChange: 'opacity',
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
      className="relative h-[100dvh] w-full max-w-[430px] mx-auto overflow-x-hidden overflow-y-auto flex flex-col justify-between px-8 overscroll-none scroll-smooth"
    >
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1 }}
          className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary-container abstract-blob"
        ></motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute bottom-[20%] left-[-20%] w-[250px] h-[250px] rounded-full bg-secondary-container abstract-blob"
        ></motion.div>
      </div>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 pt-12 text-center"
      >
        <h1 className="font-headline font-extrabold text-4xl leading-tight text-on-surface tracking-tight mb-4">
          Здесь можно выдохнуть
        </h1>
        <p className="font-body text-on-surface-variant text-lg leading-relaxed px-2">
          Персональный гороскоп дня и поддержка по настроению. Нежно, без давления.
        </p>
      </motion.div>

      {/* Central Orb */}
      <div className="relative z-10 flex flex-col items-center justify-center py-6">
        <div className="relative w-full max-h-[280px] aspect-square flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-64 h-64 border border-primary/10 rounded-full"
          ></motion.div>
          <div className="absolute w-48 h-48 border border-secondary/10 rounded-full"></div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
            className="relative w-40 h-40 bg-gradient-to-tr from-[#006a65] to-[#2fa7a0] rounded-full shadow-2xl shadow-[#2fa7a0]/30 flex items-center justify-center overflow-hidden"
          >
            <img 
              className="w-full h-full object-cover mix-blend-overlay opacity-60" 
              data-alt="Abstract soft green botanical shapes against warm background" 
              loading="lazy"
              decoding="async"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDO7drcpWG-UfbzgVikkY0RF0tA0Hp4jOxsW5jaW6EUzOTh_i6Fex4cfxyXKVq5uouZMCi8x0z0jR4OoZugyMtws3TfKNb1vJzH93p-KzWKa541DyKv5-QF-FiKdh2_vvXyi3zM92sKg_6sAN9Iq8ACCHSgBnk9c9ranxkkolbm075kUlgBupIz0CP9BFd-9YfD42Q9w3rW9pC1Eav7mnGUHOmDNHr2YXW7wR1JvJM_XUmgDDzKJEC1pp9sVGJVJNOiYhaz22EyI4xY"
            />
            <span 
              className="absolute material-symbols-outlined text-white text-5xl opacity-90" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              spa
            </span>
          </motion.div>
        </div>
      </div>

      {/* Features & CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 flex flex-col space-y-8 pb-4"
      >
        <div className="space-y-4 px-2">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
            </div>
            <span className="font-body text-on-surface font-medium">Гороскоп по твоему знаку</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">favorite</span>
            </div>
            <span className="font-body text-on-surface font-medium">Поддержка в моменте</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">celebration</span>
            </div>
            <span className="font-body text-on-surface font-medium">Поздравления с праздниками</span>
          </div>
        </div>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/register')}
          className="w-full h-14 bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white font-headline font-bold text-lg rounded-full shadow-lg shadow-[#2fa7a0]/30 transition-transform duration-150"
        >
          Начать
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

