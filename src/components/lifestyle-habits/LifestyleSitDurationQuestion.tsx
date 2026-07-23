import type { SitDurationOption } from '../../data/lifestyleHabitsQuestions'
import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
} from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { SitDurationDial } from './SitDurationDial'

const SIT_DURATION_IDS: SitDurationOption[] = ['under-1h', '1-4h', '4h-plus']

/** Map an API option value/label onto the designed sit-duration dial ids. */
export function resolveSitDurationOption(
  option: QuestionnaireOption | string | null | undefined,
): SitDurationOption | null {
  if (option == null) return null
  const raw =
    typeof option === 'string'
      ? option
      : `${getOptionValue(option)} ${getOptionLabel(option)}`
  const text = raw.toLowerCase().replace(/\s+/g, ' ').trim()

  if (SIT_DURATION_IDS.includes(text as SitDurationOption)) {
    return text as SitDurationOption
  }
  if (
    text.includes('4h+') ||
    text.includes('4h +') ||
    text.includes('4+') ||
    text.includes('more than 4') ||
    text.includes('over 4') ||
    text.includes('> 4') ||
    text.includes('>4') ||
    text.includes('4 hours+') ||
    text.includes('4 hrs+')
  ) {
    return '4h-plus'
  }
  if (
    text.includes('1-4') ||
    text.includes('1 – 4') ||
    text.includes('1 to 4') ||
    text.includes('1–4') ||
    text.includes('1 - 4')
  ) {
    return '1-4h'
  }
  if (
    text.includes('< 1') ||
    text.includes('<1') ||
    text.includes('under 1') ||
    text.includes('less than 1') ||
    text.includes('under-1') ||
    text.includes('below 1')
  ) {
    return 'under-1h'
  }
  return null
}

/**
 * Resolve dial id from a stored API answer.
 * Prefer matching the original option (value alone is often a code like "1").
 */
export function resolveSitDurationFromAnswer(
  answer: string | null | undefined,
  options: QuestionnaireOption[] = [],
): SitDurationOption | null {
  if (!answer) return null

  const direct = resolveSitDurationOption(answer)
  if (direct) return direct

  const normalized = answer.trim().toLowerCase()
  const matched = options.find((option) => {
    const value = getOptionValue(option).trim().toLowerCase()
    const label = getOptionLabel(option).trim().toLowerCase()
    return value === normalized || label === normalized
  })

  return matched ? resolveSitDurationOption(matched) : null
}

/** Designed Lifestyle Q1 — sit duration radial dial driven by API options. */
export function LifestyleSitDurationQuestion({
  questionLabel,
  questionText,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
}: {
  questionLabel: string
  questionText: string
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
}) {
  const valueByDialId = new Map<SitDurationOption, string>()
  const dialIdByStoredValue = new Map<string, SitDurationOption>()

  for (const option of options) {
    const dialId = resolveSitDurationOption(option)
    const value = getOptionValue(option)
    const label = getOptionLabel(option)
    if (!dialId) continue

    if (value && !valueByDialId.has(dialId)) {
      valueByDialId.set(dialId, value)
    }
    if (value) dialIdByStoredValue.set(value, dialId)
    if (label) dialIdByStoredValue.set(label, dialId)
  }

  const selected =
    (selectedValue ? dialIdByStoredValue.get(selectedValue) : null) ??
    resolveSitDurationFromAnswer(selectedValue, options)

  return (
    <div className="flex w-full flex-col gap-16">
      <LifestyleHabitsQuestionHeader questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <p>{questionText}</p>
      </LifestyleHabitsQuestionHeader>

      <SitDurationDial
        selected={selected}
        onSelect={(dialId) => {
          const apiValue = valueByDialId.get(dialId) ?? dialId
          onSelect(apiValue)
        }}
      />
    </div>
  )
}
