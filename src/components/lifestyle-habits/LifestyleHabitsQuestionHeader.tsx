import type { ReactNode } from 'react'
import infoIcon from '../../assets/family-history/info-icon.svg'

/** Figma 5629:14282 — question counter with clickable info icon */
export function LifestyleHabitsQuestionHeader({
  questionLabel,
  onInfoClick,
  children,
  titleClassName = 'mt-2 text-[16px] leading-normal tracking-[0.08px] text-white',
}: {
  questionLabel: string
  onInfoClick?: () => void
  children: ReactNode
  titleClassName?: string
}) {
  return (
    <div className="relative w-full">
      <p className="text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.4)]">
        {questionLabel}
      </p>
      <div className={titleClassName}>{children}</div>
      {onInfoClick ? (
        <button
          type="button"
          onClick={onInfoClick}
          className="absolute right-0 top-[3px] size-[14px]"
          aria-label="Show question information"
        >
          <img src={infoIcon} alt="" className="size-full" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
