import type { ConsumptionFrequencyOption } from '../../data/nutritionLogQuestions'

export type MeterReading = {
  value: number
  fillRatio: number
  unit: string
}

export const EMPTY_METER_READING: MeterReading = {
  value: 0,
  fillRatio: 0,
  unit: 'TIMES/MONTH',
}

export function meterReadingForSelection<T extends string>(
  selected: T | null,
  meter: Record<T, MeterReading>,
): MeterReading {
  if (selected === null) {
    return EMPTY_METER_READING
  }
  return meter[selected]
}

export const CONSUMPTION_FREQUENCY_METER: Record<
  ConsumptionFrequencyOption,
  MeterReading
> = {
  '1-2-per-day': { value: 2, fillRatio: 1, unit: 'TIMES/DAY' },
  '2-3-per-week': { value: 3, fillRatio: 3 / 5, unit: 'TIMES/WEEK' },
  'once-week-or-less': { value: 1, fillRatio: 1 / 5, unit: 'TIMES/WEEK' },
  '1-2-per-month': { value: 2, fillRatio: 2 / 8, unit: 'TIMES/MONTH' },
  'rarely-never': { value: 0, fillRatio: 0, unit: 'TIMES/MONTH' },
}
