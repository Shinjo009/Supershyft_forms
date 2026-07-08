import {
  CONSUMPTION_FREQUENCY_OPTIONS,
  type ConsumptionFrequencyOption,
} from '../../data/nutritionLogQuestions'
import { CONSUMPTION_FREQUENCY_METER } from './consumptionFrequencyConfig'
import { NutritionConsumptionFrequencySelector } from './NutritionConsumptionFrequencySelector'

/** Figma 5722:9811 — fresh vegetables frequency ring + grid pills */
export function FreshVegetablesFrequencySelector({
  selected,
  onSelect,
}: {
  selected: ConsumptionFrequencyOption | null
  onSelect: (value: ConsumptionFrequencyOption) => void
}) {
  return (
    <NutritionConsumptionFrequencySelector
      meterId="fresh-vegetables-frequency"
      options={CONSUMPTION_FREQUENCY_OPTIONS}
      meter={CONSUMPTION_FREQUENCY_METER}
      selected={selected}
      onSelect={onSelect}
    />
  )
}
