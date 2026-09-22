const ADDRESS_NOT_SERVICEABLE = 'Address not serviceable.'

const TECHNICAL_SERVICEABILITY_PATTERNS = [
  /could not geocode/i,
  /geocode/i,
  /lat[\s/-]*long/i,
  /latitude[\s/-]*longitude/i,
]

export function toUserFacingServiceabilityMessage(message: string | undefined | null): string {
  const trimmed = typeof message === 'string' ? message.trim() : ''
  if (!trimmed) return ADDRESS_NOT_SERVICEABLE

  if (TECHNICAL_SERVICEABILITY_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return ADDRESS_NOT_SERVICEABLE
  }

  return trimmed
}
