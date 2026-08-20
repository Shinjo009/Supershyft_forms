import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
} from '../../api/questionnaire'
import { McqQuestionCopy } from '../mcq/McqQuestionCopy'
import { McqQuestionHeader } from '../mcq/McqQuestionHeader'
import {
  MCQ_PILL_BORDER_IDLE,
  MCQ_PILL_BORDER_SELECTED,
  MCQ_PILL_CHIP_CLASS,
} from '../mcq/mcqLayout'
import { NUTRITION_PILL_GRADIENT } from './nutritionLogConfig'

function DietPill({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 ${MCQ_PILL_CHIP_CLASS} items-center justify-center rounded-[24px] border border-solid px-[10px] py-1 text-[12px] leading-6 text-white disabled:opacity-60 ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: NUTRITION_PILL_GRADIENT,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              borderColor: MCQ_PILL_BORDER_IDLE,
            }
      }
    >
      {label}
    </button>
  )
}

/** Designed Nutrition Q1 — diet type pills driven by API options. */
export function NutritionDietTypeQuestion({
  questionLabel,
  questionText,
  subText,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
  disabled = false,
}: {
  questionLabel: string
  questionText: string
  subText?: string | null
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader theme="nutrition" questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <McqQuestionCopy text={questionText} subText={subText} />
      </McqQuestionHeader>

      <div className="flex flex-wrap content-center gap-4">
        {options.map((option) => {
          const value = getOptionValue(option)
          const label = getOptionLabel(option) || value
          if (!value && !label) return null
          return (
            <DietPill
              key={value || label}
              label={label}
              selected={selectedValue === value}
              disabled={disabled}
              onClick={() => onSelect(value)}
            />
          )
        })}
      </div>
    </div>
  )
}
