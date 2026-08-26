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

function parseLabelNumbers(text: string): number[] {
  return [...text.matchAll(/(\d+)/g)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value))
}

/** Pick a display number from option copy (upper bound for ranges, special-cases for once/less/more). */
function representativeFrequencyValue(text: string, numbers: number[]): number | null {
  const lower = text.toLowerCase()
  if (
    lower.includes('rare') ||
    lower.includes('never') ||
    lower.includes('skip') ||
    lower.includes('none') ||
    lower === 'no'
  ) {
    return 0
  }

  if (lower.includes('once') || lower.includes('or less') || lower.includes('less than') || lower.includes('under')) {
    if (numbers.length > 0) return numbers[0]
    if (lower.includes('once')) return 1
    return 1
  }

  if (
    lower.includes('more than') ||
    lower.includes('or more') ||
    lower.includes('over ') ||
    /\d+\s*\+/.test(lower)
  ) {
    return (numbers[0] ?? 6) + 1
  }

  if (numbers.length >= 2) return numbers[numbers.length - 1]
  if (numbers.length === 1) return numbers[0]
  return null
}

function unitFillDenominator(unit: string): number {
  const normalized = unit.toUpperCase()
  if (normalized.includes('DAY')) return 3
  if (normalized.includes('WEEK')) return 7
  if (normalized.includes('MONTH')) return 8
  if (normalized.includes('YEAR')) return 6
  return 6
}

/** Infer circular-meter reading from option copy (works for any backend label set). */
export function inferConsumptionMeterReading(
  label: string,
  index: number,
  total: number,
  fallbackUnit = 'TIMES/MONTH',
): MeterReading {
  const text = label.toLowerCase()
  const numbers = parseLabelNumbers(text)

  if (
    text.includes('rare') ||
    text.includes('never') ||
    text.includes('skip') ||
    text.includes('none') ||
    text === 'no'
  ) {
    return { value: 0, fillRatio: 0, unit: fallbackUnit }
  }

  let unit = fallbackUnit
  if (text.includes('per day') || text.includes('/day') || text.includes('a day') || text.includes('daily')) {
    unit = 'TIMES/DAY'
  } else if (text.includes('week') || text.includes('weekly')) {
    unit = 'TIMES/WEEK'
  } else if (text.includes('month') || text.includes('monthly')) {
    unit = 'TIMES/MONTH'
  } else if (text.includes('year') || text.includes('yearly') || text.includes('annual')) {
    unit = 'TIMES/YEAR'
  }

  const value = representativeFrequencyValue(text, numbers)
  if (value != null) {
    const denom = unitFillDenominator(unit)
    return {
      value,
      fillRatio: value <= 0 ? 0 : Math.min(1, value / denom),
      unit,
    }
  }

  // Last resort: position in the option list (higher index ≈ lower frequency).
  const n = Math.max(total, 1)
  const fillRatio = n === 1 ? 0.5 : 1 - index / (n - 1)
  const denom = unitFillDenominator(fallbackUnit)
  return {
    value: Math.max(0, Math.round(fillRatio * denom)),
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
    if (
      text.includes('skip') ||
      text.includes('no breakfast') ||
      text.includes('not have breakfast') ||
      text.includes('do not have') ||
      text.includes("don't have") ||
      text.includes('never')
    ) {
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
    // Prefer label over id — API option values are often scores/codes, not glass counts.
    const label = item.label.toLowerCase()
    const id = item.id.toLowerCase()
    const text = `${label} ${id}`

    if (
      text.includes('8+') ||
      text.includes('8 plus') ||
      text.includes('more than 8') ||
      text.includes('over 8')
    ) {
      readings[item.id] = readingForGlasses(10)
      return
    }
    if (
      text.includes('< 2') ||
      text.includes('<2') ||
      text.includes('less than 2') ||
      text.includes('under 2')
    ) {
      readings[item.id] = readingForGlasses(1)
      return
    }

    // 1 glass = 250 ml → parse glass count from the label when possible.
    const glassesMatch =
      label.match(/(\d+)\s*glasses?/) || label.match(/(\d+)/) || id.match(/^(\d+)$/)
    if (glassesMatch) {
      readings[item.id] = readingForGlasses(Number(glassesMatch[1]))
      return
    }

    const n = Math.max(items.length, 1)
    const glasses = Math.max(1, Math.round(8 * (1 - index / n)))
    readings[item.id] = readingForGlasses(glasses)
  })

  return { items, readings }
}
