export type LifestyleQuestionPreview = {
  line1: string
  line2: string
}

export type SitDurationOption = 'under-1h' | '4h-plus' | '1-4h'

export type PhysicalActivityOption = 'rare' | 'under-30-min' | '30-60m' | '60-plus'

export type WeeklyLeisureOption = 'rarely-never' | 'under-1h' | '1-3h' | '4-8h'

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
  ...Array.from({ length: LIFESTYLE_HABITS_TOTAL_QUESTIONS - 2 }, () => ({
    line1: '',
    line2: '',
  })),
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
