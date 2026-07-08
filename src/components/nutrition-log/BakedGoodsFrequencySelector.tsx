import {
  BAKED_GOODS_FREQUENCY_OPTIONS,
  type BakedGoodsFrequencyOption,
} from '../../data/nutritionLogQuestions'
import { BAKED_GOODS_FREQUENCY_METER } from './bakedGoodsFrequencyConfig'
import { NutritionConsumptionFrequencySelector } from './NutritionConsumptionFrequencySelector'

/** Figma 5722:10286 — baked goods frequency ring + grid pills */
export function BakedGoodsFrequencySelector({
  selected,
  onSelect,
}: {
  selected: BakedGoodsFrequencyOption | null
  onSelect: (value: BakedGoodsFrequencyOption) => void
}) {
  return (
    <NutritionConsumptionFrequencySelector
      meterId="baked-goods-frequency"
      options={BAKED_GOODS_FREQUENCY_OPTIONS}
      meter={BAKED_GOODS_FREQUENCY_METER}
      selected={selected}
      onSelect={onSelect}
    />
  )
}
