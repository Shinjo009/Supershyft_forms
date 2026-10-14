import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { McqQuestionHeader } from '../mcq/McqQuestionHeader'
import { collectNutritionApiOptions } from './fitApiOptionsToNutrition'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'
import { McqQuestionCopy } from '../mcq/McqQuestionCopy'

/** Every coffee/tea intake option uses the same pill box. */
function CoffeeIntakeGrid({
  items,
  selectedValue,
  onSelect,
}: {
  items: { id: string; label: string }[]
  selectedValue: string | null
  onSelect: (value: string) => void
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      {items.map((item) => (
        <NutritionFrequencyPill
          key={item.id}
          label={item.label}
          equal
          selected={selectedValue === item.id}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  )
}

/** Designed nutrition pill row / wrap driven by API options. */
export function NutritionApiPillRowQuestion({
  questionLabel,
  questionText,
  subText,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
  layout = 'wrap',
}: {
  questionLabel: string
  questionText: string
  subText?: string | null
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
  layout?: 'wrap' | 'row' | 'coffee-intake'
}) {
  const items = useMemo(() => collectNutritionApiOptions(options), [options])

  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader theme="nutrition" questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <McqQuestionCopy text={questionText} subText={subText} />
      </McqQuestionHeader>

      {layout === 'coffee-intake' ? (
        <CoffeeIntakeGrid items={items} selectedValue={selectedValue} onSelect={onSelect} />
      ) : (
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
      )}
    </div>
  )
}
