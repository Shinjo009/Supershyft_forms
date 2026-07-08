import {
  CONSUMPTION_FREQUENCY_OPTIONS,
  type ConsumptionFrequencyOption,
} from '../../data/nutritionLogQuestions'
import { CONSUMPTION_FREQUENCY_METER } from './consumptionFrequencyConfig'
import { NutritionConsumptionFrequencySelector } from './NutritionConsumptionFrequencySelector'

/** Figma 5701:15836 — fresh fruits frequency ring + grid pills */
export function FreshFruitsFrequencySelector({
  selected,
  onSelect,
}: {
  selected: ConsumptionFrequencyOption | null
  onSelect: (value: ConsumptionFrequencyOption) => void
}) {
  return (
    <NutritionConsumptionFrequencySelector
      meterId="fresh-fruits-frequency"
      options={CONSUMPTION_FREQUENCY_OPTIONS}
      meter={CONSUMPTION_FREQUENCY_METER}
      selected={selected}
      onSelect={onSelect}
    />
  )
}
