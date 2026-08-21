import type { QuestionnaireOption } from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { LifestyleApiPillGrid } from './LifestyleApiPillGrid'

/** Designed Lifestyle Q8 — smoking frequency pills driven by all API options. */
export function LifestyleSmokingFrequencyQuestion({
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
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader
        questionLabel={questionLabel}
        onInfoClick={onInfoClick}
        subText={subText}
      >
        <p>{questionText}</p>
      </LifestyleHabitsQuestionHeader>

      <LifestyleApiPillGrid
        options={options}
        selectedValue={selectedValue}
        onSelect={onSelect}
        layout="smoking"
      />
    </div>
  )
}
