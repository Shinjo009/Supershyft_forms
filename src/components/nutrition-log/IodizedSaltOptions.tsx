import { IODIZED_SALT_OPTIONS, type IodizedSaltOption } from '../../data/nutritionLogQuestions'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'

/** Figma 5627:13218 — Yes / No iodized salt pills */
export function IodizedSaltOptions({
  selected,
  onSelect,
}: {
  selected: IodizedSaltOption | null
  onSelect: (value: IodizedSaltOption) => void
}) {
  return (
    <div className="flex w-full gap-4">
      {IODIZED_SALT_OPTIONS.map((option) => (
        <NutritionFrequencyPill
          key={option.id}
          label={option.label}
          selected={selected === option.id}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  )
}
