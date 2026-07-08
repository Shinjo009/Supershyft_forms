export type NutritionQuestionPreview = {
  line1: string
  line2: string
}

export type DietTypeOption =
  | 'veg'
  | 'jain'
  | 'non-veg'
  | 'pescatarian'
  | 'eggetarian'
  | 'flexitarian'

export type DailyFoodGroupOption =
  | 'pulses-legumes'
  | 'fresh-fruits'
  | 'fresh-vegetables'
  | 'nuts-seeds'
  | 'whole-grains'
  | 'eggs'
  | 'whole-milk-curd'
  | 'chicken-fish'
  | 'cruciferous'

export type BreakfastFrequencyOption = 'more-than-5' | 'less-than-5' | 'no-breakfast'

export type ConsumptionFrequencyOption =
  | '1-2-per-day'
  | '2-3-per-week'
  | 'once-week-or-less'
  | '1-2-per-month'
  | 'rarely-never'

export type BakedGoodsFrequencyOption =
  | '4-or-more-per-week'
  | '2-3-per-week'
  | 'once-week-or-less'
  | '1-2-per-month'
  | 'rarely-never'

export const NUTRITION_LOG_TOTAL_QUESTIONS = 15

export function nutritionLogProgressPercent(questionIndex: number): number {
  return Math.round(((questionIndex + 1) / NUTRITION_LOG_TOTAL_QUESTIONS) * 100)
}

export const NUTRITION_LOG_NEXT_PREVIEWS: NutritionQuestionPreview[] = [
  {
    line1: 'Which of the following food groups do you',
    line2: 'consume every day?',
  },
  {
    line1: 'How frequently do you have a healthy',
    line2: 'homemade breakfast in a week?',
  },
  {
    line1: 'How frequently do you consume',
    line2: 'fresh fruits ?',
  },
  {
    line1: 'How frequently do you consume',
    line2: 'fresh vegeatables ?',
  },
  {
    line1: 'How frequently do you consume cookies,',
    line2: 'biscuits, bread, or cakes?',
  },
  ...Array.from({ length: NUTRITION_LOG_TOTAL_QUESTIONS - 5 }, () => ({
    line1: '',
    line2: '',
  })),
]

export const DIET_TYPE_OPTIONS: {
  id: DietTypeOption
  label: string
}[] = [
  { id: 'veg', label: 'Veg' },
  { id: 'jain', label: 'Jain' },
  { id: 'non-veg', label: 'Non-Veg' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'eggetarian', label: 'Eggetarian' },
  { id: 'flexitarian', label: 'Flexitarian' },
]

export const DAILY_FOOD_GROUP_OPTIONS: {
  id: DailyFoodGroupOption
  label: string
  fullWidth?: boolean
}[] = [
  { id: 'pulses-legumes', label: 'Pulses / Legumes' },
  { id: 'fresh-fruits', label: 'Fresh Fruits' },
  { id: 'fresh-vegetables', label: 'Fresh Vegetables' },
  { id: 'nuts-seeds', label: 'Nuts / Seeds' },
  { id: 'whole-grains', label: 'Whole Grains' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'whole-milk-curd', label: 'Whole Milk / Curd' },
  { id: 'chicken-fish', label: 'Chicken / Fish' },
  { id: 'cruciferous', label: 'Cruciferous (Cauliflower, Cabbage)', fullWidth: true },
]

export const BREAKFAST_FREQUENCY_OPTIONS: {
  id: BreakfastFrequencyOption
  label: string
  fullWidth?: boolean
}[] = [
  { id: 'more-than-5', label: 'More than 5 times' },
  { id: 'less-than-5', label: 'Less than 5 times' },
  { id: 'no-breakfast', label: 'Do not have breakfast', fullWidth: true },
]

export const CONSUMPTION_FREQUENCY_OPTIONS: {
  id: ConsumptionFrequencyOption
  label: string
}[] = [
  { id: '1-2-per-day', label: '1-2 times per day' },
  { id: '2-3-per-week', label: '2-3 times a week' },
  { id: 'once-week-or-less', label: 'Once a week or less' },
  { id: '1-2-per-month', label: '1-2 times per month' },
  { id: 'rarely-never', label: 'Rarely or never' },
]

export const BAKED_GOODS_FREQUENCY_OPTIONS: {
  id: BakedGoodsFrequencyOption
  label: string
}[] = [
  { id: '4-or-more-per-week', label: '4 or more times a week' },
  { id: '2-3-per-week', label: '2-3 times a week' },
  { id: 'once-week-or-less', label: 'Once a week or less' },
  { id: '1-2-per-month', label: '1-2 times per month' },
  { id: 'rarely-never', label: 'Rarely or never' },
]
