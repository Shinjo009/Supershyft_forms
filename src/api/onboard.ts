import { saveAuthTokens, applyAuthTokensFromResponse, getAccessToken, getRefreshToken } from '../lib/authStorage'
import { resolveEngagementCode } from '../lib/engagementCode'
import { isFrontendOnly } from '../lib/frontendOnly'
import { getBackendBaseUrl } from './http'

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
  blood_collection_cabin?: string | null
  participants_employee_id: string
  participant_blood_group: string
  consultation: {
    eye: boolean
    doctor: boolean
  }
}

export type OnboardTokens = {
  accessToken: string
  refreshToken: string
  tokenType?: string
}

export type OnboardResult = {
  message: string
  engagementCode: string
  userId?: number
  tokens: OnboardTokens
  alreadyEnrolled?: boolean
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
    tokens?: {
      access_token?: string
      refresh_token?: string
      token_type?: string
    }
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function parseBookingGender(gender: string): 'male' | 'female' {
  const normalized = gender.trim().toLowerCase()
  if (normalized === 'male' || normalized === 'm') return 'male'
  if (normalized === 'female' || normalized === 'f') return 'female'
  throw new Error('Gender is required and must be male or female.')
}

function readErrorCode(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const row = data as Record<string, unknown>
  const nested =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : row
  return String(row.error_code || nested.error_code || '').trim().toUpperCase()
}

function isAlreadyEnrolledError(status: number, data: unknown): boolean {
  if (status !== 409) return false
  const code = readErrorCode(data)
  if (code === 'ALREADY_ENROLLED') return true
  const text = (typeof data === 'string' ? data : JSON.stringify(data)).toLowerCase()
  return text.includes('already_enrolled') || text.includes('already enrolled')
}

function tokensFromStorage(): OnboardTokens {
  return {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    tokenType: 'bearer',
  }
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

function parseOnboardSuccess(data: unknown, engagementCode: string): OnboardResult {
  let userId: number | undefined
  let accessToken = ''
  let refreshToken = ''
  let tokenType = 'bearer'

  if (data && typeof data === 'object') {
    const response = data as OnboardSuccessResponse
    const row = response.data
    userId = row?.user_id
    const tokens = row?.tokens
    accessToken = tokens?.access_token?.trim() || ''
    refreshToken = tokens?.refresh_token?.trim() || ''
    tokenType = tokens?.token_type?.trim() || 'bearer'

    const fromResponse = applyAuthTokensFromResponse(data)
    if (fromResponse) {
      accessToken = fromResponse.accessToken
      refreshToken = fromResponse.refreshToken
    }
  }

  if (!accessToken || !refreshToken) {
    const stored = tokensFromStorage()
    accessToken = accessToken || stored.accessToken
    refreshToken = refreshToken || stored.refreshToken
  }

  return {
    message: 'Booking confirmed',
    engagementCode,
    userId,
    tokens: {
      accessToken,
      refreshToken,
      tokenType,
    },
  }
}

export function saveOnboardTokens(tokens: OnboardTokens): void {
  saveAuthTokens(tokens.accessToken, tokens.refreshToken)
}

export async function onboardUserForEngagement(
  payload: OnboardUserForEngagementPayload,
): Promise<OnboardResult> {
  const engagementCode = resolveEngagementCode(payload.city, payload.gender)

  if (isFrontendOnly()) {
    const bookingGender = parseBookingGender(payload.gender)
    console.info('[frontend-only] skipped onboard POST', {
      engagementCode,
      gender: bookingGender,
      employeeId: payload.participants_employee_id,
    })

    const result: OnboardResult = {
      message: 'Booking confirmed (frontend-only)',
      engagementCode,
      userId: 0,
      tokens: {
        accessToken: 'frontend-only-access-token',
        refreshToken: 'frontend-only-refresh-token',
        tokenType: 'bearer',
      },
    }
    saveOnboardTokens(result.tokens)
    return result
  }

  const baseUrl = getBackendBaseUrl()

  const bookingGender = parseBookingGender(payload.gender)
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

  console.info('[onboard] booking', {
    engagementCode,
    gender: apiPayload.gender,
    employeeId: apiPayload.participants_employee_id,
    url,
  })

  const accessToken = getAccessToken()
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(apiPayload),
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    if (isAlreadyEnrolledError(response.status, data)) {
      applyAuthTokensFromResponse(data)
      const tokens = tokensFromStorage()
      console.info('[onboard] already enrolled; continuing with existing session', {
        engagementCode,
        hasAccessToken: Boolean(tokens.accessToken),
      })
      return {
        message: 'Already enrolled',
        engagementCode,
        alreadyEnrolled: true,
        tokens,
      }
    }

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

    throw new Error(
      `${statusPrefix}. Please check engagement code and request payload.${traceSuffix}${endpointHint}`,
    )
  }

  const result = parseOnboardSuccess(data, engagementCode)
  if (result.tokens.accessToken && result.tokens.refreshToken) {
    saveOnboardTokens(result.tokens)
  }
  console.info('[onboard] booking saved', {
    engagementCode: result.engagementCode,
    userId: result.userId,
  })
  return result
}
