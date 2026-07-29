import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { isGlossaryHelpText } from '../../lib/parseHelpTextToInfoItems'
import { McqQuestionHeader } from '../mcq/McqQuestionHeader'
import { MCQ_QUESTION_HINT_CLASS } from '../mcq/mcqLayout'
import { collectNutritionApiOptions } from './fitApiOptionsToNutrition'
import { NutritionMultiSelectGridOptions } from './NutritionMultiSelectGridOptions'

/** Designed nutrition multi-select grid driven by API options. */
export function NutritionApiMultiSelectQuestion({
  questionLabel,
  questionText,
  helpText,
  options,
  selectedValues,
  onToggle,
  onInfoClick,
  reserveTickSpaceForSelectedLabels = false,
  showFullOptionLabels = false,
}: {
  questionLabel: string
  questionText: string
  helpText?: string | null
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
  // Glossary help_text (Term : examples) is shown via the (i) button only.
  const inlineHelpText =
    helpText && !isGlossaryHelpText(helpText) ? helpText : null

  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader theme="nutrition" questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <p>{questionText}</p>
        {inlineHelpText ? <p className={MCQ_QUESTION_HINT_CLASS}>{inlineHelpText}</p> : null}
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
