import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
} from '../../api/questionnaire'

/** Shared API ↔ dial-id binding for lifestyle radial dials. */
export function buildLifestyleDialBinding<T extends string>(
  options: QuestionnaireOption[],
  resolve: (raw: string) => T | null,
) {
  const valueByDialId = new Map<T, string>()
  const dialIdByStoredValue = new Map<string, T>()

  for (const option of options) {
    const value = getOptionValue(option)
    const label = getOptionLabel(option)
    const dialId =
      resolve(`${value} ${label}`) ?? resolve(value) ?? resolve(label)
    if (!dialId) continue

    if (value && !valueByDialId.has(dialId)) {
      valueByDialId.set(dialId, value)
    }
    if (value) dialIdByStoredValue.set(value, dialId)
    if (label) dialIdByStoredValue.set(label, dialId)
  }

  function resolveSelected(selectedValue: string | null | undefined): T | null {
    if (!selectedValue) return null

    const fromMap = dialIdByStoredValue.get(selectedValue)
    if (fromMap) return fromMap

    const direct = resolve(selectedValue)
    if (direct) return direct

    const normalized = selectedValue.trim().toLowerCase()
    const matched = options.find((option) => {
      const value = getOptionValue(option).trim().toLowerCase()
      const label = getOptionLabel(option).trim().toLowerCase()
      return value === normalized || label === normalized
    })

    return matched
      ? resolve(`${getOptionValue(matched)} ${getOptionLabel(matched)}`)
      : null
  }

  return { valueByDialId, resolveSelected }
}

export function normalizeOptionText(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Build designed option pills from API options, preferring backend display labels. */
export function buildLifestyleOptionItems<T extends string>(
  options: QuestionnaireOption[],
  resolve: (raw: string) => T | null,
  defaultLabels: Partial<Record<T, string>>,
): { id: T; label: string }[] {
  const items: { id: T; label: string }[] = []
  const seen = new Set<T>()

  for (const option of options) {
    const value = getOptionValue(option)
    const label = getOptionLabel(option)
    const dialId =
      resolve(`${value} ${label}`) ?? resolve(value) ?? resolve(label)
    if (!dialId || seen.has(dialId)) continue
    seen.add(dialId)
    items.push({
      id: dialId,
      label: label || defaultLabels[dialId] || dialId,
    })
  }

  return items
}
