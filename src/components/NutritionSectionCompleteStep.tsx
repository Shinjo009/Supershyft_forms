import tickCircleSolid from '../assets/figma/tick-circle-solid.svg'
import nutritionCarrotIcon from '../assets/figma/nutrition-carrot.svg'
import nutritionAppleIcon from '../assets/figma/nutrition-apple.svg'
import { ContinueButton } from './ContinueButton'
import { ASSESSMENT_CARD_STACK_CLASS, ASSESSMENT_CONTENT_MAX_CLASS } from './mcq/mcqLayout'

const COMPLETED_SECTIONS = ['Family History', 'Lifestyle & Habits', 'Nutrition Log'] as const

/** Figma node 6120:15346 — Nutrition section complete (without coins) */
export function NutritionSectionCompleteStep({
  onContinue,
}: {
  onContinue?: () => void
}) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="my-auto flex w-full flex-col items-center gap-11 px-6 py-10">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-6 flex size-14 items-center justify-center rounded-xl border border-[rgba(84,170,255,0.5)] p-px shadow-[0_4px_12px_0_rgba(16,185,129,0.1)]">
            <span className="flex items-center" aria-hidden>
              <img src={nutritionCarrotIcon} alt="" className="-mr-0.5 size-[19px]" />
              <img src={nutritionAppleIcon} alt="" className="size-[27px]" />
            </span>
          </div>
          <h2 className="pb-3 text-center text-[18px] font-semibold tracking-[0.2px] text-white">
            Nutrition Log Section Complete
          </h2>
        </div>

        <div className={ASSESSMENT_CARD_STACK_CLASS}>
          {COMPLETED_SECTIONS.map((title) => (
            <div
              key={title}
              className="flex w-full items-center rounded-xl border border-[rgba(218,193,90,0.5)] bg-white/5 p-4 shadow-[0_0_5px_0_rgba(218,193,90,0.2)]"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <img src={tickCircleSolid} alt="" className="size-[15px] shrink-0" aria-hidden />
                <span className="text-[14px] font-medium text-white">{title}</span>
              </div>
            </div>
          ))}
        </div>

        {onContinue ? (
          <ContinueButton
            variant="mobileBar"
            className={`!h-[52px] w-full border border-[#969696] shadow-[0_12px_20px_rgba(255,255,255,0.15)] ${ASSESSMENT_CONTENT_MAX_CLASS}`}
            showChevron={false}
            onClick={onContinue}
          >
            Continue
          </ContinueButton>
        ) : null}
      </div>
    </div>
  )
}
