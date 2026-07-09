import type { WaterIntakeOption } from '../../data/nutritionLogQuestions'

export const WATER_GLASS_VOLUME_L = 0.25
export const WATER_BOTTLE_MAX_LITERS = 2.5
export const WATER_BOTTLE_BODY_HEIGHT = 241

export type WaterIntakeReading = {
  liters: number
  fillRatio: number
}

export const WATER_INTAKE_PILL_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 139 40' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(6.95 0 0 2 69.5 20)'><stop stop-color='rgba(222,245,255,1)' offset='0'/><stop stop-color='rgba(183,223,255,1)' offset='0.25'/><stop stop-color='rgba(143,200,255,1)' offset='0.5'/><stop stop-color='rgba(103,178,255,1)' offset='0.75'/><stop stop-color='rgba(63,156,255,1)' offset='1'/></radialGradient></defs></svg>\")"

const EMPTY_READING: WaterIntakeReading = { liters: 0, fillRatio: 0 }

function readingForGlasses(glasses: number): WaterIntakeReading {
  const liters = glasses * WATER_GLASS_VOLUME_L
  return {
    liters,
    fillRatio: Math.min(1, liters / WATER_BOTTLE_MAX_LITERS),
  }
}

export const WATER_INTAKE_READINGS: Record<WaterIntakeOption, WaterIntakeReading> = {
  '8-plus': readingForGlasses(10),
  '8': readingForGlasses(8),
  '6': readingForGlasses(6),
  '4': readingForGlasses(4),
  '2': readingForGlasses(2),
  'less-than-2': readingForGlasses(1),
}

export function waterIntakeReadingForSelection(
  selected: WaterIntakeOption | null,
): WaterIntakeReading {
  if (selected === null) {
    return EMPTY_READING
  }
  return WATER_INTAKE_READINGS[selected]
}

export function formatWaterLiters(liters: number): string {
  return `${liters.toFixed(1)}L`
}
