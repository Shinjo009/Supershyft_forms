import {
  DAILY_FOOD_GROUP_OPTIONS,
  type DailyFoodGroupOption,
} from '../../data/nutritionLogQuestions'
import { filterFoodGroupItemsByDiet } from '../../lib/filterFoodGroupsByDiet'
import { NutritionMultiSelectGridOptions } from './NutritionMultiSelectGridOptions'

/** Figma 5654:8693 — daily food group multi-select pills */
export function DailyFoodGroupsOptions({
  selected,
  onToggle,
  dietType,
}: {
  selected: DailyFoodGroupOption[]
  onToggle: (value: DailyFoodGroupOption) => void
  /** Prior diet-type answer — filters Eggs / Chicken-Fish when restricted. */
  dietType?: string | null
}) {
  const options = filterFoodGroupItemsByDiet(DAILY_FOOD_GROUP_OPTIONS, dietType)

  return (
    <NutritionMultiSelectGridOptions
      options={options}
      selected={selected}
      onToggle={onToggle}
    />
  )
}
