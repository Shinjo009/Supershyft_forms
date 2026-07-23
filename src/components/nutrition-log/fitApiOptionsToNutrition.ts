import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
} from '../../api/questionnaire'
import type { MeterReading } from './consumptionFrequencyConfig'
import {
  WATER_BOTTLE_MAX_LITERS,
  WATER_GLASS_VOLUME_L,
  type WaterIntakeReading,
} from './waterIntakeConfig'

export type NutritionApiOption = {
  id: string
  label: string
}

/** Collect unique API options in backend order. */
export function collectNutritionApiOptions(options: QuestionnaireOption[]): NutritionApiOption[] {
  const items: NutritionApiOption[] = []
  const seen = new Set<string>()

  for (const option of options) {
    const value = getOptionValue(option)
    const label = getOptionLabel(option) || value
    if (!value && !label) continue
    const key = value || label
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ id: value || label, label })
  }

  return items
}

function readingForGlasses(glasses: number): WaterIntakeReading {
  const liters = glasses * WATER_GLASS_VOLUME_L
  return {
    liters,
    fillRatio: Math.min(1, liters / WATER_BOTTLE_MAX_LITERS),
  }
}

/** Infer circular-meter reading from option copy (works for any backend label set). */
export function inferConsumptionMeterReading(
  label: string,
  index: number,
  total: number,
  fallbackUnit = 'TIMES/MONTH',
): MeterReading {
  const text = label.toLowerCase()

  if (
    text.includes('rare') ||
    text.includes('never') ||
    text.includes('skip') ||
    text.includes('none') ||
    text === 'no'
  ) {
    return { value: 0, fillRatio: 0, unit: fallbackUnit }
  }

  if (text.includes('per day') || text.includes('/day') || text.includes('a day') || text.includes('daily')) {
    const match = text.match(/(\d+)/)
    const value = match ? Number(match[1]) : 1
    return { value, fillRatio: 1, unit: 'TIMES/DAY' }
  }

  if (text.includes('week')) {
    const match = text.match(/(\d+)/)
    const value = match ? Number(match[1]) : text.includes('weekly') ? 1 : 2
    return { value, fillRatio: Math.min(1, value / 7), unit: 'TIMES/WEEK' }
  }

  if (text.includes('month')) {
    const match = text.match(/(\d+)/)
    const value = match ? Number(match[1]) : 1
    return { value, fillRatio: Math.min(1, value / 12), unit: 'TIMES/MONTH' }
  }

  if (text.includes('year')) {
    const match = text.match(/(\d+)/)
    const value = match ? Number(match[1]) : 1
    return { value, fillRatio: Math.min(1, value / 6), unit: 'TIMES/YEAR' }
  }

  const n = Math.max(total, 1)
  const fillRatio = n === 1 ? 0.5 : 1 - index / (n - 1)
  return {
    value: Math.max(0, Math.round(fillRatio * 10)),
    fillRatio,
    unit: fallbackUnit,
  }
}

export function buildConsumptionMeterFromApi(
  options: QuestionnaireOption[],
  fallbackUnit = 'TIMES/MONTH',
): {
  items: NutritionApiOption[]
  meter: Record<string, MeterReading>
} {
  const items = collectNutritionApiOptions(options)
  const meter: Record<string, MeterReading> = {}
  items.forEach((item, index) => {
    meter[item.id] = inferConsumptionMeterReading(item.label, index, items.length, fallbackUnit)
  })
  return { items, meter }
}

export function buildBreakfastMeterFromApi(options: QuestionnaireOption[]): {
  items: NutritionApiOption[]
  meter: Record<string, MeterReading>
} {
  const items = collectNutritionApiOptions(options)
  const meter: Record<string, MeterReading> = {}

  items.forEach((item, index) => {
    const text = item.label.toLowerCase()
    if (text.includes('skip') || text.includes('no breakfast') || text.includes('never')) {
      meter[item.id] = { value: 0, fillRatio: 0, unit: 'DAYS/WEEK' }
      return
    }
    if (
      text.includes('more than 5') ||
      text.includes('5+') ||
      text.includes('almost every') ||
      text.includes('every day')
    ) {
      meter[item.id] = { value: 5, fillRatio: 5 / 7, unit: 'DAYS/WEEK' }
      return
    }
    if (text.includes('less than 5') || text.includes('< 5') || text.includes('<5')) {
      meter[item.id] = { value: 3, fillRatio: 3 / 7, unit: 'DAYS/WEEK' }
      return
    }
    const match = text.match(/(\d+)/)
    if (match) {
      const value = Number(match[1])
      meter[item.id] = { value, fillRatio: Math.min(1, value / 7), unit: 'DAYS/WEEK' }
      return
    }
    meter[item.id] = inferConsumptionMeterReading(item.label, index, items.length, 'DAYS/WEEK')
  })

  return { items, meter }
}

export function buildIllnessMeterFromApi(options: QuestionnaireOption[]): {
  items: NutritionApiOption[]
  meter: Record<string, MeterReading>
} {
  return buildConsumptionMeterFromApi(options, 'TIMES/YEAR')
}

export function buildWaterReadingsFromApi(options: QuestionnaireOption[]): {
  items: NutritionApiOption[]
  readings: Record<string, WaterIntakeReading>
} {
  const items = collectNutritionApiOptions(options)
  const readings: Record<string, WaterIntakeReading> = {}

  items.forEach((item, index) => {
    const text = `${item.id} ${item.label}`.toLowerCase()
    if (
      text.includes('8+') ||
      text.includes('8 plus') ||
      text.includes('more than 8') ||
      text.includes('over 8')
    ) {
      readings[item.id] = readingForGlasses(10)
      return
    }
    if (text.includes('< 2') || text.includes('<2') || text.includes('less than 2') || text.includes('under 2')) {
      readings[item.id] = readingForGlasses(1)
      return
    }
    const match = text.match(/(\d+)/)
    if (match) {
      readings[item.id] = readingForGlasses(Number(match[1]))
      return
    }
    const n = Math.max(items.length, 1)
    const glasses = Math.max(1, Math.round(8 * (1 - index / n)))
    readings[item.id] = readingForGlasses(glasses)
  })

  return { items, readings }
}
