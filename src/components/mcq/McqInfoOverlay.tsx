import { useEffect } from 'react'
import type { McqInfoItem, McqInfoTheme } from './mcqInfoTypes'
import { GLOW_CLASS_BY_THEME, SEPARATOR_BY_THEME, TEXT_CLASS_BY_THEME } from './mcqInfoTypes'
import { MCQ_INFO_CARD_CLASS } from './mcqLayout'

export type { McqInfoItem, McqInfoTheme }

/** Figma 5725:14796 / 5725:14901 / 5725:14992 — Key Insight info card */
export function McqInfoOverlay({
  open,
  items,
  theme,
  onClose,
}: {
  open: boolean
  items: McqInfoItem[]
  theme: McqInfoTheme
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[5px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={MCQ_INFO_CARD_CLASS}
        role="dialog"
        aria-modal="true"
        aria-label="Question information"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`pointer-events-none absolute -right-10 -top-10 h-[131px] w-[136px] rounded-[60px] blur-[50px] ${GLOW_CLASS_BY_THEME[theme]}`}
          aria-hidden
        />

        <ul
          className={`relative flex flex-col gap-2 text-[12px] font-light leading-[15px] ${TEXT_CLASS_BY_THEME[theme]}`}
        >
          {items.map((item) => (
            <li key={item.term} className="list-disc ms-[18px]">
              <span>
                {item.term}
                {SEPARATOR_BY_THEME[theme]}
                {item.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
