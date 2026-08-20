import type { QuestionnaireOption } from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { LifestyleApiPillGrid } from './LifestyleApiPillGrid'
import { McqQuestionCopy } from '../mcq/McqQuestionCopy'

/** Designed Lifestyle Q9 — wellness priorities (multi-select, min 1 / max 2). */
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
  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <McqQuestionCopy text={questionText} subText={subText} />
      </LifestyleHabitsQuestionHeader>

      <LifestyleApiPillGrid
        options={options}
        selectedValues={selectedValues}
        onSelect={onToggle}
        layout="wellness"
        showTick
      />
    </div>
  )
}
