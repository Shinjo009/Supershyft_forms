import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireQuestion,
  type QuestionnaireResponseItem,
} from '../../api/questionnaire'

export const MIN_HEIGHT_CM = 120
export const MAX_HEIGHT_CM = 215
export const MIN_HEIGHT_INCHES = 47
export const MAX_HEIGHT_INCHES = 83
export const DEFAULT_HEIGHT_CM = 165
export const DEFAULT_HEIGHT_FEET = 5
export const DEFAULT_HEIGHT_INCHES = 5

export const MIN_CIRCUMFERENCE_INCHES = 16
export const MAX_CIRCUMFERENCE_INCHES = 47
export const MIN_CIRCUMFERENCE_CM = 40
export const MAX_CIRCUMFERENCE_CM = 120
export const DEFAULT_CIRCUMFERENCE_INCHES = 20.6
export const DEFAULT_CIRCUMFERENCE_CM = 52.2
export const IN_TO_CM = 2.54

export const MIN_BODY_FAT = 5
export const MAX_BODY_FAT = 70
export const DEFAULT_BODY_FAT = 45
export const ANTHRO_QUESTION_COUNT = 5

export const ANTHRO_PROGRESS_COLOR = '#90DF9E'

export const ANTHRO_NEXT_BUTTON_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(2.5 0 0 2.5 25 25)'><stop stop-color='rgba(163,230,53,1)' offset='0'/><stop stop-color='rgba(4,47,46,1)' offset='1'/></radialGradient></defs></svg>\")"

export type AnthropometryPrimaryValues = {
  height: number
  weight: number | null
  waist: number
  heightUnit: string
  weightUnit: string
  waistUnit: string
  heightFeet: number
  heightInches: number
}

