import {
  COFFEE_TEA_INTAKE_OPTIONS,
  type CoffeeTeaIntakeOption,
} from '../../data/nutritionLogQuestions'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'

/** Figma 5657:46907 — short pair on top, full-width options below */
export function CoffeeTeaIntakeOptions({
  selected,
  onSelect,
}: {
  selected: CoffeeTeaIntakeOption | null
  onSelect: (value: CoffeeTeaIntakeOption) => void
}) {
  const shorts = COFFEE_TEA_INTAKE_OPTIONS.filter((option) => !option.fullWidth)
  const longs = COFFEE_TEA_INTAKE_OPTIONS.filter((option) => option.fullWidth)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full gap-4">
        {shorts.map((option) => (
          <NutritionFrequencyPill
            key={option.id}
            label={option.label}
            selected={selected === option.id}
            onClick={() => onSelect(option.id)}
            className="flex-1"
          />
        ))}
      </div>
      {longs.map((option) => (
        <NutritionFrequencyPill
          key={option.id}
          label={option.label}
          fullWidth
          selected={selected === option.id}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  )
}
