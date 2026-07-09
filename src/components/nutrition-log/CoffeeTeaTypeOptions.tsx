import {
  COFFEE_TEA_TYPE_OPTIONS,
  type CoffeeTeaTypeOption,
} from '../../data/nutritionLogQuestions'
import { NutritionMultiSelectGridOptions } from './NutritionMultiSelectGridOptions'

/** Figma 5657:47273 — coffee / tea type multi-select pills */
export function CoffeeTeaTypeOptions({
  selected,
  onToggle,
}: {
  selected: CoffeeTeaTypeOption[]
  onToggle: (value: CoffeeTeaTypeOption) => void
}) {
  return (
    <NutritionMultiSelectGridOptions
      options={COFFEE_TEA_TYPE_OPTIONS}
      selected={selected}
      onToggle={onToggle}
    />
  )
}
