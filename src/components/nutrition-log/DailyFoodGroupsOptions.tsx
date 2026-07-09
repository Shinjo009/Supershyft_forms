import {
  DAILY_FOOD_GROUP_OPTIONS,
  type DailyFoodGroupOption,
} from '../../data/nutritionLogQuestions'
import { NutritionMultiSelectGridOptions } from './NutritionMultiSelectGridOptions'

/** Figma 5654:8693 — daily food group multi-select pills */
export function DailyFoodGroupsOptions({
  selected,
  onToggle,
}: {
  selected: DailyFoodGroupOption[]
  onToggle: (value: DailyFoodGroupOption) => void
}) {
  return (
    <NutritionMultiSelectGridOptions
      options={DAILY_FOOD_GROUP_OPTIONS}
      selected={selected}
      onToggle={onToggle}
    />
  )
}
