import tickCircleSolid from '../assets/figma/tick-circle-solid.svg'
import lifestyleSectionIcon from '../assets/figma/lifestyle-section-icon.svg'
import assessmentRadioImg from '../assets/Ellipse 13077.svg'
import { ASSESSMENT_CARD_STACK_CLASS } from './mcq/mcqLayout'

/** Figma node 6120:15224 — Lifestyle section complete (without coins) */
export function LifestyleSectionCompleteStep({
  onStartNutrition,
}: {
  onStartNutrition?: () => void
}) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="my-auto flex w-full flex-col items-center gap-11 px-6 py-10">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-6 flex size-14 items-center justify-center rounded-xl border border-[rgba(246,167,33,0.5)] p-px shadow-[0_4px_12px_0_rgba(16,185,129,0.1)]">
            <img src={lifestyleSectionIcon} alt="" className="size-[30px]" aria-hidden />
          </div>
          <div className="flex flex-col items-center pb-3">
            <h2 className="text-center text-[18px] font-semibold tracking-[0.2px] text-white">
              Lifestyle & Habits Section Complete
            </h2>
            <p className="text-center text-[12px] leading-4 text-[#9a9a9a]">
              Only 1 more section left
            </p>
          </div>
        </div>

        <div className={ASSESSMENT_CARD_STACK_CLASS}>
          <div className="flex w-full items-center rounded-xl border border-[rgba(218,193,90,0.5)] bg-white/5 p-4 shadow-[0_0_5px_0_rgba(218,193,90,0.2)]">
            <div className="flex min-w-0 items-center gap-1.5">
              <img src={tickCircleSolid} alt="" className="size-[15px] shrink-0" aria-hidden />
              <span className="text-[14px] font-medium text-white">Family History</span>
            </div>
          </div>

          <div className="flex w-full items-center rounded-xl border border-[rgba(218,193,90,0.5)] bg-white/5 p-4 shadow-[0_0_5px_0_rgba(218,193,90,0.2)]">
            <div className="flex min-w-0 items-center gap-1.5">
              <img src={tickCircleSolid} alt="" className="size-[15px] shrink-0" aria-hidden />
              <span className="text-[14px] font-medium text-white">Lifestyle & Habits</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartNutrition}
            className="flex w-full flex-col gap-4 rounded-xl border border-[rgba(144,223,158,0.5)] bg-white/5 p-4 text-left shadow-[0_0_10px_0_rgba(144,223,158,0.5)]"
          >
            <div className="flex items-center gap-1.5">
              <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
              <span className="text-[14px] font-medium text-[#ccc]">Nutrition Log</span>
            </div>
            <p className="text-[11px] font-normal leading-normal text-[#9a9a9a]">
              Knowing your family&apos;s health patterns helps us predict risks more accurately.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
