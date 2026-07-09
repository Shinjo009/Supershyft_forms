import type { IllnessFrequencyOption } from '../../data/nutritionLogQuestions'
import type { MeterReading } from './consumptionFrequencyConfig'

export const ILLNESS_FREQUENCY_METER: Record<IllnessFrequencyOption, MeterReading> = {
  'rarely-never': { value: 0, fillRatio: 0, unit: 'TIMES/YEAR' },
  '1-2-times': { value: 2, fillRatio: 2 / 5, unit: 'TIMES/YEAR' },
  '2-3-times': { value: 3, fillRatio: 3 / 5, unit: 'TIMES/YEAR' },
  '4-5-times': { value: 5, fillRatio: 1, unit: 'TIMES/YEAR' },
  'more-than-6': { value: 7, fillRatio: 1, unit: 'TIMES/YEAR' },
}

/** Figma 5701:16288 — 2-col grid with a single pill on the last row */
export const ILLNESS_FREQUENCY_GRID_ROWS: IllnessFrequencyOption[][] = [
  ['1-2-times', '2-3-times'],
  ['4-5-times', 'rarely-never'],
  ['more-than-6'],
]
