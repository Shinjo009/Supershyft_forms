export type NutritionQuestionPreview = {
  line1: string
  line2: string
}

import type { McqInfoItem } from '../components/mcq/mcqInfoTypes'

export type NutritionLogInfoItem = McqInfoItem

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

export type IodizedSaltOption = 'yes' | 'no'

export type ExtraSaltFrequencyOption = 'never' | 'rarely' | 'usually'

export type CoffeeTeaIntakeOption =
  | '1-2-cups-per-day'
  | 'no-coffee-tea'
  | 'more-than-2-cups'
  | '2-3-times-week'

export type CoffeeTeaTypeOption =
  | 'tea-sugar-milk'
  | 'green-tea'
  | 'black-coffee'
  | 'black-tea'
  | 'milk-tea-no-sugar'
  | 'coffee-sugar-milk'
  | 'milk-coffee-no-sugar'

export type WaterIntakeOption = '8-plus' | '8' | '6' | '4' | '2' | 'less-than-2'

export type IllnessFrequencyOption =
  | '1-2-times'
  | '2-3-times'
  | '4-5-times'
  | 'rarely-never'
  | 'more-than-6'

export const NUTRITION_LOG_TOTAL_QUESTIONS = 15

/** Last navigator step (Q8+Q9 share one step). */
export const NUTRITION_LOG_LAST_STEP_INDEX = 13

