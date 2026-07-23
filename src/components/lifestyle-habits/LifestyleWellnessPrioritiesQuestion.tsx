import type { QuestionnaireOption } from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { LifestyleApiPillGrid } from './LifestyleApiPillGrid'

/** Designed Lifestyle Q9 — wellness priorities driven by all API options. */
export function LifestyleWellnessPrioritiesQuestion({
  questionLabel,
  questionText,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
}: {
  questionLabel: string
  questionText: string
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <p>{questionText}</p>
      </LifestyleHabitsQuestionHeader>

      <LifestyleApiPillGrid
        options={options}
        selectedValue={selectedValue}
        onSelect={onSelect}
        layout="pairs"
        showTick
      />
    </div>
  )
}
