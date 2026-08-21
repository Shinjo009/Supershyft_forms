import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { McqQuestionHeader } from '../mcq/McqQuestionHeader'
import { collectNutritionApiOptions } from './fitApiOptionsToNutrition'
import { NutritionMultiSelectGridOptions } from './NutritionMultiSelectGridOptions'

/** Designed nutrition multi-select grid driven by API options. */
export function NutritionApiMultiSelectQuestion({
  questionLabel,
  questionText,
  subText,
  options,
  selectedValues,
  onToggle,
  onInfoClick,
  reserveTickSpaceForSelectedLabels = false,
  showFullOptionLabels = false,
}: {
  questionLabel: string
  questionText: string
  subText?: string | null
  options: QuestionnaireOption[]
  selectedValues: string[]
  onToggle: (value: string) => void
  onInfoClick?: () => void
  /** Only for the coffee/tea type question: tick icon is absolute, so reserve left padding to avoid overlap. */
  reserveTickSpaceForSelectedLabels?: boolean
  /** Only for the coffee/tea type question: avoid `...` truncation for long labels. */
  showFullOptionLabels?: boolean
}) {
  const items = useMemo(() => collectNutritionApiOptions(options), [options])

  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader
        theme="nutrition"
        questionLabel={questionLabel}
        onInfoClick={onInfoClick}
        subText={subText}
      >
        <p>{questionText}</p>
      </McqQuestionHeader>

      <NutritionMultiSelectGridOptions
        options={items}
        selected={selectedValues}
        onToggle={onToggle}
        reserveTickSpaceForSelectedLabels={reserveTickSpaceForSelectedLabels}
        showFullOptionLabels={showFullOptionLabels}
      />
    </div>
  )
}
