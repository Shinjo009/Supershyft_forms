import {
  BAKED_GOODS_FREQUENCY_OPTIONS,
  type BakedGoodsFrequencyOption,
} from '../../data/nutritionLogQuestions'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'

/** Figma 5657:50792 — market butter frequency pill grid */
export function MarketButterFrequencySelector({
  selected,
  onSelect,
}: {
  selected: BakedGoodsFrequencyOption | null
  onSelect: (value: BakedGoodsFrequencyOption) => void
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      {BAKED_GOODS_FREQUENCY_OPTIONS.map((option) => (
        <NutritionFrequencyPill
          key={option.id}
          label={option.label}
          compact
          selected={selected === option.id}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  )
}
