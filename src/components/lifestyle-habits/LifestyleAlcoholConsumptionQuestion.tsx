import type { QuestionnaireOption } from '../../api/questionnaire'
import { MCQ_QUESTION_HINT_CLASS } from '../mcq/mcqLayout'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { LifestyleApiPillGrid } from './LifestyleApiPillGrid'

/** Designed Lifestyle Q7 — alcohol consumption pills driven by all API options. */
export function LifestyleAlcoholConsumptionQuestion({
  questionLabel,
  questionText,
  helpText,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
}: {
  questionLabel: string
  questionText: string
  helpText?: string | null
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <p>{questionText}</p>
        {helpText ? <p className={MCQ_QUESTION_HINT_CLASS}>{helpText}</p> : null}
      </LifestyleHabitsQuestionHeader>

      <LifestyleApiPillGrid
        options={options}
        selectedValue={selectedValue}
        onSelect={onSelect}
        layout="alcohol"
      />
    </div>
  )
}
