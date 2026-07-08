export type LifestyleQuestionPreview = {
  line1: string
  line2: string
}

export type SitDurationOption = 'under-1h' | '4h-plus' | '1-4h'

export type PhysicalActivityOption = 'rare' | 'under-30-min' | '30-60m' | '60-plus'

export type WeeklyLeisureOption = 'rarely-never' | 'under-1h' | '1-3h' | '4-8h'

export type ActivityIntensityOption = 'low' | 'moderate' | 'high'

export type DailyWalkingOption =
  | 'under-15m'
  | '15-30m'
  | '30-60m'
  | '1-2h'
  | '2h-plus'

export type SleepDurationOption =
  | 'under-5'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9-plus'

export type AlcoholConsumptionOption =
  | '3-or-less'
  | 'quit'
  | '1-2-per-3-months'
  | 'never'
  | '1-2-per-6-months'
  | 'more-than-3'

export type SmokingFrequencyOption =
  | 'never'
  | 'quit'
  | '1-3-weekly'
  | '1-2-monthly'
  | '4-5-monthly'
  | '5-7-weekly'
  | 'more-than-7-weekly'

export type HealthWellnessPriorityOption =
  | 'weight-loss'
  | 'building-muscle'
  | 'increase-energy'
  | 'improving-metabolic'
  | 'improving-endurance'
  | 'increasing-strength'

export type LifestyleCommitmentOption =
  | 'increasing-activity'
  | 'forming-habits'
  | 'reducing-diet'

export type WellnessPriorityRow = {
  options: HealthWellnessPriorityOption[]
  fullWidth?: boolean
}

export const LIFESTYLE_HABITS_TOTAL_QUESTIONS = 10

export function lifestyleHabitsProgressPercent(questionIndex: number): number {
  return Math.round(((questionIndex + 1) / LIFESTYLE_HABITS_TOTAL_QUESTIONS) * 100)
}

export const LIFESTYLE_HABITS_NEXT_PREVIEWS: LifestyleQuestionPreview[] = [
  {
    line1: 'How much time do you spend engaging in',
    line2: 'physical activity or exercise daily?',
  },
  {
    line1: 'On a typical week, how much time do you',
    line2: 'dedicate to leisure activities, workouts or sports?',
  },
  {
    line1: 'On an average week, how would you',
    line2: 'rate the intensity of your activities or workouts?',
  },
  {
    line1: 'How much time do you spend actively',
    line2: 'walking each day?',
  },
  {
    line1: 'What is your average duration of',
    line2: 'good-quality sleep?',
  },
  {
    line1: 'What is your alcohol consumption?',
    line2: '',
  },
  {
    line1: 'How often do you smoke cigarettes',
    line2: 'or tobacco?',
  },
  {
    line1: 'What are your primary health and',
    line2: 'wellness priorities?',
  },
  {
    line1: 'How often do you smoke cigarettes or',
    line2: 'tobacco?',
  },
  {
    line1: 'Do any of your close blood relatives',
    line2: '(i.e., parents or siblings) have the following health conditions?',
  },
]

export const SIT_DURATION_OPTIONS: {
  id: SitDurationOption
  label: string
  centerLabel: string
}[] = [
  { id: 'under-1h', label: '< 1 h', centerLabel: '< 1 hr' },
  { id: '4h-plus', label: '4h+', centerLabel: '4h+' },
  { id: '1-4h', label: '1-4 h', centerLabel: '1-4 h' },
]

export const PHYSICAL_ACTIVITY_OPTIONS: {
  id: PhysicalActivityOption
  label: string
  centerLabel: string
}[] = [
  { id: 'rare', label: 'Rare', centerLabel: 'Rare' },
  { id: 'under-30-min', label: '< 30 min', centerLabel: '< 30 m' },
  { id: '30-60m', label: '30-60 m', centerLabel: '30-60 m' },
  { id: '60-plus', label: '60+ mins', centerLabel: '60+ m' },
]

export const WEEKLY_LEISURE_OPTIONS: {
  id: WeeklyLeisureOption
  label: string
  centerLabel: string
}[] = [
  { id: 'rarely-never', label: 'Rarely or never', centerLabel: 'Rare' },
  { id: 'under-1h', label: 'Less than 1 hour', centerLabel: '< 1 h' },
  { id: '1-3h', label: '1-3 hours', centerLabel: '1-3 h' },
  { id: '4-8h', label: '4-8 hours', centerLabel: '4-8 h' },
]

