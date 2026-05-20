export type OnboardUserForEngagementPayload = {
  age: number
  first_name: string
  last_name: string
  email: string
  phone: string
  gender: string
  blood_collection_date: string
  blood_collection_time_slot: string
  participants_employee_id: string
  participant_department: string
  participant_blood_group: string
  want_doctor_consultation: boolean
}

type ValidationErrorDetail = {
  loc?: Array<string | number>
  msg?: string
  type?: string
  input?: string
  ctx?: Record<string, unknown>
}

type ValidationErrorResponse = {
  detail?: ValidationErrorDetail[]
}

/** Legacy CBTW engagement — must never be used from the Celebal form. */
const LEGACY_CBTW_ENGAGEMENT_CODES = new Set(['CBMU0626'])

const DEFAULT_CELEBAL_ENGAGEMENT_CODE = {
  male: 'CBJP0626',
  female: 'CBJF0626',
} as const

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

function assertCelebalEngagementCode(code: string, source: string): string {
  const normalized = code.trim().toUpperCase()
  if (LEGACY_CBTW_ENGAGEMENT_CODES.has(normalized)) {
    throw new Error(
      `${source} uses legacy CBTW engagement "${code}". Remove VITE_ENGAGEMENT_CODE / VITE_CBTW_ENGAGEMENT_CODE from .env and hosting, then restart the dev server.`,
    )
  }
  return code.trim()
}

function warnIfLegacyEngagementEnvConfigured(): void {
  const legacyEnvValues = [
    ['VITE_ENGAGEMENT_CODE', import.meta.env.VITE_ENGAGEMENT_CODE],
    ['VITE_CELEBAL_ENGAGEMENT_CODE', import.meta.env.VITE_CELEBAL_ENGAGEMENT_CODE],
    ['VITE_CBTW_ENGAGEMENT_CODE', import.meta.env.VITE_CBTW_ENGAGEMENT_CODE],
    ['ENGAGEMENT_CODE', import.meta.env.ENGAGEMENT_CODE],
  ] as const

  for (const [name, value] of legacyEnvValues) {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (!trimmed) continue
    const upper = trimmed.toUpperCase()
    if (LEGACY_CBTW_ENGAGEMENT_CODES.has(upper)) {
      console.warn(`[onboard] ${name}=${trimmed} points at legacy CBTW engagement and is ignored.`)
    } else {
      console.warn(
        `[onboard] ${name} is set but ignored on Celebal form. Use VITE_CELEBAL_ENGAGEMENT_CODE_MALE / VITE_CELEBAL_ENGAGEMENT_CODE_FEMALE instead.`,
      )
    }
  }
}

/** Celebal-only engagement code from gender (never a single shared override). */
function resolveCelebalEngagementCode(gender: string): string {
  const normalized = gender.trim().toLowerCase()
  if (normalized === 'male') {
    return assertCelebalEngagementCode(
      firstNonEmpty(
        import.meta.env.VITE_CELEBAL_ENGAGEMENT_CODE_MALE,
        DEFAULT_CELEBAL_ENGAGEMENT_CODE.male,
      ),
      'Male engagement code',
    )
  }
  if (normalized === 'female') {
    return assertCelebalEngagementCode(
      firstNonEmpty(
        import.meta.env.VITE_CELEBAL_ENGAGEMENT_CODE_FEMALE,
        DEFAULT_CELEBAL_ENGAGEMENT_CODE.female,
      ),
      'Female engagement code',
    )
  }
  throw new Error('Celebal engagement code requires gender to be male or female.')
}

function parseValidationMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const response = data as ValidationErrorResponse
  if (!Array.isArray(response.detail) || response.detail.length === 0) return null

  const messages = response.detail
    .map((item) => item.msg)
    .filter((msg): msg is string => typeof msg === 'string' && msg.length > 0)

  return messages.length > 0 ? messages.join(', ') : null
}

export async function onboardUserForEngagement(
  payload: OnboardUserForEngagementPayload,
): Promise<string> {
  warnIfLegacyEngagementEnvConfigured()

  const baseUrl = firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )

  const engagementCode = resolveCelebalEngagementCode(payload.gender)

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/users/code/${encodeURIComponent(engagementCode)}/onboard`

  if (import.meta.env.DEV) {
    console.info('[onboard] Celebal booking →', engagementCode, url)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const requestId = response.headers.get('x-request-id') || ''
    const statusPrefix = `Request failed (${response.status})`
    const traceSuffix = requestId ? ` [request-id: ${requestId}]` : ''
    const endpointHint = ` [url: ${url}] [engagement: ${engagementCode}]`
    console.error('[onboard] request payload json', JSON.stringify(payload, null, 2))
    console.error('[onboard] error response json', JSON.stringify(data, null, 2))

    const validationMessage = parseValidationMessage(data)
    if (validationMessage) {
      throw new Error(`${statusPrefix}: ${validationMessage}${traceSuffix}${endpointHint}`)
    }

    if (data && typeof data === 'object') {
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}${endpointHint}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}${endpointHint}`)
    }

    throw new Error(`${statusPrefix}. Please check engagement code and request payload.${traceSuffix}${endpointHint}`)
  }

  if (typeof data === 'string') {
    return data
  }

  return 'Booking confirmed'
}
