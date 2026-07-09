import {
  BAKED_GOODS_FREQUENCY_OPTIONS,
  type BakedGoodsFrequencyOption,
} from '../../data/nutritionLogQuestions'
import { BAKED_GOODS_FREQUENCY_METER } from './bakedGoodsFrequencyConfig'
import { NutritionConsumptionFrequencySelector } from './NutritionConsumptionFrequencySelector'

/** Figma 5722:13773 — sugary drinks & desserts frequency ring + grid pills */
export function SugaryDrinksFrequencySelector({
  selected,
  onSelect,
}: {
  selected: BakedGoodsFrequencyOption | null
  onSelect: (value: BakedGoodsFrequencyOption) => void
}) {
  return (
    <NutritionConsumptionFrequencySelector
      meterId="sugary-drinks-frequency"
      options={BAKED_GOODS_FREQUENCY_OPTIONS}
      meter={BAKED_GOODS_FREQUENCY_METER}
      selected={selected}
      onSelect={onSelect}
    />
  )
}
