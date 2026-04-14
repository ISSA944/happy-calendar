import { NavLink } from 'react-router-dom'

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[390px] z-50 rounded-t-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)] border-t border-stone-100 dark:border-stone-800">
      <div className="flex justify-around items-center px-4 pt-3 pb-[env(safe-area-inset-bottom,24px)]">
        {/* Home */}
        <NavLink 
          to="/home"
          className={({ isActive }) => `flex-1 flex flex-col items-center justify-center rounded-2xl px-2 py-2 active:scale-90 transition-all duration-300 ease-out ${
            isActive 
              ? 'bg-[#2fa7a0]/10 text-[#006a65]' 
              : 'text-stone-400 hover:text-[#006a65]'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="font-label text-[11px] font-medium mt-1">Домой</span>
        </NavLink>

        {/* Bookmarks */}
        <NavLink 
          to="/bookmarks"
          className={({ isActive }) => `flex-1 flex flex-col items-center justify-center rounded-2xl px-2 py-2 active:scale-90 transition-all duration-300 ease-out ${
            isActive 
              ? 'bg-[#2fa7a0]/10 text-[#006a65]' 
              : 'text-stone-400 hover:text-[#006a65]'
          }`}
        >
          <span className="material-symbols-outlined">bookmark</span>
          <span className="font-label text-[11px] font-medium mt-1">Закладки</span>
        </NavLink>

        {/* Settings */}
        <NavLink 
          to="/settings"
          className={({ isActive }) => `flex-1 flex flex-col items-center justify-center rounded-2xl px-2 py-2 active:scale-90 transition-all duration-300 ease-out ${
            isActive 
              ? 'bg-[#2fa7a0]/10 text-[#006a65]' 
              : 'text-stone-400 hover:text-[#006a65]'
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label text-[11px] font-medium mt-1">Настройки</span>
        </NavLink>
      </div>
    </nav>
  )
}
