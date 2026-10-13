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

const CITY_ENGAGEMENT_CODES: Record<string, string | undefined> = {
  Mumbai: import.meta.env.VITE_ENGAGEMENT_CODE_MUMBAI,
  Pune: import.meta.env.VITE_ENGAGEMENT_CODE_PUNE,
}

export function resolveEngagementCode(city?: string): string {
  const fromCity = firstNonEmpty(city ? CITY_ENGAGEMENT_CODES[city.trim()] : undefined)
  if (isUsableEngagementCode(fromCity)) return fromCity
  return firstNonEmpty(import.meta.env.VITE_ENGAGEMENT_CODE, DEFAULT_ENGAGEMENT_CODE)
}
