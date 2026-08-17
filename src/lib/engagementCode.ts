const DEFAULT_ENGAGEMENT_CODE = 'SUMU0226'

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

function isUsableEngagementCode(value: string): boolean {
  return value.length > 0 && value.toUpperCase() !== 'XXXXXXXX'
}

function parseGenderKey(gender?: string): 'male' | 'female' | undefined {
  const normalized = gender?.trim().toLowerCase()
  if (normalized === 'male' || normalized === 'm') return 'male'
  if (normalized === 'female' || normalized === 'f') return 'female'
  return undefined
}

const CITY_GENDER_ENGAGEMENT_CODES: Record<string, { male?: string; female?: string }> = {
  Pune: {
    male: import.meta.env.VITE_ENGAGEMENT_CODE_PUNE_MALE,
    female: import.meta.env.VITE_ENGAGEMENT_CODE_PUNE_FEMALE,
  },
  Bangalore: {
    male: import.meta.env.VITE_ENGAGEMENT_CODE_BANGALORE_MALE,
    female: import.meta.env.VITE_ENGAGEMENT_CODE_BANGALORE_FEMALE,
  },
  Gurugram: {
    male: import.meta.env.VITE_ENGAGEMENT_CODE_GURUGRAM_MALE,
    female: import.meta.env.VITE_ENGAGEMENT_CODE_GURUGRAM_FEMALE,
  },
  Hyderabad: {
    male: import.meta.env.VITE_ENGAGEMENT_CODE_HYDERABAD_MALE,
    female: import.meta.env.VITE_ENGAGEMENT_CODE_HYDERABAD_FEMALE,
  },
}

export function resolveEngagementCode(city?: string, gender?: string): string {
  const genderKey = parseGenderKey(gender)
  const fromCityGender = firstNonEmpty(
    city && genderKey ? CITY_GENDER_ENGAGEMENT_CODES[city.trim()]?.[genderKey] : undefined,
  )
  if (isUsableEngagementCode(fromCityGender)) return fromCityGender
  return firstNonEmpty(import.meta.env.VITE_ENGAGEMENT_CODE, DEFAULT_ENGAGEMENT_CODE)
}
