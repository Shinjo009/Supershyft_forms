import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { McqQuestionHeader } from '../mcq/McqQuestionHeader'
import { collectNutritionApiOptions } from './fitApiOptionsToNutrition'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'

/**
 * Coffee intake layout — matches the Figma design:
 * short numeric labels (e.g. "1-2 cups per day", "2-3 times a week") pair side-by-side,
 * long descriptive labels (e.g. "I do not drink coffee or tea") go full-width below.
 *
 * Short = starts with a digit (amount/frequency). Everything else is full-width.
 */
function isShortCoffeeLabel(label: string): boolean {
  return /^\d/.test(label.trim())
}

function CoffeeIntakeGrid({
  items,
  selectedValue,
  onSelect,
}: {
  items: { id: string; label: string }[]
  selectedValue: string | null
  onSelect: (value: string) => void
}) {
  const shorts = items.filter((item) => isShortCoffeeLabel(item.label))
  const longs = items.filter((item) => !isShortCoffeeLabel(item.label))

  const pairs: { id: string; label: string }[][] = []
  for (let i = 0; i < shorts.length; i += 2) {
    pairs.push(shorts.slice(i, i + 2))
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {pairs.map((pair, rowIndex) => (
        <div key={rowIndex} className={`flex w-full ${pair.length > 1 ? 'gap-4' : ''}`}>
          {pair.map((item) => (
            <NutritionFrequencyPill
              key={item.id}
              label={item.label}
              fullWidth={pair.length === 1}
              selected={selectedValue === item.id}
              onClick={() => onSelect(item.id)}
              className="flex-1"
            />
          ))}
        </div>
      ))}
      {longs.map((item) => (
        <NutritionFrequencyPill
          key={item.id}
          label={item.label}
          fullWidth
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
  layout?: 'wrap' | 'row' | 'coffee-intake'
}) {
  const items = useMemo(() => collectNutritionApiOptions(options), [options])

  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader theme="nutrition" questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <p>{questionText}</p>
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
