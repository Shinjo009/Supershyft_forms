import tickCircleSolid from '../assets/figma/tick-circle-solid.svg'
import familySectionIcon from '../assets/figma/family-section-icon.svg'
import lifestyleSectionIcon from '../assets/figma/lifestyle-section-icon.svg'
import nutritionCarrotIcon from '../assets/figma/nutrition-carrot.svg'
import nutritionAppleIcon from '../assets/figma/nutrition-apple.svg'
import assessmentRadioImg from '../assets/Ellipse 13077.svg'
import {
  categoryDescriptionForKey,
  isCategoryCompleted,
  normalizeCategoryKey,
  type AssessmentCategoryStatus,
} from '../api/assessments'
import { ContinueButton } from './ContinueButton'
import { ASSESSMENT_CARD_STACK_CLASS, ASSESSMENT_CONTENT_MAX_CLASS } from './mcq/mcqLayout'

export type SectionCompleteVariant = 'family' | 'lifestyle' | 'nutrition'

const VARIANT_COPY: Record<
  SectionCompleteVariant,
  { title: string; subtitle?: string; iconBorder: string }
> = {
  family: {
    title: 'Family Section Complete!',
    subtitle: 'Only 2 more sections left',
    iconBorder: 'border-[rgba(182,108,242,0.5)]',
  },
  lifestyle: {
    title: 'Lifestyle Section Complete!',
    subtitle: 'Only 1 more section left',
    iconBorder: 'border-[rgba(246,167,33,0.5)]',
  },
  nutrition: {
    title: 'Nutrition Section Complete!',
    iconBorder: 'border-[rgba(84,170,255,0.5)]',
  },
}

function SectionIcon({ variant }: { variant: SectionCompleteVariant }) {
  if (variant === 'lifestyle') {
    return <img src={lifestyleSectionIcon} alt="" className="size-[30px]" aria-hidden />
  }
  if (variant === 'nutrition') {
    return (
      <span className="flex items-center" aria-hidden>
        <img src={nutritionCarrotIcon} alt="" className="-mr-0.5 size-[19px]" />
        <img src={nutritionAppleIcon} alt="" className="size-[27px]" />
      </span>
    )
  }
  return <img src={familySectionIcon} alt="" className="size-7" aria-hidden />
}

/** Shared section-complete hub — categories come from /assessments/{id}/status */
export function SectionCompleteHub({
  variant,
  categories,
  completedCategoryIds,
  onSelectCategory,
  onContinue,
  isLoadingCategoryId,
  isContinuing = false,
}: {
  variant: SectionCompleteVariant
  categories: AssessmentCategoryStatus[]
  completedCategoryIds: number[]
  onSelectCategory: (category: AssessmentCategoryStatus) => void
  onContinue?: () => void
  isLoadingCategoryId?: number | null
  isContinuing?: boolean
}) {
  const copy = VARIANT_COPY[variant]
  const remaining = categories.filter(
    (category) => !isCategoryCompleted(category, completedCategoryIds),
  ).length
  const nextIncompleteId = categories.find(
    (category) => !isCategoryCompleted(category, completedCategoryIds),
  )?.category_id
  const allComplete = remaining === 0

  return (
    <div className="flex min-h-full w-full flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="my-auto flex w-full flex-col items-center gap-11 px-6 py-10">
        <div className="flex flex-col items-center gap-2">
          <div
            className={`mb-6 flex size-14 items-center justify-center rounded-xl border p-px shadow-[0_4px_12px_0_rgba(16,185,129,0.1)] ${copy.iconBorder}`}
          >
            <SectionIcon variant={variant} />
          </div>
          <div className="flex flex-col items-center pb-3">
            <h2 className="text-center text-[18px] font-semibold tracking-[0.2px] text-white">
              {copy.title}
            </h2>
            {copy.subtitle && !allComplete ? (
              <p className="text-center text-[12px] leading-4 text-[#9a9a9a]">
                {remaining === 1 ? 'Only 1 more section left' : `Only ${remaining} more sections left`}
              </p>
            ) : null}
          </div>
        </div>

        <div className={ASSESSMENT_CARD_STACK_CLASS}>
          {categories.map((category) => {
            const completed = isCategoryCompleted(category, completedCategoryIds)
            const featured = !completed && category.category_id === nextIncompleteId
            const description = categoryDescriptionForKey(normalizeCategoryKey(category.category_key))
            const loading = isLoadingCategoryId === category.category_id

            if (completed) {
              return (
                <div
                  key={category.category_id}
                  className="flex w-full items-center rounded-xl border border-[rgba(218,193,90,0.5)] bg-white/5 p-4 shadow-[0_0_5px_0_rgba(218,193,90,0.2)]"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <img src={tickCircleSolid} alt="" className="size-[15px] shrink-0" aria-hidden />
                    <span className="text-[14px] font-medium text-white">
                      {category.display_name || category.category_key}
                    </span>
                  </div>
                </div>
              )
            }

            return (
              <button
                key={category.category_id}
                type="button"
                disabled={loading || Boolean(isLoadingCategoryId)}
                onClick={() => onSelectCategory(category)}
                className={
                  featured
                    ? 'flex w-full flex-col gap-4 rounded-xl border border-[rgba(144,223,158,0.5)] bg-white/5 p-4 text-left shadow-[0_0_10px_0_rgba(144,223,158,0.5)] disabled:opacity-70'
                    : 'flex w-full items-center rounded-xl bg-white/5 p-[15px] text-left disabled:opacity-70'
                }
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <img src={assessmentRadioImg} alt="" className="size-[15px] shrink-0" aria-hidden />
                  <span className="text-[14px] font-medium text-[#ccc]">
                    {loading
                      ? 'Loading...'
                      : category.display_name || category.category_key}
                  </span>
                </div>
                {featured && description ? (
                  <p className="text-[11px] font-normal leading-normal text-[#c4c4c4]">{description}</p>
                ) : null}
              </button>
            )
          })}
        </div>

        {allComplete && onContinue ? (
          <ContinueButton
            variant="mobileBar"
            className={`!h-[52px] w-full border border-[#969696] shadow-[0_12px_20px_rgba(255,255,255,0.15)] ${ASSESSMENT_CONTENT_MAX_CLASS}`}
            showChevron={false}
            disabled={isContinuing}
            onClick={onContinue}
          >
            {isContinuing ? 'Submitting...' : 'Continue'}
          </ContinueButton>
        ) : null}
      </div>
    </div>
  )
}
