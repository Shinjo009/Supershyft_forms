import type { SleepDurationOption } from '../../data/lifestyleHabitsQuestions'

/** How much of the moon is lit (0 → thin glow, 1 → full) */
export const SLEEP_MOON_FILL: Record<SleepDurationOption | 'unselected', number> = {
  unselected: 0.02,
  'under-5': 0.1,
  '5': 0.28,
  '6': 0.42,
  '7': 0.58,
  '8': 0.72,
  '9-plus': 1,
}

export const SLEEP_PILL_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 98 36' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(4.9 0 0 1.8 49 18)'><stop stop-color='rgba(255,136,0,1)' offset='0.46635'/><stop stop-color='rgba(233,93,92,0.5)' offset='1'/></radialGradient></defs></svg>\")"
