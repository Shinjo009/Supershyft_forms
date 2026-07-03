export type LifestyleQuestionPreview = {
  line1: string
  line2: string
}

export type SitDurationOption = 'under-1h' | '4h-plus' | '1-4h'

export const LIFESTYLE_HABITS_TOTAL_QUESTIONS = 10

export function lifestyleHabitsProgressPercent(questionIndex: number): number {
  return Math.round(((questionIndex + 1) / LIFESTYLE_HABITS_TOTAL_QUESTIONS) * 100)
}

export const LIFESTYLE_HABITS_NEXT_PREVIEWS: LifestyleQuestionPreview[] = [
  { line1: 'Next lifestyle question', line2: 'preview...' },
  ...Array.from({ length: LIFESTYLE_HABITS_TOTAL_QUESTIONS - 1 }, () => ({
    line1: '',
    line2: '',
  })),
]

export const SIT_DURATION_OPTIONS: {
  id: SitDurationOption
  label: string
  centerLabel: string
  arcDeg: number
}[] = [
  {
    id: 'under-1h',
    label: '< 1 h',
    centerLabel: '< 1 hr',
    arcDeg: 0,
  },
  {
    id: '4h-plus',
    label: '4h+',
    centerLabel: '4h+',
    arcDeg: 244,
  },
  {
    id: '1-4h',
    label: '1-4 h',
    centerLabel: '1-4 h',
    arcDeg: 106,
  },
]
