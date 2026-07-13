import { ChevronRight } from 'lucide-react'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  showChevron?: boolean
  disabled?: boolean
  /** Figma mobile: 46px (steps 1–2) or 52px (step 3+) */
  variant?: 'default' | 'mobileBar' | 'mobileBarCompact'
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
  const isBar = variant === 'mobileBar' || variant === 'mobileBarCompact'
  const barHeight = variant === 'mobileBarCompact' ? 'h-[40px]' : 'h-[46px]'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-[36px] bg-gradient-to-r from-[#296359] to-[#41ab99] text-white transition',
        isBar
          ? `${barHeight} w-full border-0 px-5 py-2 text-[14px] font-semibold shadow-[0_8px_8px_0_rgba(255,255,255,0.12)]`
          : 'h-[42px] min-w-[106px] border border-[#969696] px-6 py-2 text-[14px] font-semibold shadow-[0_8px_8px_0_rgba(255,255,255,0.12)]',
        disabled ? 'cursor-not-allowed opacity-70' : 'hover:brightness-110',
        className,
      ].join(' ')}
    >
      <span>{children}</span>
      {showChevron && <ChevronRight className="size-4 shrink-0" strokeWidth={2} aria-hidden />}
    </button>
  )
}
