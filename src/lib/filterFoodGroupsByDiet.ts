import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
  type QuestionnaireQuestion,
} from '../api/questionnaire'

type DietFilter = 'hide_eggs_and_meat' | 'hide_meat' | 'none'

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[_/|-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

/**
 * Resolve a stored diet answer (often a numeric option_value) to
 * "value + label" text so filters can match Jain / Vegetarian / etc.
 */
export function resolveDietAnswerText(
  dietAnswer: unknown,
  dietQuestion?: QuestionnaireQuestion | null,
): string {
  const raw = Array.isArray(dietAnswer) ? dietAnswer[0] : dietAnswer
  if (raw == null || raw === '') return ''

  const value = String(raw).trim()
  const options = Array.isArray(dietQuestion?.options) ? dietQuestion.options : []
  if (options.length === 0) return value

  const matched = options.find((option) => {
    const optionValue = getOptionValue(option)
    const optionLabel = getOptionLabel(option)
    return (
      normalize(optionValue) === normalize(value) ||
      normalize(optionLabel) === normalize(value)
    )
  })

  if (!matched) return value
  return `${getOptionValue(matched)} ${getOptionLabel(matched)}`
}

/** Map diet answer (option value or label) to which food-group options to hide. */
export function dietFilterFromAnswer(dietAnswer: unknown): DietFilter {
  const raw = Array.isArray(dietAnswer) ? dietAnswer[0] : dietAnswer
  if (raw == null || raw === '') return 'none'

  const t = normalize(String(raw))

  // Non-vegetarian / flexitarian → show everything.
  if (
    t.includes('non veg') ||
    t.includes('nonveg') ||
    t.includes('non-vegetarian') ||
    t.includes('flexitarian')
  ) {
    return 'none'
  }

  // Jain or vegetarian (not non-veg).
  if (t.includes('jain') || t === 'veg' || t.includes('vegetarian')) {
    return 'hide_eggs_and_meat'
  }

  // Eggetarian → hide chicken / fish / meat.
  if (t.includes('eggetarian') || t.includes('eggitarian')) {
    return 'hide_meat'
  }

  // Pescatarian → hide meat (chicken / meat; combined chicken/fish also hidden).
  if (t.includes('pescatarian') || t.includes('pescetarian')) {
    return 'hide_meat'
  }

  return 'none'
}

function isEggOption(text: string): boolean {
  const t = normalize(text)
  // Avoid matching unrelated words; require egg(s) as a token-ish match.
  return /\beggs?\b/.test(t) || t === 'eggs' || t.includes(' egg')
}

function isMeatOrChickenFishOption(text: string): boolean {
  const t = normalize(text)
  return (
    t.includes('chicken') ||
    t.includes('fish') ||
    t.includes('meat') ||
    t.includes('poultry')
  )
}

function optionText(option: QuestionnaireOption): string {
  return `${getOptionValue(option)} ${getOptionLabel(option)}`
}

/**
 * Filter daily food-group options based on the prior diet-type answer.
 * Jain / Vegetarian → hide Eggs + Chicken/Fish
 * Eggetarian / Pescatarian → hide Chicken/Fish (meat)
 */
export function filterFoodGroupOptionsByDiet<T extends QuestionnaireOption>(
  options: T[],
  dietAnswer: unknown,
  dietQuestion?: QuestionnaireQuestion | null,
): T[] {
  const resolved = resolveDietAnswerText(dietAnswer, dietQuestion)
  const filter = dietFilterFromAnswer(resolved)
  if (filter === 'none') return options

  return options.filter((option) => {
    const text = optionText(option)
    if (filter === 'hide_eggs_and_meat') {
      return !isEggOption(text) && !isMeatOrChickenFishOption(text)
    }
    return !isMeatOrChickenFishOption(text)
  })
}

/** Same filter for static `{ id, label }` food-group lists. */
export function filterFoodGroupItemsByDiet<T extends { id: string; label: string }>(
  items: T[],
  dietAnswer: unknown,
): T[] {
  const filter = dietFilterFromAnswer(dietAnswer)
  if (filter === 'none') return items

  return items.filter((item) => {
    const text = `${item.id} ${item.label}`
    if (filter === 'hide_eggs_and_meat') {
      return !isEggOption(text) && !isMeatOrChickenFishOption(text)
    }
    return !isMeatOrChickenFishOption(text)
  })
}
