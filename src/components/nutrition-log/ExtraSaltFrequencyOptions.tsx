import {
  EXTRA_SALT_FREQUENCY_OPTIONS,
  type ExtraSaltFrequencyOption,
} from '../../data/nutritionLogQuestions'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'

/** Figma 5627:13229 — Never / Rarely / Usually extra salt pills */
export function ExtraSaltFrequencyOptions({
  selected,
  onSelect,
}: {
  selected: ExtraSaltFrequencyOption | null
  onSelect: (value: ExtraSaltFrequencyOption) => void
}) {
  return (
    <div className="flex flex-wrap content-center gap-4">
      {EXTRA_SALT_FREQUENCY_OPTIONS.map((option) => (
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
