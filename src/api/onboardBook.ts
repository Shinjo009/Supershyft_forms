import { getBackendBaseUrl, resolveEngagementCodeFromGender } from './onboard'
import { toLockTimeSlot } from './lockSlot'

export type OnboardBookPayload = {
  user_id: number
  blood_collection_date: string
  blood_collection_time_slot_id: string
  blood_collection_time_slot: string
  consultations?: Record<string, unknown>
}

export type OnboardBookResult = {
  engagementCode: string
  message: string
  data?: unknown
}

function parseErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const body = data as {
      detail?: string | Array<{ msg?: string }>
      message?: string
      data?: { message?: string }
    }
    if (typeof body.data?.message === 'string' && body.data.message.trim()) {
      return body.data.message.trim()
    }
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      const messages = body.detail
        .map((item) => item.msg)
        .filter((msg): msg is string => typeof msg === 'string' && msg.length > 0)
      if (messages.length > 0) return messages.join(', ')
    }
    if (typeof body.detail === 'string' && body.detail.trim()) return body.detail
    if (typeof body.message === 'string' && body.message.trim()) return body.message
  }
  if (typeof data === 'string' && data.trim()) return data
  return `Request failed (${status})`
}

export async function onboardBook(
  payload: OnboardBookPayload,
  gender: string,
): Promise<OnboardBookResult> {
  const engagementCode = resolveEngagementCodeFromGender(gender)
  const baseUrl = getBackendBaseUrl()
  const url = `${baseUrl}/users/code/${encodeURIComponent(engagementCode)}/onboard/book`

  const apiPayload = {
    user_id: payload.user_id,
    blood_collection_date: payload.blood_collection_date.trim(),
    blood_collection_time_slot_id: payload.blood_collection_time_slot_id.trim(),
    blood_collection_time_slot: toLockTimeSlot(payload.blood_collection_time_slot),
    consultations: payload.consultations ?? {},
  }

  console.info('[onboard/book] confirm', { engagementCode, url, apiPayload })

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
    console.error('[onboard/book] error response', data)
    throw new Error(parseErrorMessage(data, response.status))
  }

  const message =
    data && typeof data === 'object'
      ? String(
          (data as { data?: { message?: string }; message?: string }).data?.message ||
            (data as { message?: string }).message ||
            'Booking confirmed',
        )
      : typeof data === 'string' && data.trim()
        ? data.trim()
        : 'Booking confirmed'

  console.info('[onboard/book] confirmed', { engagementCode, message })
  return { engagementCode, message, data }
}
