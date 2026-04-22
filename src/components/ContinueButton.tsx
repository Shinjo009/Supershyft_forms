import { ChevronRight } from 'lucide-react'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  showChevron?: boolean
  /** Figma mobile primary bar: full width, 52px, 16px bold */
  variant?: 'default' | 'mobileBar'
}

export function ContinueButton({
  children,
  onClick,
  type = 'button',
  className = '',
  showChevron = true,
  variant = 'default',
}: Props) {
  const isBar = variant === 'mobileBar'
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-[36px] border border-[#969696] bg-gradient-to-r from-[#296359] to-[#41ab99] text-white shadow-[0_12px_20px_0_rgba(255,255,255,0.15)] transition hover:brightness-110',
        isBar
          ? 'h-[52px] w-full px-6 py-2.5 text-base font-bold'
          : 'h-[50px] min-w-[155px] px-6 py-2.5 text-[15px] font-bold',
        className,
      ].join(' ')}
    >
      <span>{children}</span>
      {showChevron && <ChevronRight className="size-[18px] shrink-0" aria-hidden />}
    </button>
  )
}
