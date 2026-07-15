import type { ReactNode } from 'react'
import backIcon from '../../assets/family-history/back-icon.svg'
import nextChevronIcon from '../../assets/family-history/next-chevron.svg'
import type { FamilyHistoryQuestionPreview } from '../../data/familyHistoryQuestions'
import {
  MCQ_SHELL_CLASS,
  MCQ_SHELL_FOOTER_INNER_CLASS,
  MCQ_SHELL_SCROLL_CLASS,
  formatNextQuestionPreview,
} from '../mcq/mcqLayout'
import { McqProgressBar } from '../mcq/McqProgressBar'

const NEXT_BUTTON_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(2.5 0 0 2.5 25 25)'><stop stop-color='rgba(164,86,234,1)' offset='0'/><stop stop-color='rgba(134,69,194,1)' offset='0.25'/><stop stop-color='rgba(103,52,153,1)' offset='0.5'/><stop stop-color='rgba(73,35,113,1)' offset='0.75'/><stop stop-color='rgba(42,18,72,1)' offset='1'/></radialGradient></defs></svg>\")"

/** Shared Family History MCQ chrome — Figma nodes 5706:16633, 5629:15433 */
export function FamilyHistoryMcqShell({
  children,
  onBack,
  onNext,
  nextQuestionPreview,
  progressPercent = 25,
}: {
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  nextQuestionPreview: FamilyHistoryQuestionPreview
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
            Family History
          </h1>
        </div>
      </header>

      <div className="flex shrink-0 flex-col gap-2 px-4 py-1">
        <div className="flex w-full items-center justify-end">
          <p className="text-right text-[11px] font-normal uppercase tracking-[0.3px] text-[#8e8ca3] leading-[13.5px]">
            {clampedPercent}% COMPLETED
          </p>
        </div>
        <McqProgressBar percent={clampedPercent} color="#9D50BB" />
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
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-solid border-[#969696] p-px shadow-[0_8px_32px_0_rgba(164,86,234,0.25)]"
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

export const CHIP_SELECTED_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 155 32' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(7.75 0 0 1.6 77.5 16)'><stop stop-color='rgba(164,86,234,1)' offset='0'/><stop stop-color='rgba(134,69,194,1)' offset='0.25'/><stop stop-color='rgba(103,52,153,1)' offset='0.5'/><stop stop-color='rgba(73,35,113,1)' offset='0.75'/><stop stop-color='rgba(42,18,72,1)' offset='1'/></radialGradient></defs></svg>\")"
