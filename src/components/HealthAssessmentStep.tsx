import { ContinueButton } from './ContinueButton'
import { ASSESSMENT_CARD_STACK_CLASS, ASSESSMENT_SUBTITLE_CLASS } from './mcq/mcqLayout'
import assessmentRadioImg from '../assets/Ellipse 13077.svg'
import hourglassIcon from '../assets/Group.svg'
import heartRateIcon from '../assets/figma/heart-rate-assessment.svg'

const ASSESSMENT_SECTIONS = [
  {
    id: 'family',
    title: 'Family History',
    description:
      "Knowing your family's health patterns helps us predict risks more accurately.",
    featured: true,
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Habits',
    featured: false,
  },
  {
    id: 'nutrition',
    title: 'Nutrition Log',
    featured: false,
  },
] as const

function AssessmentCard({
  title,
  description,
  featured,
}: {
  title: string
  description?: string
  featured: boolean
}) {
  if (featured) {
    return (
      <div className="flex w-full flex-col gap-4 rounded-xl border border-[rgba(144,223,158,0.5)] bg-white/5 p-4 shadow-[0_0_10px_0_rgba(144,223,158,0.5)]">
        <div className="flex items-center gap-1.5">
          <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
          <span className="text-[14px] font-medium text-[#ccc]">{title}</span>
        </div>
        {description ? (
          <p className="text-[11px] font-normal leading-normal text-[#9a9a9a]">{description}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex w-full items-center rounded-xl bg-white/5 p-[15px]">
      <div className="flex min-w-0 items-center gap-1.5">
        <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
        <span className="text-[14px] font-medium text-[#ccc]">{title}</span>
      </div>
    </div>
  )
}

/** Figma node 6120:15078 — Health Assessment intro (without coins) */
export function HealthAssessmentStep({
  onStartAssessment,
}: {
  onStartAssessment?: () => void
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="h-[74px] shrink-0" aria-hidden />

      <div className="flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto px-6 pb-6 pt-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-full flex-col items-center">
          <div className="mb-6 flex size-14 items-center justify-center rounded-xl border border-[rgba(222,144,223,0.5)] p-px shadow-[0_4px_12px_0_rgba(16,185,129,0.1)]">
            <img src={heartRateIcon} alt="" className="size-7" aria-hidden />
          </div>

          <div className="flex w-full flex-col items-center pb-3">
            <h2 className="text-center text-[18px] font-semibold tracking-[0.2px] text-white">
              Health Assessment
            </h2>
            <p className={ASSESSMENT_SUBTITLE_CLASS}>
              Help our Bio-AI create a more personalized view of your lifestyle and health risks.
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <img src={hourglassIcon} alt="" className="h-[11px] w-2.5" aria-hidden />
            <span className="text-[12px] text-[#90df9e]">Takes only 4 mins</span>
          </div>
        </div>

        <div className={ASSESSMENT_CARD_STACK_CLASS}>
          {ASSESSMENT_SECTIONS.map((section) => (
            <AssessmentCard
              key={section.id}
              title={section.title}
              description={'description' in section ? section.description : undefined}
              featured={section.featured}
            />
          ))}
        </div>

        <ContinueButton
          variant="mobileBar"
          className="mt-auto !h-[52px] w-full border border-[#969696] shadow-[0_12px_20px_rgba(255,255,255,0.15)] lg:mx-auto lg:max-w-[400px]"
          showChevron={false}
          onClick={onStartAssessment}
        >
          Start Assessment
        </ContinueButton>
      </div>
    </div>
  )
}
