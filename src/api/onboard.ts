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

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
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
  const baseUrlFromEnv = firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )
  const sameOriginFallback =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  const baseUrl = baseUrlFromEnv || sameOriginFallback

  const engagementCode = firstNonEmpty(
    import.meta.env.VITE_ENGAGEMENT_CODE,
    import.meta.env.VITE_CBTW_ENGAGEMENT_CODE,
    import.meta.env.ENGAGEMENT_CODE,
    'CBMU0626',
  )

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set one of VITE_BACKEND_BASE_URL or VITE_API_BASE_URL in .env.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/users/code/${encodeURIComponent(engagementCode)}/onboard`

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
    console.error('[onboard] request payload json', JSON.stringify(payload, null, 2))
    console.error('[onboard] error response json', JSON.stringify(data, null, 2))

    const validationMessage = parseValidationMessage(data)
    if (validationMessage) {
      throw new Error(`${statusPrefix}: ${validationMessage}${traceSuffix}`)
    }

    if (data && typeof data === 'object') {
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}`)
    }

    throw new Error(`${statusPrefix}. Please check engagement code and request payload.${traceSuffix}`)
  }

  if (typeof data === 'string') {
    return data
  }

  return 'Booking confirmed'
}
