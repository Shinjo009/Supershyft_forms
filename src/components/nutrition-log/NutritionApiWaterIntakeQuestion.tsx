import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { McqQuestionCopy } from '../mcq/McqQuestionCopy'
import { McqQuestionHeader } from '../mcq/McqQuestionHeader'
import {
  MCQ_PILL_BORDER_IDLE,
  MCQ_PILL_BORDER_SELECTED,
  MCQ_PILL_OUTLINE_GLOW,
} from '../mcq/mcqLayout'
import { buildWaterReadingsFromApi } from './fitApiOptionsToNutrition'
import { WaterIntakeBottle } from './WaterIntakeBottle'
import { WATER_INTAKE_PILL_GRADIENT } from './waterIntakeConfig'

function WaterIntakePill({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[38px] w-[139px] items-center justify-center rounded-[24px] border border-solid px-[10px] py-1 text-center text-[12px] leading-5 text-white lg:w-full ${
        selected ? 'min-h-[40px] font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: WATER_INTAKE_PILL_GRADIENT,
              borderColor: MCQ_PILL_BORDER_SELECTED,
              boxShadow: MCQ_PILL_OUTLINE_GLOW.nutrition,
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

/** Designed nutrition water bottle + vertical pills driven by API options. */
export function NutritionApiWaterIntakeQuestion({
  questionLabel,
  questionText,
  subText,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
}: {
  questionLabel: string
  questionText: string
  subText?: string | null
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
}) {
  const { items, readings } = useMemo(() => buildWaterReadingsFromApi(options), [options])
  const reading =
    selectedValue === null
      ? { liters: 0, fillRatio: 0 }
      : (readings[selectedValue] ?? { liters: 0, fillRatio: 0 })

  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader theme="nutrition" questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <McqQuestionCopy text={questionText} subText={subText} />
      </McqQuestionHeader>

      <div className="flex w-full items-center justify-between gap-2">
        <WaterIntakeBottle liters={reading.liters} fillRatio={reading.fillRatio} />

        <div className="flex w-[139px] shrink-0 flex-col gap-2 lg:w-[160px]">
          {items.map((item) => (
            <WaterIntakePill
              key={item.id}
              label={item.label}
              selected={selectedValue === item.id}
              onClick={() => onSelect(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
