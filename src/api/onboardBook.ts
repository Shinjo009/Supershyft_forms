import { getBackendBaseUrl, getCelebalEngagementCodeForGender } from './onboard'

export type OnboardBookPayload = {
  user_id: number
  blood_collection_date: string
  blood_collection_time_slot_id: string
  blood_collection_time_slot: string
  consultations: Record<string, unknown>
}

export type OnboardBookResult = {
  message: string
  engagementCode: string
  data?: Record<string, unknown>
}

type OnboardBookResponse = {
  data?: {
    engagement_code?: string
    status?: string
    message?: string
    [key: string]: unknown
  }
  meta?: Record<string, unknown>
  error_code?: string
  message?: string
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export async function onboardBook(
  gender: string,
  payload: OnboardBookPayload,
): Promise<OnboardBookResult> {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const engagementCode = getCelebalEngagementCodeForGender(gender)
  const url = `${trimTrailingSlash(baseUrl)}/users/code/${encodeURIComponent(engagementCode)}/onboard/book`

  console.info('[onboard/book] request', { engagementCode, url, payload })

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
    console.error('[onboard/book] error response', data)
    if (data && typeof data === 'object') {
      const row = data as OnboardBookResponse
      if (row.data?.message && typeof row.data.message === 'string') {
        throw new Error(row.data.message)
      }
      if (row.message) throw new Error(row.message)
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`Booking failed (${response.status}): ${jsonText}`)
      }
    }
    if (typeof data === 'string' && data.trim()) {
      throw new Error(`Booking failed (${response.status}): ${data}`)
    }
    throw new Error(`Booking failed (${response.status}). Please try again.`)
  }

  // HTTP success means the booking was accepted — do not treat nested
  // status/message as errors (API returns e.g. "Booking confirmed").
  if (data && typeof data === 'object') {
    const row = data as OnboardBookResponse
    const failureStatuses = new Set(['error', 'failed', 'failure', 'fail'])
    const status = typeof row.data?.status === 'string' ? row.data.status.trim().toLowerCase() : ''
    const message =
      (typeof row.data?.message === 'string' && row.data.message.trim()) ||
      (typeof row.message === 'string' && row.message.trim()) ||
      'Booking confirmed'

    if (status && failureStatuses.has(status)) {
      throw new Error(message || 'Unable to confirm booking.')
    }

    return {
      message,
      engagementCode:
        (typeof row.data?.engagement_code === 'string' && row.data.engagement_code.trim()) ||
        engagementCode,
      data: row.data,
    }
  }

  return {
    message: typeof data === 'string' && data.trim() ? data.trim() : 'Booking confirmed',
    engagementCode,
  }
}
