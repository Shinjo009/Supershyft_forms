import tickCircleSolid from '../assets/figma/tick-circle-solid.svg'
import familySectionIcon from '../assets/figma/family-section-icon.svg'
import assessmentRadioImg from '../assets/Ellipse 13077.svg'
import { ASSESSMENT_CARD_STACK_CLASS } from './mcq/mcqLayout'

/** Figma node 6120:15168 — Family History section complete (without coins) */
export function FamilySectionCompleteStep({
  onStartLifestyle,
}: {
  onStartLifestyle?: () => void
}) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="my-auto flex w-full flex-col items-center gap-11 px-6 py-10">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-6 flex size-14 items-center justify-center rounded-xl border border-[rgba(182,108,242,0.5)] p-px shadow-[0_4px_12px_0_rgba(16,185,129,0.1)]">
            <img src={familySectionIcon} alt="" className="size-7" aria-hidden />
          </div>
          <div className="flex flex-col items-center pb-3">
            <h2 className="text-center text-[18px] font-semibold tracking-[0.2px] text-white">
              Family Section Complete!
            </h2>
            <p className="text-center text-[12px] leading-4 text-[#9a9a9a]">
              Only 2 more sections left
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

          <button
            type="button"
            onClick={onStartLifestyle}
            className="flex w-full flex-col gap-4 rounded-xl border border-[rgba(144,223,158,0.5)] bg-white/5 p-4 text-left shadow-[0_0_10px_0_rgba(144,223,158,0.5)]"
          >
            <div className="flex items-center gap-1.5">
              <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
              <span className="text-[14px] font-medium text-[#ccc]">Lifestyle & Habits</span>
            </div>
            <p className="text-[11px] font-normal leading-normal text-[#c4c4c4]">
              Your routines help our system decode how your habits influence your health.
            </p>
          </button>

          <div className="flex w-full items-center rounded-xl bg-white/5 p-[15px]">
            <div className="flex min-w-0 items-center gap-1.5">
              <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
              <span className="text-[14px] font-medium text-[#ccc]">Nutrition Log</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