export type AnthropometryFollowupValues = {
  hipSize?: number
  bodyFat?: number
  hipUnit?: string
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function roundToWholeNumber(value: unknown, fallback = 0): number {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return fallback
  return Math.round(numericValue)
}

export function parseInitialWeight(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function isProvidedNumber(raw: unknown): boolean {
  if (raw == null || raw === '') return false
  const n = Number(raw)
  return Number.isFinite(n) && n > 0
}

export function normalizeUnitToken(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function isFeetInchesUnit(value: unknown): boolean {
  const token = normalizeUnitToken(value)
  return (
    token.includes('ftin') ||
    token.includes('feetinch') ||
    token.includes('footinch') ||
    token === 'ft' ||
    token === 'feet' ||
    token === 'foot' ||
    token.includes('feet') ||
    token.includes('foot')
  )
}

export function isCentimeterUnit(value: unknown): boolean {
  const token = normalizeUnitToken(value)
  return token === 'cm' || token.includes('centimeter') || token.includes('centimetre')
}

export function isInchUnit(value: unknown): boolean {
  const token = normalizeUnitToken(value)
  return token === 'in' || token === 'inch' || token.includes('inches')
}

export function isPoundUnit(value: unknown): boolean {
  const token = normalizeUnitToken(value)
  return token === 'lb' || token === 'lbs' || token.includes('pound')
}

export const MIN_WEIGHT_KG = 20
export const MAX_WEIGHT_KG = 120
export const MIN_WEIGHT_LB = 44
export const MAX_WEIGHT_LB = 265
export const DEFAULT_WEIGHT_KG = 50
export const KG_TO_LB = 2.20462

export function isKilogramUnit(value: unknown): boolean {
  const token = normalizeUnitToken(value)
  return token === 'kg' || token.includes('kilo')
}

export function getWeightRangeForUnit(unit: string): { min: number; max: number; defaultValue: number } {
  if (isPoundUnit(unit)) {
    return { min: MIN_WEIGHT_LB, max: MAX_WEIGHT_LB, defaultValue: Math.round(DEFAULT_WEIGHT_KG * KG_TO_LB) }
  }
  return { min: MIN_WEIGHT_KG, max: MAX_WEIGHT_KG, defaultValue: DEFAULT_WEIGHT_KG }
}

export function convertWeight(value: number, fromUnit: string, toUnit: string): number {
  if (isPoundUnit(fromUnit) === isPoundUnit(toUnit)) {
    const range = getWeightRangeForUnit(toUnit)
    return clamp(Math.round(value), range.min, range.max)
  }
  if (isPoundUnit(toUnit)) {
    return clamp(Math.round(value * KG_TO_LB), MIN_WEIGHT_LB, MAX_WEIGHT_LB)
  }
  return clamp(Math.round(value / KG_TO_LB), MIN_WEIGHT_KG, MAX_WEIGHT_KG)
}

export function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

export function convertCircumference(value: number, fromUnit: string, toUnit: string): number {
  const toCm = isCentimeterUnit(toUnit)
  const fromCm = isCentimeterUnit(fromUnit)
  if (toCm === fromCm) {
    const range = getCircumferenceRangeForUnit(toUnit)
    return clamp(roundToTenth(value), range.min, range.max)
  }
  if (toCm) {
    return clamp(roundToTenth(value * IN_TO_CM), MIN_CIRCUMFERENCE_CM, MAX_CIRCUMFERENCE_CM)
  }
  return clamp(roundToTenth(value / IN_TO_CM), MIN_CIRCUMFERENCE_INCHES, MAX_CIRCUMFERENCE_INCHES)
}

export function getCircumferenceRangeForUnit(unit: string): {
  min: number
  max: number
  defaultValue: number
} {
  if (isCentimeterUnit(unit)) {
    return {
      min: MIN_CIRCUMFERENCE_CM,
      max: MAX_CIRCUMFERENCE_CM,
      defaultValue: DEFAULT_CIRCUMFERENCE_CM,
    }
  }
  return {
    min: MIN_CIRCUMFERENCE_INCHES,
    max: MAX_CIRCUMFERENCE_INCHES,
    defaultValue: DEFAULT_CIRCUMFERENCE_INCHES,
  }
}

function getQuestionOptionLabel(option: QuestionnaireOption): string {
  return String(option?.display_name || option?.option_value || option?.label || '').trim()
}

export function extractUnitOptionsFromQuestion(question: QuestionnaireQuestion | null): string[] {
  const apiOptions = Array.isArray(question?.options)
    ? question.options.map(getQuestionOptionLabel).filter(Boolean)
    : []
  return [...new Set(apiOptions)]
}

export function prioritizeHeightUnitOptions(options: string[] = []): string[] {
  const normalizedOptions = options.filter(Boolean)
  if (normalizedOptions.length === 0) return ['Ft/In', 'Cm']

  const prioritized: string[] = []
  const feetOption = normalizedOptions.find((option) => isFeetInchesUnit(option))
  const cmOption = normalizedOptions.find((option) => isCentimeterUnit(option))
  prioritized.push(feetOption || 'Ft/In')
  prioritized.push(cmOption || 'Cm')

  for (const option of normalizedOptions) {
    if (!prioritized.some((existing) => normalizeUnitToken(existing) === normalizeUnitToken(option))) {
      prioritized.push(option)
    }
  }
  return prioritized
}

export function prioritizeCircumferenceUnitOptions(options: string[] = []): string[] {
  const normalizedOptions = options.filter(Boolean)
  if (normalizedOptions.length === 0) return ['In', 'cm']

  const prioritized: string[] = []
  const inchOption = normalizedOptions.find((option) => isInchUnit(option))
  const cmOption = normalizedOptions.find((option) => isCentimeterUnit(option))
  prioritized.push(inchOption || 'In')
  prioritized.push(cmOption || 'cm')

  for (const option of normalizedOptions) {
    if (!prioritized.some((existing) => normalizeUnitToken(existing) === normalizeUnitToken(option))) {
      prioritized.push(option)
    }
  }
  return prioritized
}

export function resolvePreferredUnitOption(
  options: string[] = [],
  preferredUnit = '',
  fallback = '-',
): string {
  if (!Array.isArray(options) || options.length === 0) return fallback

  const normalizedPreferred = normalizeUnitToken(preferredUnit)
  if (!normalizedPreferred) return options[0]

  const byExact = options.find((option) => normalizeUnitToken(option) === normalizedPreferred)
  if (byExact) return byExact

  const byPartial = options.find((option) => {
    const normalizedOption = normalizeUnitToken(option)
    return normalizedOption.includes(normalizedPreferred) || normalizedPreferred.includes(normalizedOption)
  })
  if (byPartial) return byPartial

  return options[0]
}

export function findQuestionByAliasesAndHints(
  questions: QuestionnaireQuestion[] = [],
  aliases: string[] = [],
  hints: string[] = [],
): QuestionnaireQuestion | null {
  if (!Array.isArray(questions) || questions.length === 0) return null

  const normalizedAliases = aliases.map((alias) => normalizeUnitToken(alias)).filter(Boolean)
  const normalizedHints = hints.map((hint) => normalizeUnitToken(hint)).filter(Boolean)

  const byExactKey = questions.find((question) => {
    const key = normalizeUnitToken(question?.question_key)
    return Boolean(key && normalizedAliases.includes(key))
  })
  if (byExactKey) return byExactKey

  const byPartialKey = questions.find((question) => {
    const key = normalizeUnitToken(question?.question_key)
    return Boolean(key && normalizedAliases.some((alias) => key.includes(alias) || alias.includes(key)))
  })
  if (byPartialKey) return byPartialKey

  return (
    questions.find((question) => {
      const questionText = normalizeUnitToken(question?.question_text)
      return Boolean(questionText && normalizedHints.some((hint) => questionText.includes(hint)))
    }) || null
  )
}

export function getQuestionText(
  questions: QuestionnaireQuestion[],
  keys: string[],
  hints: string[],
  fallback: string,
): string {
  return findQuestionByAliasesAndHints(questions, keys, hints)?.question_text || fallback
}

function normalizeQuestionType(questionType: string): string {
  return String(questionType || '')
    .trim()
    .toLowerCase()
}

function mapOptionLabelToValue(question: QuestionnaireQuestion, unitLabel: string): string {
  const options = Array.isArray(question.options) ? question.options : []
  const preferred = normalizeUnitToken(unitLabel)
  if (!preferred) return ''

  const matched = options.find((option) => {
    const value = normalizeUnitToken(getOptionValue(option))
    const label = normalizeUnitToken(getOptionLabel(option))
    return (
      value === preferred ||
      label === preferred ||
      value.includes(preferred) ||
      preferred.includes(value) ||
      label.includes(preferred) ||
      preferred.includes(label)
    )
  })
  return matched ? getOptionValue(matched) : ''
}

function buildScaleResponseItem(
  question: QuestionnaireQuestion,
  numericValue: unknown,
  unitLabel: string,
  opts?: { forceValueCmUnitZero?: boolean },
): QuestionnaireResponseItem | null {
  const questionId = Number(question.question_id || 0)
  if (questionId <= 0) return null
  const n = Number(numericValue)
  if (!Number.isFinite(n)) return null

  if (normalizeQuestionType(question.question_type) !== 'scale') {
    return { question_id: questionId, answer: String(n) }
  }

  const unitCode = opts?.forceValueCmUnitZero
    ? '0'
    : mapOptionLabelToValue(question, unitLabel) || getOptionValue(question.options?.[0] || {})
  if (!unitCode) return null

  return { question_id: questionId, answer: { value: n, unit: unitCode } }
}

export function buildAnthropometryResponses(
  questions: QuestionnaireQuestion[] = [],
  primary: AnthropometryPrimaryValues,
  followup: AnthropometryFollowupValues = {},
): QuestionnaireResponseItem[] {
  const merged = { ...primary, ...followup }
  const fieldMap: Array<{
    aliases: string[]
    textHints: string[]
    value: unknown
    unitLabel: string
    forceValueCmUnitZero?: boolean
    wholeNumber?: boolean
  }> = [
    {
      aliases: ['height'],
      textHints: ['height'],
      value: merged.height,
      unitLabel: merged.heightUnit,
      forceValueCmUnitZero: true,
      wholeNumber: true,
    },
    {
      aliases: ['weight'],
      textHints: ['weight', 'body weight'],
      value: merged.weight,
      unitLabel: merged.weightUnit,
    },
    {
      aliases: ['waist_circumference', 'waist'],
      textHints: ['waist'],
      value: merged.waist,
      unitLabel: merged.waistUnit,
      wholeNumber: true,
    },
    {
      aliases: ['hip_circumference', 'hip_size', 'hip'],
      textHints: ['hip'],
      value: merged.hipSize,
      unitLabel: merged.hipUnit || 'In',
      wholeNumber: true,
    },
    {
      aliases: ['body_fat_percentage', 'body_fat', 'fat_percentage'],
      textHints: ['body fat', 'bodyfat'],
      value: merged.bodyFat,
      unitLabel: '%',
    },
  ]

  return fieldMap
    .map((field) => {
      if (field.value == null || field.value === '') return null
      const question = findQuestionByAliasesAndHints(questions, field.aliases, field.textHints)
      if (!question) return null
      const value = field.wholeNumber ? roundToWholeNumber(field.value, 0) : field.value
      return buildScaleResponseItem(question, value, field.unitLabel, {
        forceValueCmUnitZero: field.forceValueCmUnitZero,
      })
    })
    .filter((item): item is QuestionnaireResponseItem => item != null)
}
