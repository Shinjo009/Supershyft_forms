import type { ReactNode } from 'react'
import backIcon from '../../assets/lifestyle-habits/back-icon.svg'
import nextChevronIcon from '../../assets/lifestyle-habits/next-chevron.svg'
import type { LifestyleQuestionPreview } from '../../data/lifestyleHabitsQuestions'
import {
  MCQ_SHELL_CLASS,
  MCQ_SHELL_FOOTER_INNER_CLASS,
  MCQ_SHELL_SCROLL_CLASS,
  formatNextQuestionPreview,
} from '../mcq/mcqLayout'
import { McqProgressBar } from '../mcq/McqProgressBar'

const NEXT_BUTTON_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(2.5 0 0 2.5 25 25)'><stop stop-color='rgba(255,136,0,1)' offset='0'/><stop stop-color='rgba(233,93,92,1)' offset='1'/></radialGradient></defs></svg>\")"

/** Shared Lifestyle & Habits MCQ chrome — Figma 5629:14250 */
export function LifestyleHabitsMcqShell({
  children,
  onBack,
  onNext,
  nextQuestionPreview,
  progressPercent = 10,
}: {
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  nextQuestionPreview: LifestyleQuestionPreview
  progressPercent?: number
}) {
  const clampedPercent = Math.min(100, Math.max(0, progressPercent))

  return (
    <div className={MCQ_SHELL_CLASS}>
      <header className="flex shrink-0 items-center px-4 pb-0 pt-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="relative size-6 shrink-0"
            aria-label="Back"
          >
            <img src={backIcon} alt="" className="absolute inset-0 size-full" aria-hidden />
          </button>
          <h1 className="shrink-0 whitespace-nowrap text-[19px] tracking-[0.095px] text-white">
            Lifestyle & Habits
          </h1>
        </div>
      </header>

      <div className="flex shrink-0 flex-col gap-2 px-4 py-1">
        <div className="flex w-full items-center justify-end">
          <p className="text-right text-[11px] font-normal uppercase tracking-[0.3px] text-[#8e8ca3] leading-[13.5px]">
            {clampedPercent}% COMPLETED
          </p>
        </div>
        <McqProgressBar percent={clampedPercent} color="#FF8800" />
      </div>

      <div className={MCQ_SHELL_SCROLL_CLASS}>{children}</div>

      <footer className="fixed inset-x-0 bottom-0 z-10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[25px]">
        <div className={MCQ_SHELL_FOOTER_INNER_CLASS}>
          <div className="min-w-0 max-w-[200px] flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[1.1px] leading-[14px] text-[rgba(255,255,255,0.4)]">
              NEXT QUESTION
            </p>
            <p className="mt-0.5 overflow-hidden whitespace-nowrap text-[13px] font-medium leading-[18px] text-[rgba(255,255,255,0.6)]">
              {formatNextQuestionPreview(nextQuestionPreview.line1, nextQuestionPreview.line2)}
            </p>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-solid border-[#969696] p-px shadow-[0_8px_32px_0_rgba(255,136,0,0.25)]"
            style={{ backgroundImage: NEXT_BUTTON_GRADIENT }}
            aria-label="Next question"
          >
            <img src={nextChevronIcon} alt="" className="size-5" aria-hidden />
          </button>
        </div>
      </footer>
    </div>
  )
}
