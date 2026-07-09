import {
  COFFEE_TEA_INTAKE_OPTIONS,
  type CoffeeTeaIntakeOption,
} from '../../data/nutritionLogQuestions'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'

/** Figma 5657:46907 — coffee / tea intake pill grid */
export function CoffeeTeaIntakeOptions({
  selected,
  onSelect,
}: {
  selected: CoffeeTeaIntakeOption | null
  onSelect: (value: CoffeeTeaIntakeOption) => void
}) {
  return (
    <div className="flex flex-wrap content-center gap-4">
      {COFFEE_TEA_INTAKE_OPTIONS.map((option) => (
        <NutritionFrequencyPill
          key={option.id}
          label={option.label}
          fullWidth={option.fullWidth}
          selected={selected === option.id}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  )
}
