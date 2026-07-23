import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { McqQuestionHeader } from '../mcq/McqQuestionHeader'
import { collectNutritionApiOptions } from './fitApiOptionsToNutrition'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'

/** Designed nutrition pill row / wrap driven by API options. */
export function NutritionApiPillRowQuestion({
  questionLabel,
  questionText,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
  layout = 'wrap',
}: {
  questionLabel: string
  questionText: string
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
  layout?: 'wrap' | 'row'
}) {
  const items = useMemo(() => collectNutritionApiOptions(options), [options])

  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader theme="nutrition" questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <p>{questionText}</p>
      </McqQuestionHeader>

      <div
        className={
          layout === 'row' ? 'flex w-full gap-4' : 'flex flex-wrap content-center gap-4'
        }
      >
        {items.map((item) => (
          <NutritionFrequencyPill
            key={item.id}
            label={item.label}
            fullWidth={item.label.length > 28}
            selected={selectedValue === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </div>
    </div>
  )
}
