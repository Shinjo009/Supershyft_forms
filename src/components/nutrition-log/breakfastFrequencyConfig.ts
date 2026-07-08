import type { BreakfastFrequencyOption } from '../../data/nutritionLogQuestions'

export const NUTRITION_PILL_GRADIENT_NARROW =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 154 32' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(7.7 0 0 1.6 77 16)'><stop stop-color='rgba(222,245,255,1)' offset='0'/><stop stop-color='rgba(183,223,255,1)' offset='0.25'/><stop stop-color='rgba(143,200,255,1)' offset='0.5'/><stop stop-color='rgba(103,178,255,1)' offset='0.75'/><stop stop-color='rgba(63,156,255,1)' offset='1'/></radialGradient></defs></svg>\")"

export const BREAKFAST_FREQUENCY_METER: Record<
  BreakfastFrequencyOption,
  { value: number; fillRatio: number; unit: string }
> = {
  'more-than-5': { value: 5, fillRatio: 5 / 7, unit: 'DAYS/WEEK' },
  'less-than-5': { value: 3, fillRatio: 3 / 7, unit: 'DAYS/WEEK' },
  'no-breakfast': { value: 0, fillRatio: 0, unit: 'DAYS/WEEK' },
}
