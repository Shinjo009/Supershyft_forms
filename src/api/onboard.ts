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
  participant_department: string
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
    engagement_id?: number
    engagement_code?: string
    engagement_participant_id?: number
  }
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

function parseBookingGender(gender: string): 'male' | 'female' {
  const normalized = gender.trim().toLowerCase()
  if (normalized === 'male' || normalized === 'm') return 'male'
  if (normalized === 'female' || normalized === 'f') return 'female'
  throw new Error('Celebal engagement code requires gender to be male or female.')
}

function resolveCelebalEngagementCodes(): { male: string; female: string } {
  const male = assertCelebalEngagementCode(
    firstNonEmpty(
      import.meta.env.VITE_CELEBAL_ENGAGEMENT_CODE_MALE,
      DEFAULT_CELEBAL_ENGAGEMENT_CODE.male,
    ),
    'Male engagement code',
  )
  const female = assertCelebalEngagementCode(
    firstNonEmpty(
      import.meta.env.VITE_CELEBAL_ENGAGEMENT_CODE_FEMALE,
      DEFAULT_CELEBAL_ENGAGEMENT_CODE.female,
    ),
    'Female engagement code',
  )

  if (male.toUpperCase() === female.toUpperCase()) {
    throw new Error(
      `Male and female Celebal engagement codes must differ (both set to "${male}"). Fix VITE_CELEBAL_ENGAGEMENT_CODE_MALE and VITE_CELEBAL_ENGAGEMENT_CODE_FEMALE on hosting.`,
    )
  }

  return { male, female }
}

function resolveCelebalEngagementCode(gender: 'male' | 'female'): string {
  const codes = resolveCelebalEngagementCodes()
  return gender === 'male' ? codes.male : codes.female
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

function isTestParticipantEmployeeId(employeeId: string): boolean {
  const normalized = employeeId.trim().toUpperCase()
  return normalized === 'HRM000' || normalized.startsWith('HRM000-T-')
}

function phoneDigitsForId(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : digits || '0000000000'
}

/** Stable id for admin lookup; includes the user's real phone digits. */
export function participantsEmployeeIdForBooking(phone: string, appointmentDate?: string): string {
  const base = phoneDigitsForId(phone)
  const dateTag = appointmentDate?.replaceAll('-', '') ?? ''
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return dateTag ? `${base}-${dateTag}-${unique}` : `${base}-${unique}`
}

function normalizeEmployeeId(value: string): string {
  return value.trim().toUpperCase()
}

/**
 * Unique per submit so the same entered employee id can be reused across bookings.
 * The id prefix (e.g. HRM123) is preserved for admin/backend visibility.
 */
function participantsEmployeeIdFromInput(
  employeeId: string,
  phone: string,
  appointmentDate?: string,
): string {
  const normalized = normalizeEmployeeId(employeeId)
  const phoneTag = phoneDigitsForId(phone)
  const dateTag = appointmentDate?.replaceAll('-', '') ?? ''
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return dateTag
    ? `${normalized}-${phoneTag}-${dateTag}-${unique}`
    : `${normalized}-${phoneTag}-${unique}`
}

export type OnboardBookingContact = {
  /** Unique per submit so the same user can book again (backend dedupes on phone/email). */
  email: string
  phone: string
  participantsEmployeeId: string
  /** Exact employee id for backend when provided; otherwise "NA". */
  participantDepartment: string
}

/**
 * Phone/email are uniquified per booking so repeat submissions with the same details work.
 * participant_department keeps the exact employee id; participants_employee_id embeds
 * employee id + real phone digits + a unique suffix for admin lookup.
 */
export function contactForOnboardBooking(
  email: string,
  phone: string,
  appointmentDate?: string,
  employeeId?: string,
): OnboardBookingContact {
  const tag = String(Date.now())
  const trimmedPhone = phone.trim()
  const trimmedEmail = email.trim()
  const trimmedEmployeeId = employeeId?.trim() ?? ''
  const at = trimmedEmail.indexOf('@')
  const apiEmail =
    at > 0
      ? `${trimmedEmail.slice(0, at)}+ss${tag}${trimmedEmail.slice(at)}`
      : `${trimmedEmail}+ss${tag}@booking.local`
  const apiPhone = `8${tag.slice(-9)}`

  if (trimmedEmployeeId) {
    return {
      email: apiEmail,
      phone: apiPhone,
      participantsEmployeeId: participantsEmployeeIdFromInput(
        trimmedEmployeeId,
        trimmedPhone,
        appointmentDate,
      ),
      participantDepartment: normalizeEmployeeId(trimmedEmployeeId),
    }
  }

  return {
    email: apiEmail,
    phone: apiPhone,
    participantsEmployeeId: participantsEmployeeIdForBooking(trimmedPhone, appointmentDate),
    participantDepartment: 'NA',
  }
}

function parseOnboardSuccess(
  data: unknown,
  expectedEngagementCode: string,
  participantsEmployeeId: string,
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
      `Booking was saved under engagement ${row?.engagement_code} instead of ${expectedEngagementCode}. Check VITE_CELEBAL_ENGAGEMENT_CODE_FEMALE / MALE on hosting.`,
    )
  }

  if (row?.created === false && !isTestParticipantEmployeeId(participantsEmployeeId)) {
    throw new Error(
      `Booking was not created for engagement ${expectedEngagementCode}. This phone number or email may already be registered for this program.`,
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
  warnIfLegacyEngagementEnvConfigured()

  const baseUrl = firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )

  const bookingGender = parseBookingGender(payload.gender)
  const engagementCode = resolveCelebalEngagementCode(bookingGender)
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
    participantsEmployeeId: apiPayload.participants_employee_id,
    participantDepartment: apiPayload.participant_department,
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

  const result = parseOnboardSuccess(data, engagementCode, apiPayload.participants_employee_id)
  console.info('[onboard] Celebal booking saved', result)
  return result
}
