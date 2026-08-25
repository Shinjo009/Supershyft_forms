export type OnboardUserForEngagementPayload = {
  age: number
  first_name: string
  last_name: string
  email: string
  phone: string
  gender: string
  address: string
  pincode: string
  city: string
  state: string
  country: string
  blood_collection_date: string
  blood_collection_time_slot: string
  participants_employee_id: string
  participant_blood_group: string
  want_doctor_consultation: boolean
}

export type OnboardResult = {
  message: string
  engagementCode: string
  engagementId?: number
  engagementParticipantId?: number
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

type OnboardSuccessResponse = {
  data?: {
    user_id?: number
    created?: boolean
    is_participant?: boolean
    engagement_id?: number
    engagement_code?: string
    engagement_participant_id?: number
  }
}

/** Legacy CBTW engagement — must never be used from this form. */
const LEGACY_CBTW_ENGAGEMENT_CODES = new Set(['CBMU0626'])

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

function assertEngagementCode(code: string): string {
  const trimmed = code.trim()
  if (LEGACY_CBTW_ENGAGEMENT_CODES.has(trimmed.toUpperCase())) {
    throw new Error(
      `Engagement code "${trimmed}" is the legacy CBTW engagement. Set VITE_ENGAGEMENT_CODE in .env to the current code and restart the dev server.`,
    )
  }
  return trimmed
}

function parseBookingGender(gender: string): 'male' | 'female' {
  const normalized = gender.trim().toLowerCase()
  if (normalized === 'male' || normalized === 'm') return 'male'
  if (normalized === 'female' || normalized === 'f') return 'female'
  throw new Error('Gender must be male or female.')
}

function resolveEngagementCode(gender: 'male' | 'female'): string {
  const fromEnv = firstNonEmpty(
    import.meta.env.VITE_ENGAGEMENT_CODE,
    gender === 'male'
      ? import.meta.env.VITE_CELEBAL_ENGAGEMENT_CODE_MALE
      : import.meta.env.VITE_CELEBAL_ENGAGEMENT_CODE_FEMALE,
    import.meta.env.VITE_CELEBAL_ENGAGEMENT_CODE,
  )

  if (!fromEnv) {
    throw new Error(
      'Missing engagement code. Set VITE_ENGAGEMENT_CODE in .env and restart the dev server.',
    )
  }

  return assertEngagementCode(fromEnv)
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

function parseOnboardSuccess(
  data: unknown,
  expectedEngagementCode: string,
): OnboardResult {
  const expected = expectedEngagementCode.trim().toUpperCase()

  if (!data || typeof data !== 'object') {
    return { message: 'Booking confirmed', engagementCode: expectedEngagementCode }
  }

  const response = data as OnboardSuccessResponse
  const row = response.data
  const apiCode = row?.engagement_code?.trim().toUpperCase()

  if (apiCode && apiCode !== expected) {
    throw new Error(
      `Booking was saved under engagement ${row?.engagement_code} instead of ${expectedEngagementCode}. Check VITE_ENGAGEMENT_CODE in .env.`,
    )
  }

  return {
    message: 'Booking confirmed',
    engagementCode: row?.engagement_code?.trim() || expectedEngagementCode,
    engagementId: row?.engagement_id,
    engagementParticipantId: row?.engagement_participant_id,
  }
}

export async function onboardUserForEngagement(
  payload: OnboardUserForEngagementPayload,
): Promise<OnboardResult> {
  const baseUrl = firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )

  const bookingGender = parseBookingGender(payload.gender)
  const engagementCode = resolveEngagementCode(bookingGender)
  const apiPayload: OnboardUserForEngagementPayload = {
    ...payload,
    gender: bookingGender,
  }

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/users/code/${encodeURIComponent(engagementCode)}/onboard`

  console.info('[onboard] Celebal booking', {
    engagementCode,
    gender: apiPayload.gender,
    employeeId: apiPayload.participants_employee_id,
    url,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(apiPayload),
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const requestId = response.headers.get('x-request-id') || ''
    const statusPrefix = `Request failed (${response.status})`
    const traceSuffix = requestId ? ` [request-id: ${requestId}]` : ''
    const endpointHint = ` [url: ${url}] [engagement: ${engagementCode}]`
    console.error('[onboard] request payload json', JSON.stringify(apiPayload, null, 2))
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
    return { message: data.trim() || 'Booking confirmed', engagementCode }
  }

  const result = parseOnboardSuccess(data, engagementCode)
  console.info('[onboard] Celebal booking saved', result)
  return result
}
