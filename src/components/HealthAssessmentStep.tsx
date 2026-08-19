import { ASSESSMENT_CARD_STACK_CLASS, ASSESSMENT_SUBTITLE_CLASS } from './mcq/mcqLayout'
import assessmentRadioImg from '../assets/Ellipse 13077.svg'
import hourglassIcon from '../assets/Group.svg'
import heartRateIcon from '../assets/figma/heart-rate-assessment.svg'
import {
  categoryDescriptionForKey,
  type AssessmentCategoryStatus,
} from '../api/assessments'

function AssessmentCard({
  title,
  description,
  featured,
  onClick,
  disabled,
  loading,
}: {
  title: string
  description?: string
  featured: boolean
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}) {
  const label = loading ? 'Loading...' : title
  const featuredClass =
    'flex w-full flex-col gap-4 rounded-xl border border-[rgba(144,223,158,0.5)] bg-white/5 p-4 text-left shadow-[0_0_10px_0_rgba(144,223,158,0.5)]'
  const idleClass = 'flex w-full items-center rounded-xl bg-white/5 p-[15px] text-left'
  const className = featured ? featuredClass : idleClass

  const inner = (
    <>
      <div className="flex min-w-0 items-center gap-1.5">
        <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
        <span className="text-[14px] font-medium text-[#ccc]">{label}</span>
      </div>
      {featured && description ? (
        <p className="text-[11px] font-normal leading-normal text-[#9a9a9a]">{description}</p>
      ) : null}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${className} disabled:opacity-70`}
      >
        {inner}
      </button>
    )
  }

  return <div className={className}>{inner}</div>
}

/** Figma node 6120:15078 — Health Assessment intro (without coins) */
export function HealthAssessmentStep({
  categories,
  onStartAssessment,
  isStarting = false,
}: {
  categories: AssessmentCategoryStatus[]
  onStartAssessment?: () => void
  isStarting?: boolean
}) {
  const sections = categories.map((category, index) => {
    const key = String(category.category_key || '').trim().toLowerCase()
    return {
      id: String(category.id || category.category_id || key || index),
      title: category.display_name || category.category_key || 'Assessment',
      description: categoryDescriptionForKey(key),
      featured: index === 0,
      isFamilyHistory: key.includes('family'),
    }
  })

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
          {sections.map((section) => (
            <AssessmentCard
              key={section.id}
              title={section.title}
              description={section.featured ? section.description : undefined}
              featured={section.featured}
              onClick={section.isFamilyHistory ? onStartAssessment : undefined}
              disabled={
                section.isFamilyHistory && (isStarting || categories.length === 0)
              }
              loading={section.isFamilyHistory && isStarting}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
