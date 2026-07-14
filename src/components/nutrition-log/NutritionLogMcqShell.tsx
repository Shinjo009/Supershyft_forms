import type { ReactNode } from 'react'
import backIcon from '../../assets/nutrition-log/back-icon.svg'
import nextChevronIcon from '../../assets/nutrition-log/next-chevron.svg'
import progressFillImg from '../../assets/nutrition-log/progress-fill.svg'
import progressTrackImg from '../../assets/nutrition-log/progress-track.svg'
import type { NutritionQuestionPreview } from '../../data/nutritionLogQuestions'
import {
  MCQ_SHELL_CLASS,
  MCQ_SHELL_FOOTER_INNER_CLASS,
  MCQ_SHELL_SCROLL_CLASS,
  formatNextQuestionPreview,
} from '../mcq/mcqLayout'
import { NUTRITION_NEXT_BUTTON_GRADIENT } from './nutritionLogConfig'

/** Shared Nutrition Log MCQ chrome — Figma 5627:12757 */
export function NutritionLogMcqShell({
  children,
  onBack,
  onNext,
  nextQuestionPreview,
  progressPercent = 7,
}: {
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  nextQuestionPreview: NutritionQuestionPreview
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
            Nutrition Log
          </h1>
        </div>
      </header>

      <div className="flex shrink-0 flex-col gap-2 px-4 py-1">
        <div className="flex w-full items-center justify-end">
          <p className="text-right text-[11px] font-normal uppercase tracking-[0.3px] text-[#8e8ca3] leading-[13.5px]">
            {clampedPercent}% COMPLETED
          </p>
        </div>
        <div className="relative h-6 w-full">
          <div className="absolute inset-x-0 top-0">
            <img src={progressTrackImg} alt="" className="block h-px w-full max-w-none" aria-hidden />
          </div>
          <div
            className="absolute left-px top-[-1px] transition-[width] duration-300 ease-out"
            style={{ width: `${clampedPercent}%` }}
          >
            <div className="absolute inset-[-11px_-6.22%_-13px_-6.22%]">
              <img src={progressFillImg} alt="" className="block size-full max-w-none" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      <div className={MCQ_SHELL_SCROLL_CLASS}>{children}</div>

      <footer className="fixed inset-x-0 bottom-0 z-10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[25px]">
        <div className={MCQ_SHELL_FOOTER_INNER_CLASS}>
          <div className="min-w-0 max-w-[200px] flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[1.1px] leading-[16.5px] text-[rgba(255,255,255,0.4)]">
              NEXT QUESTION
            </p>
            <p className="mt-1 overflow-hidden whitespace-nowrap text-[14px] font-medium leading-5 text-[rgba(255,255,255,0.6)]">
              {formatNextQuestionPreview(nextQuestionPreview.line1, nextQuestionPreview.line2)}
            </p>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="flex size-[50px] shrink-0 items-center justify-center rounded-full border border-solid border-[#969696] p-px shadow-[0_8px_32px_0_rgba(79,172,254,0.2)]"
            style={{ backgroundImage: NUTRITION_NEXT_BUTTON_GRADIENT }}
            aria-label="Next question"
          >
            <img src={nextChevronIcon} alt="" className="size-6" aria-hidden />
          </button>
        </div>
      </footer>
    </div>
  )
}
