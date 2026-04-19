import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

export function BottomNav() {
  const tabClass = (isActive: boolean) =>
    `flex-1 flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition-colors duration-150 ${
      isActive ? 'bg-[#2fa7a0]/10 text-[#006a65]' : 'text-stone-400 hover:text-[#006a65]'
    }`

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] z-50 bg-white">
      {/* Rounded top edge with shadow — visually the "card" */}
      <div className="rounded-t-[2rem] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] border-t border-stone-100/80">
        <div className="flex justify-around items-center px-4 pt-3 pb-3">
          {/* Home */}
          <NavLink to="/home" className={({ isActive }) => tabClass(isActive)}>
            <motion.span whileTap={{ scale: 0.92 }} className="flex flex-col items-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              <span className="font-label text-[11px] font-medium mt-1">Домой</span>
            </motion.span>
          </NavLink>

          {/* Bookmarks */}
          <NavLink to="/bookmarks" className={({ isActive }) => tabClass(isActive)}>
            <motion.span whileTap={{ scale: 0.92 }} className="flex flex-col items-center">
              <span className="material-symbols-outlined">bookmark</span>
              <span className="font-label text-[11px] font-medium mt-1">Закладки</span>
            </motion.span>
          </NavLink>

          {/* Settings */}
          <NavLink to="/settings" className={({ isActive }) => tabClass(isActive)}>
            <motion.span whileTap={{ scale: 0.92 }} className="flex flex-col items-center">
              <span className="material-symbols-outlined">settings</span>
              <span className="font-label text-[11px] font-medium mt-1">Настройки</span>
            </motion.span>
          </NavLink>
        </div>
      </div>
      {/* Safe-area fill — same bg, no content, covers home indicator zone */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  )
}
