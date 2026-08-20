import tickCircleSolid from '../assets/figma/tick-circle-solid.svg'
import assessmentRadioImg from '../assets/Ellipse 13077.svg'
import sectionSuccessGif from '../assets/animation-gif (1).gif'
import lifestyleSuccessGif from '../assets/animation-gif-lifestyle-orange.webp'
import nutritionSuccessGif from '../assets/animation-gif-nutrition-blue.webp'
import {
  categoryDescriptionForKey,
  isCategoryCompleted,
  normalizeCategoryKey,
  type AssessmentCategoryStatus,
} from '../api/assessments'
import { ContinueButton } from './ContinueButton'
import { ASSESSMENT_CARD_STACK_CLASS, ASSESSMENT_CONTENT_MAX_CLASS } from './mcq/mcqLayout'

export type SectionCompleteVariant = 'anthropometry' | 'family' | 'lifestyle' | 'nutrition'

const VARIANT_COPY: Record<
  SectionCompleteVariant,
  { title: string; subtitle?: string }
> = {
  anthropometry: {
    title: 'Anthropometry Section Complete!',
    subtitle: 'Only 3 more sections left',
  },
  family: {
    title: 'Family Section Complete!',
    subtitle: 'Only 2 more sections left',
  },
  lifestyle: {
    title: 'Lifestyle Section Complete!',
    subtitle: 'Only 1 more section left',
  },
  nutrition: {
    title: 'Nutrition Section Complete!',
  },
}

const VARIANT_SUCCESS_GIF: Record<SectionCompleteVariant, string> = {
  anthropometry: sectionSuccessGif,
  family: sectionSuccessGif,
  lifestyle: lifestyleSuccessGif,
  nutrition: nutritionSuccessGif,
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
      <div className="mb-auto mt-4 flex w-full flex-col items-center gap-11 px-6 pb-10 pt-2">
        <div className="flex flex-col items-center gap-3">
          <img
            key={variant}
            src={VARIANT_SUCCESS_GIF[variant]}
            alt=""
            draggable={false}
            className="mx-auto -mt-4 h-[280px] w-[280px] object-contain"
          />
          <div className="flex flex-col items-center gap-1 pb-1">
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

        <div className={`${ASSESSMENT_CARD_STACK_CLASS} ${categories.length >= 4 ? '!gap-3' : ''}`}>
          {categories.map((category) => {
            const completed = isCategoryCompleted(category, completedCategoryIds)
            const featured = !completed && category.category_id === nextIncompleteId
            const description = categoryDescriptionForKey(normalizeCategoryKey(category.category_key))
            const loading = isLoadingCategoryId === category.category_id
            const title = category.display_name || category.category_key

            return (
              <button
                key={category.category_id}
                type="button"
                disabled={loading}
                onClick={() => onSelectCategory(category)}
                aria-label={completed ? `Review ${title}` : `Start ${title}`}
                className={
                  completed
                    ? 'flex w-full cursor-pointer items-center rounded-xl border border-[rgba(218,193,90,0.5)] bg-white/5 p-4 text-left shadow-[0_0_5px_0_rgba(218,193,90,0.2)] transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70'
                    : featured
                      ? 'flex w-full cursor-pointer flex-col gap-4 rounded-xl border border-[rgba(144,223,158,0.5)] bg-white/5 p-4 text-left shadow-[0_0_10px_0_rgba(144,223,158,0.5)] transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70'
                      : 'flex w-full cursor-pointer items-center rounded-xl bg-white/5 p-[15px] text-left transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70'
                }
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <img
                    src={completed ? tickCircleSolid : assessmentRadioImg}
                    alt=""
                    className="size-[15px] shrink-0"
                    aria-hidden
                  />
                  <span className={`text-[14px] font-medium ${completed ? 'text-white' : 'text-[#ccc]'}`}>
                    {loading ? 'Loading...' : title}
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
            {isContinuing ? 'Submitting...' : 'Submit'}
          </ContinueButton>
        ) : null}
      </div>
    </div>
  )
}
