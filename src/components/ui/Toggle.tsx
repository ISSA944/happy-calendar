import { motion } from 'framer-motion'

interface ToggleProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  'aria-label'?: string
}

/**
 * Единый премиальный тумблер (iOS-стиль): крупный трек, белый бегунок с тенью,
 * плавная пружинная анимация. Используется везде (уведомления, настройки),
 * чтобы стиль был консистентным. ON — брендовый primary, OFF — светлый нейтральный
 * с хорошим контрастом на белых карточках.
 */
export function Toggle({ checked, onChange, disabled, 'aria-label': ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      disabled={disabled}
      className={`relative w-[52px] h-[31px] rounded-full flex-shrink-0 transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${checked ? 'bg-primary' : 'bg-black/[0.14]'}`}
    >
      <motion.span
        className="absolute top-[3px] left-[3px] w-[25px] h-[25px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
        animate={{ x: checked ? 21 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  )
}
