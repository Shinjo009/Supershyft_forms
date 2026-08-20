import type { ReactNode } from 'react'
import backIcon from '../../assets/family-history/back-icon.svg'
import nextChevronIcon from '../../assets/family-history/next-chevron.svg'
import {
  MCQ_SHELL_CLASS,
  MCQ_SHELL_FOOTER_CLASS,
  MCQ_SHELL_FOOTER_INNER_CLASS,
  MCQ_SHELL_SCROLL_CLASS,
  formatNextQuestionPreview,
} from '../mcq/mcqLayout'
import { McqProgressBar } from '../mcq/McqProgressBar'
import { ANTHRO_NEXT_BUTTON_GRADIENT, ANTHRO_PROGRESS_COLOR } from './anthropometryConfig'

export function AnthropometryMcqShell({
  children,
  onBack,
  onNext,
  nextQuestionPreview,
  progressPercent,
}: {
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  nextQuestionPreview?: { line1: string; line2?: string }
  progressPercent: number
}) {
  const clampedPercent = Math.min(100, Math.max(0, progressPercent))
  const showNextPreview = Boolean(nextQuestionPreview && onNext)

  return (
    <div className={MCQ_SHELL_CLASS}>
      <header className="flex shrink-0 items-center px-4 pb-0 pt-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button type="button" onClick={onBack} className="relative size-6 shrink-0" aria-label="Back">
            <img src={backIcon} alt="" className="absolute inset-0 size-full" aria-hidden />
          </button>
          <h1 className="shrink-0 whitespace-nowrap text-[19px] tracking-[0.095px] text-white">
            Anthropometry
          </h1>
        </div>
      </header>

      <div className="flex shrink-0 flex-col gap-2 px-4 py-1">
        <div className="flex w-full items-center justify-end">
          <p className="text-right text-[11px] font-normal uppercase leading-[13.5px] tracking-[0.3px] text-[#8e8ca3]">
            {clampedPercent}% COMPLETED
          </p>
        </div>
        <McqProgressBar percent={clampedPercent} color={ANTHRO_PROGRESS_COLOR} />
      </div>

      <div className={MCQ_SHELL_SCROLL_CLASS}>{children}</div>

      {onNext ? (
        <footer className={MCQ_SHELL_FOOTER_CLASS}>
          <div className={`${MCQ_SHELL_FOOTER_INNER_CLASS}${showNextPreview ? '' : ' justify-end'}`}>
            {showNextPreview && nextQuestionPreview ? (
              <div className="min-w-0 max-w-[200px] flex-1">
                <p className="text-[10px] font-medium uppercase leading-[14px] tracking-[1.1px] text-[rgba(255,255,255,0.4)]">
                  NEXT QUESTION
                </p>
                <p className="mt-0.5 overflow-hidden whitespace-nowrap text-[13px] font-medium leading-[18px] text-[rgba(255,255,255,0.6)]">
                  {formatNextQuestionPreview(nextQuestionPreview.line1, nextQuestionPreview.line2 || '')}
                </p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onNext}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-solid border-[#969696] p-px shadow-[0_8px_32px_0_rgba(144,223,158,0.5)]"
              style={{ backgroundImage: ANTHRO_NEXT_BUTTON_GRADIENT }}
              aria-label={showNextPreview ? 'Next question' : 'Continue'}
            >
              <img src={nextChevronIcon} alt="" className="size-5" aria-hidden />
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