export const ACTIVITY_INTENSITY_OPTIONS: {
  id: ActivityIntensityOption
  label: string
  activeBars: number
}[] = [
  { id: 'low', label: 'Low', activeBars: 5 },
  { id: 'moderate', label: 'Moderate', activeBars: 10 },
  { id: 'high', label: 'High', activeBars: 15 },
]

export const DAILY_WALKING_OPTIONS: {
  id: DailyWalkingOption
  label: string
  centerLabel: string
}[] = [
  { id: 'under-15m', label: '< 15 m', centerLabel: '< 15 m' },
  { id: '15-30m', label: '15-30 m', centerLabel: '15-30 m' },
  { id: '30-60m', label: '30-60 m', centerLabel: '30-60 m' },
  { id: '1-2h', label: '1-2 h', centerLabel: '1-2 h' },
  { id: '2h-plus', label: '2h+', centerLabel: '2h+' },
]

export const SLEEP_DURATION_OPTIONS: {
  id: SleepDurationOption
  label: string
}[] = [
  { id: 'under-5', label: '<5 hrs' },
  { id: '5', label: '5 hrs' },
  { id: '6', label: '6 hrs' },
  { id: '7', label: '7 hrs' },
  { id: '8', label: '8 hrs' },
  { id: '9-plus', label: '9+ hrs' },
]

export const ALCOHOL_CONSUMPTION_OPTIONS: {
  id: AlcoholConsumptionOption
  label: string
}[] = [
  { id: '3-or-less', label: '3 servings per week or less' },
  { id: 'quit', label: 'I quit alcohol' },
  { id: '1-2-per-3-months', label: '1-2 times in 3 months' },
  { id: 'never', label: 'I do not drink alcohol' },
  { id: '1-2-per-6-months', label: '1-2 times in 6 months' },
  { id: 'more-than-3', label: 'More than 3 servings per week' },
]

/** Figma 5629:14868 — row layout for alcohol pills */
export const ALCOHOL_CONSUMPTION_ROWS: AlcoholConsumptionOption[][] = [
  ['3-or-less'],
  ['quit', '1-2-per-3-months'],
  ['never', '1-2-per-6-months'],
  ['more-than-3'],
]

export const SMOKING_FREQUENCY_OPTIONS: {
  id: SmokingFrequencyOption
  label: string
}[] = [
  { id: 'never', label: 'I do not smoke' },
  { id: 'quit', label: 'I quit smoking' },
  { id: '1-3-weekly', label: '1-3 times a week' },
  { id: '1-2-monthly', label: '1-2 times a month' },
  { id: '4-5-monthly', label: '4-5 times a month' },
  { id: '5-7-weekly', label: '5-7 times a week' },
  { id: 'more-than-7-weekly', label: 'More than 7 times a week' },
]

/** Figma 5657:50958 — 2-column grid with full-width last row */
export const SMOKING_FREQUENCY_ROWS: SmokingFrequencyOption[][] = [
  ['never', 'quit'],
  ['1-3-weekly', '1-2-monthly'],
  ['4-5-monthly', '5-7-weekly'],
  ['more-than-7-weekly'],
]

export const HEALTH_WELLNESS_PRIORITY_OPTIONS: {
  id: HealthWellnessPriorityOption
  label: string
}[] = [
  { id: 'weight-loss', label: 'Weight Loss' },
  { id: 'building-muscle', label: 'Building Muscle Mass' },
  { id: 'increase-energy', label: 'Increase Energy Levels' },
  { id: 'improving-metabolic', label: 'Improving Metabolic Health' },
  { id: 'improving-endurance', label: 'Improving Physical Endurance' },
  { id: 'increasing-strength', label: 'Increasing Strength' },
]

/** Figma 5657:51041 — mixed half/full-width rows */
export const HEALTH_WELLNESS_PRIORITY_ROWS: WellnessPriorityRow[] = [
  { options: ['weight-loss', 'building-muscle'] },
  { options: ['increase-energy'], fullWidth: true },
  { options: ['improving-metabolic'], fullWidth: true },
  { options: ['improving-endurance'], fullWidth: true },
  { options: ['increasing-strength'], fullWidth: false },
]

export const LIFESTYLE_COMMITMENT_OPTIONS: {
  id: LifestyleCommitmentOption
  label: string
}[] = [
  { id: 'increasing-activity', label: 'Increasing physical activity' },
  { id: 'forming-habits', label: 'Forming healthy habits' },
  { id: 'reducing-diet', label: 'Reducing daily diet intake' },
]