export function nutritionLogProgressPercent(
  questionIndex: number,
  isCurrentQuestionAnswered = false,
): number {
  const completed = questionIndex + (isCurrentQuestionAnswered ? 1 : 0)
  return Math.round((completed / NUTRITION_LOG_TOTAL_QUESTIONS) * 100)
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
  {
    line1: 'How frequently do you consume sugary',
    line2: 'drinks and desserts?',
  },
  {
    line1: 'Do you use iodized salt',
    line2: 'in your diet?',
  },
  {
    line1: 'How often do you add extra salt',
    line2: 'to your food?',
  },
  {
    line1: "What's your coffee or tea",
    line2: 'intake?',
  },
  {
    line1: 'What type of coffee or tea',
    line2: 'do you drink?',
  },
  {
    line1: 'How frequently do you indulge in',
    line2: 'dishes that are rich in market butter?',
  },
  {
    line1: 'How frequently do you consume',
    line2: 'red meat (i.e., mutton, lamb, beef, pork)?',
  },
  {
    line1: 'How many glasses of water do you',
    line2: 'drink in a day?',
  },
  {
    line1: 'How often do you fall sick',
    line2: 'in a year?',
  },
  ...Array.from({ length: NUTRITION_LOG_TOTAL_QUESTIONS - 14 }, () => ({
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
  { id: 'pulses-legumes', label: 'Pulses / legumes' },
  { id: 'fresh-fruits', label: 'Fresh fruits' },
  { id: 'fresh-vegetables', label: 'Fresh vegetables' },
  { id: 'nuts-seeds', label: 'Nuts / seeds' },
  { id: 'whole-grains', label: 'Whole grains' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'whole-milk-curd', label: 'Whole milk / curd' },
  { id: 'chicken-fish', label: 'Chicken / fish' },
  { id: 'cruciferous', label: 'Cruciferous (cauliflower, cabbage)', fullWidth: true },
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

export const IODIZED_SALT_OPTIONS: {
  id: IodizedSaltOption
  label: string
}[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
]

export const EXTRA_SALT_FREQUENCY_OPTIONS: {
  id: ExtraSaltFrequencyOption
  label: string
}[] = [
  { id: 'never', label: 'Never' },
  { id: 'rarely', label: 'Rarely' },
  { id: 'usually', label: 'Usually' },
]

export const COFFEE_TEA_INTAKE_OPTIONS: {
  id: CoffeeTeaIntakeOption
  label: string
  fullWidth?: boolean
}[] = [
  { id: '1-2-cups-per-day', label: '1-2 cups per day' },
  { id: '2-3-times-week', label: '2-3 times a week' },
  { id: 'no-coffee-tea', label: 'I do not drink coffee or tea', fullWidth: true },
  { id: 'more-than-2-cups', label: 'More than 2 cups per day', fullWidth: true },
]

export const COFFEE_TEA_TYPE_OPTIONS: {
  id: CoffeeTeaTypeOption
  label: string
  fullWidth?: boolean
}[] = [
  { id: 'tea-sugar-milk', label: 'Tea with sugar & milk' },
  { id: 'green-tea', label: 'Green tea' },
  { id: 'black-coffee', label: 'Black coffee' },
  { id: 'black-tea', label: 'Black tea' },
  { id: 'milk-tea-no-sugar', label: 'Milk tea without sugar', fullWidth: true },
  { id: 'coffee-sugar-milk', label: 'Coffee with sugar & milk', fullWidth: true },
  { id: 'milk-coffee-no-sugar', label: 'Milk coffee without sugar', fullWidth: true },
]

export const WATER_INTAKE_OPTIONS: {
  id: WaterIntakeOption
  label: string
}[] = [
  { id: '8-plus', label: '8+ glasses' },
  { id: '8', label: '8 glasses' },
  { id: '6', label: '6 glasses' },
  { id: '4', label: '4 glasses' },
  { id: '2', label: '2 glasses' },
  { id: 'less-than-2', label: '<2 glasses' },
]

export const ILLNESS_FREQUENCY_OPTIONS: {
  id: IllnessFrequencyOption
  label: string
}[] = [
  { id: '1-2-times', label: '1-2 times' },
  { id: '2-3-times', label: '2-3 times' },
  { id: '4-5-times', label: '4-5 times' },
  { id: 'rarely-never', label: 'Rarely or never' },
  { id: 'more-than-6', label: 'More than 6 times' },
]

/** Figma 5725:14992 — primary diet type (Q1) */
export const NUTRITION_DIET_TYPE_INFO: NutritionLogInfoItem[] = [
  { term: 'Veg', description: 'Does not consume meat or fish' },
  { term: 'Non-Veg', description: 'Consumes both meat and fish' },
  { term: 'Eggetarian', description: 'Consumes eggs but not meat or fish' },
  {
    term: 'Flexitarian',
    description: 'Primarily vegetarian but occasionally consumes meat or fish',
  },
  { term: 'Pescatarian', description: 'Consumes fish but not meat' },
  { term: 'Jain', description: 'Vegetarian diet excluding root vegetables' },
]

const NUTRITION_DAILY_FOOD_GROUPS_INFO: NutritionLogInfoItem[] = [
  { term: 'Pulses / legumes', description: 'Lentils, beans, chickpeas, and similar plant proteins' },
  { term: 'Fresh fruits', description: 'Whole fruits eaten fresh, not juiced or dried' },
  { term: 'Fresh vegetables', description: 'Raw or cooked vegetables as part of daily meals' },
  { term: 'Nuts / seeds', description: 'Almonds, walnuts, flax, chia, and similar seeds or nuts' },
  { term: 'Whole grains', description: 'Brown rice, oats, millets, and unrefined grains' },
  { term: 'Eggs', description: 'Chicken or duck eggs as a protein source' },
  { term: 'Whole milk / curd', description: 'Full-fat dairy milk, yogurt, or curd' },
  { term: 'Chicken / fish', description: 'Lean poultry or fish consumed regularly' },
  {
    term: 'Cruciferous',
    description: 'Cauliflower, cabbage, broccoli, and related vegetables',
  },
]

const NUTRITION_BREAKFAST_FREQUENCY_INFO: NutritionLogInfoItem[] = [
  { term: 'More than 5 times', description: 'A healthy homemade breakfast on most weekdays' },
  { term: 'Less than 5 times', description: 'A healthy homemade breakfast a few days per week' },
  { term: 'Do not have breakfast', description: 'Usually skips breakfast or eats outside food' },
]

const NUTRITION_CONSUMPTION_FREQUENCY_INFO: NutritionLogInfoItem[] = [
  { term: '1-2 times per day', description: 'Consumed once or twice every day' },
  { term: '2-3 times a week', description: 'Consumed a few times each week' },
  { term: 'Once a week or less', description: 'Consumed weekly or less often' },
  { term: '1-2 times per month', description: 'Consumed only a couple of times per month' },
  { term: 'Rarely or never', description: 'Almost never included in your diet' },
]

const NUTRITION_BAKED_GOODS_FREQUENCY_INFO: NutritionLogInfoItem[] = [
  { term: '4 or more times a week', description: 'Consumed four or more times weekly' },
  { term: '2-3 times a week', description: 'Consumed a few times each week' },
  { term: 'Once a week or less', description: 'Consumed weekly or less often' },
  { term: '1-2 times per month', description: 'Consumed only a couple of times per month' },
  { term: 'Rarely or never', description: 'Almost never included in your diet' },
]

const NUTRITION_IODIZED_SALT_INFO: NutritionLogInfoItem[] = [
  {
    term: 'Iodized salt',
    description: 'Table salt fortified with iodine to support thyroid health',
  },
  { term: 'Yes', description: 'You regularly use iodized salt in cooking or at the table' },
  { term: 'No', description: 'You use non-iodized or unfortified salt' },
]

const NUTRITION_EXTRA_SALT_INFO: NutritionLogInfoItem[] = [
  { term: 'Never', description: 'You do not add extra salt beyond what is in the recipe' },
  { term: 'Rarely', description: 'You occasionally add extra salt while eating' },
  { term: 'Usually', description: 'You often add extra salt to most meals' },
]

const NUTRITION_COFFEE_TEA_INTAKE_INFO: NutritionLogInfoItem[] = [
  { term: '1-2 cups per day', description: 'One to two cups of coffee or tea daily' },
  { term: '0-1 cups per day', description: 'Less than one cup per day on average' },
  { term: 'I do not drink coffee or tea', description: 'No regular coffee or tea consumption' },
  { term: 'More than 2 cups per day', description: 'More than two cups daily' },
  { term: '2-3 time a week', description: 'Coffee or tea a few times per week' },
]

const NUTRITION_COFFEE_TEA_TYPE_INFO: NutritionLogInfoItem[] = [
  { term: 'Tea with sugar & milk', description: 'Sweetened milk tea' },
  { term: 'Green tea', description: 'Unsweetened green tea' },
  { term: 'Black coffee', description: 'Coffee without milk or sugar' },
  { term: 'Black tea', description: 'Tea without milk or sugar' },
  { term: 'Milk tea without sugar', description: 'Milk tea with no added sugar' },
  { term: 'Coffee with sugar & milk', description: 'Sweetened milk coffee' },
  { term: 'Milk coffee without sugar', description: 'Milk coffee with no added sugar' },
]

const NUTRITION_WATER_INTAKE_INFO: NutritionLogInfoItem[] = [
  { term: '8+ glasses', description: 'Eight or more 250 ml glasses of water per day' },
  { term: '8 glasses', description: 'About two litres of water per day' },
  { term: '6 glasses', description: 'About one and a half litres per day' },
  { term: '4 glasses', description: 'About one litre per day' },
  { term: '2 glasses', description: 'About half a litre per day' },
  { term: '<2 glasses', description: 'Less than half a litre per day' },
]

const NUTRITION_ILLNESS_FREQUENCY_INFO: NutritionLogInfoItem[] = [
  { term: '1-2 times', description: 'Falls sick once or twice in a year' },
  { term: '2-3 times', description: 'Falls sick two to three times in a year' },
  { term: '4-5 times', description: 'Falls sick four to five times in a year' },
  { term: 'Rarely or never', description: 'Almost never falls sick in a year' },
  { term: 'More than 6 times', description: 'Falls sick more than six times in a year' },
]

/** Info glossary keyed by question number (Q1 = index 0 … Q15 = index 14) */
export const NUTRITION_LOG_INFO_BY_QUESTION: NutritionLogInfoItem[][] = [
  NUTRITION_DIET_TYPE_INFO,
  NUTRITION_DAILY_FOOD_GROUPS_INFO,
  NUTRITION_BREAKFAST_FREQUENCY_INFO,
  NUTRITION_CONSUMPTION_FREQUENCY_INFO,
  NUTRITION_CONSUMPTION_FREQUENCY_INFO,
  NUTRITION_BAKED_GOODS_FREQUENCY_INFO,
  NUTRITION_BAKED_GOODS_FREQUENCY_INFO,
  NUTRITION_IODIZED_SALT_INFO,
  NUTRITION_EXTRA_SALT_INFO,
  NUTRITION_COFFEE_TEA_INTAKE_INFO,
  NUTRITION_COFFEE_TEA_TYPE_INFO,
  NUTRITION_BAKED_GOODS_FREQUENCY_INFO,
  NUTRITION_BAKED_GOODS_FREQUENCY_INFO,
  NUTRITION_WATER_INTAKE_INFO,
  NUTRITION_ILLNESS_FREQUENCY_INFO,
]
