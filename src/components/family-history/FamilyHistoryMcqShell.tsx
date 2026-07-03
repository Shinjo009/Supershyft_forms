import type { ReactNode } from 'react'
import backIcon from '../../assets/family-history/back-icon.svg'
import coinBadgeImg from '../../assets/family-history/coin-badge.png'
import nextChevronIcon from '../../assets/family-history/next-chevron.svg'
import progressFillImg from '../../assets/family-history/progress-fill.svg'
import progressTrackImg from '../../assets/family-history/progress-track.svg'
import type { FamilyHistoryQuestionPreview } from '../../data/familyHistoryQuestions'

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
    <div className="relative mx-auto flex min-h-svh w-full max-w-[360px] flex-col pb-[108px]">
      <header className="flex shrink-0 items-center justify-between px-4 pb-0 pt-10">
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
        <div className="flex shrink-0 items-center gap-0.5">
          <span className="text-right text-[14px] font-light uppercase leading-5 text-[#9a9a9a]">
            +50{' '}
          </span>
          <div className="relative h-[23px] w-[25px] shrink-0 overflow-hidden">
            <img
              src={coinBadgeImg}
              alt=""
              className="absolute max-w-none"
              style={{
                height: '266.02%',
                width: '246.85%',
                left: '-13.51%',
                top: '-16.5%',
              }}
              aria-hidden
            />
          </div>
        </div>
      </header>

      <div className="flex shrink-0 flex-col gap-[12px] px-4 py-2">
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

      <div className="mt-8 min-h-0 flex-1 overflow-y-auto px-[17px]">{children}</div>

      <footer className="fixed inset-x-0 bottom-0 z-10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[25px]">
        <div className="mx-auto flex w-full max-w-[360px] items-center justify-between px-6 py-6">
          <div className="h-[60px] w-[180px] max-w-[180px] shrink-0">
            <p className="text-[11px] font-medium uppercase tracking-[1.1px] leading-[16.5px] text-[rgba(255,255,255,0.4)]">
              NEXT QUESTION
            </p>
            <div className="mt-5 h-10 overflow-hidden text-[14px] font-medium leading-[19.25px] text-[rgba(255,255,255,0.6)]">
              <p className="mb-0">{nextQuestionPreview.line1}</p>
              <p>{nextQuestionPreview.line2}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="flex size-[50px] shrink-0 items-center justify-center rounded-full border border-solid border-[#969696] p-px shadow-[0_8px_32px_0_rgba(164,86,234,0.25)]"
            style={{ backgroundImage: NEXT_BUTTON_GRADIENT }}
            aria-label="Next question"
          >
            <img src={nextChevronIcon} alt="" className="size-6" aria-hidden />
          </button>
        </div>
      </footer>
    </div>
  )
}

export const CHIP_SELECTED_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 155 32' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(7.75 0 0 1.6 77.5 16)'><stop stop-color='rgba(164,86,234,1)' offset='0'/><stop stop-color='rgba(134,69,194,1)' offset='0.25'/><stop stop-color='rgba(103,52,153,1)' offset='0.5'/><stop stop-color='rgba(73,35,113,1)' offset='0.75'/><stop stop-color='rgba(42,18,72,1)' offset='1'/></radialGradient></defs></svg>\")"
