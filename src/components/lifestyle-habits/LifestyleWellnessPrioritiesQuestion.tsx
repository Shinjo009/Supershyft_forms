import type { QuestionnaireOption } from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { LifestyleApiPillGrid } from './LifestyleApiPillGrid'

/** Designed Lifestyle Q9 — wellness priorities; select 1–2 options. */
export function LifestyleWellnessPrioritiesQuestion({
  questionLabel,
  questionText,
  subText,
  options,
  selectedValues,
  onToggle,
  onInfoClick,
}: {
  questionLabel: string
  questionText: string
  subText?: string | null
  options: QuestionnaireOption[]
  selectedValues: string[]
  onToggle: (value: string) => void
  onInfoClick?: () => void
}) {
  const maxSelected = 2

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
        selectedValues={selectedValues}
        onSelect={(value) => {
          const isSelected = selectedValues.includes(value)
          if (!isSelected && selectedValues.length >= maxSelected) return
          onToggle(value)
        }}
        layout="wellness"
      />
    </div>
  )
}
