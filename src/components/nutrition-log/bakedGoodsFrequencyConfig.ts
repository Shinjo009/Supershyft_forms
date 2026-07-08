import type { BakedGoodsFrequencyOption } from '../../data/nutritionLogQuestions'
import type { MeterReading } from './consumptionFrequencyConfig'

export const BAKED_GOODS_FREQUENCY_METER: Record<
  BakedGoodsFrequencyOption,
  MeterReading
> = {
  '4-or-more-per-week': { value: 4, fillRatio: 4 / 5, unit: 'TIMES/WEEK' },
  '2-3-per-week': { value: 3, fillRatio: 3 / 5, unit: 'TIMES/WEEK' },
  'once-week-or-less': { value: 1, fillRatio: 1 / 5, unit: 'TIMES/WEEK' },
  '1-2-per-month': { value: 2, fillRatio: 2 / 8, unit: 'TIMES/MONTH' },
  'rarely-never': { value: 0, fillRatio: 0, unit: 'TIMES/MONTH' },
}
