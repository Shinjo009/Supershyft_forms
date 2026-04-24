import { ChevronRight } from 'lucide-react'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  showChevron?: boolean
  disabled?: boolean
  /** Figma mobile primary bar: full width, 52px, 16px bold */
  variant?: 'default' | 'mobileBar'
}

export function ContinueButton({
  children,
  onClick,
  type = 'button',
  className = '',
  showChevron = true,
  disabled = false,
  variant = 'default',
}: Props) {
  const isBar = variant === 'mobileBar'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-[36px] border border-[#a7a7a7] bg-gradient-to-r from-[#296359] to-[#41ab99] text-white shadow-[0_10px_18px_0_rgba(255,255,255,0.14)] transition',
        isBar
          ? 'h-[52px] w-full px-6 py-2.5 text-base font-bold'
          : 'h-[42px] min-w-[106px] px-6 py-2 text-[14px] font-semibold',
        disabled ? 'cursor-not-allowed opacity-70' : 'hover:brightness-110',
        className,
      ].join(' ')}
    >
      <span>{children}</span>
      {showChevron && <ChevronRight className="size-[16px] shrink-0" aria-hidden />}
    </button>
  )
}
