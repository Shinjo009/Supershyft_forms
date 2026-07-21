import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
  type QuestionnaireQuestion,
} from '../api/questionnaire'

/** Detect Family History Q1 — Inland / Coastal location cards. */
export function isFamilyHistoryLocationQuestion(question: QuestionnaireQuestion): boolean {
  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 2) return false

  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasInland = labels.some((label) => label.includes('inland'))
  const hasCoastal = labels.some((label) => label.includes('coastal'))
  if (hasInland && hasCoastal) return true

  const key = String(question.question_key || '').toLowerCase()
  if (key.includes('location') || key.includes('lived') || key.includes('residence')) {
    return hasInland || hasCoastal
  }

  const text = String(question.question_text || '').toLowerCase()
  return text.includes('lived most of your life') && (hasInland || hasCoastal)
}

export function resolveLocationCardKind(
  option: QuestionnaireOption,
): 'inland' | 'coastal' | null {
  const label = getOptionLabel(option).toLowerCase()
  const value = getOptionValue(option).toLowerCase()
  const haystack = `${label} ${value}`
  if (haystack.includes('inland')) return 'inland'
  if (haystack.includes('coastal')) return 'coastal'
  return null
}

/** Detect Lifestyle Q1 — continuous sit duration dial. */
export function isLifestyleSitDurationQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (text.includes('sit continuously') || key.includes('sit_duration') || key.includes('sitting')) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 3) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasUnder1 = labels.some((label) => label.includes('< 1') || label.includes('under 1') || label.includes('<1'))
  const has1to4 = labels.some((label) => label.includes('1-4') || label.includes('1 – 4') || label.includes('1 to 4'))
  const has4plus = labels.some((label) => label.includes('4h+') || label.includes('4+') || label.includes('more than 4'))
  return hasUnder1 && has1to4 && has4plus
}

/** Detect Nutrition Q1 — primary diet type pills. */
export function isNutritionDietTypeQuestion(question: QuestionnaireQuestion): boolean {
  const text = String(question.question_text || '').toLowerCase()
  const key = String(question.question_key || '').toLowerCase()
  if (
    text.includes('type of diet') ||
    text.includes('primarily consume') ||
    key.includes('diet_type') ||
    key.includes('diet-type')
  ) {
    return true
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < 3) return false
  const labels = options.map((option) => getOptionLabel(option).toLowerCase())
  const hasVeg = labels.some((label) => label === 'veg' || label.includes('vegetarian'))
  const hasNonVeg = labels.some((label) => label.includes('non-veg') || label.includes('non veg'))
  return hasVeg && hasNonVeg
}
