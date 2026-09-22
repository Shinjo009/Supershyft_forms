import { toUserFacingServiceabilityMessage } from './serviceabilityMessage'

export type AvailableSlotsPayload = {
  address_line: string
  landmark: string
  city: string
  pincode: string
  blood_collection_date: string
}

export type AvailableSlot = {
  end_time: string
  slot_date: string
  slot_time: string
  stm_id: string
}

export type AvailableSlotsData = {
  engagement_code?: string
  status: string
  slots: AvailableSlot[]
}

type AvailableSlotsResponse = {
  data?: AvailableSlotsData
  meta?: Record<string, unknown>
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

function getBaseUrl(): string {
  return firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )
}

function getEngagementCode(): string {
  return firstNonEmpty(
    import.meta.env.VITE_ENGAGEMENT_CODE,
    import.meta.env.VITE_CBTW_ENGAGEMENT_CODE,
    import.meta.env.ENGAGEMENT_CODE,
    'CBMU0626',
  )
}

export function formatClockLabel(time: string): string {
  const normalized = time.trim()
  if (!normalized) return ''
  const [hourPart = '', minutePart = '00'] = normalized.split(':')
  let hour = Number.parseInt(hourPart, 10)
  const minutes = minutePart.padStart(2, '0')
  if (!Number.isFinite(hour)) return normalized
  const suffix = hour >= 12 ? 'pm' : 'am'
  hour = hour % 12
  if (hour === 0) hour = 12
  return `${String(hour).padStart(2, '0')}:${minutes} ${suffix}`
}

export function formatAvailableSlotLabel(slot: AvailableSlot): string {
  return `${formatClockLabel(slot.slot_time)} - ${formatClockLabel(slot.end_time)}`
}

export async function fetchAvailableSlots(
  payload: AvailableSlotsPayload,
): Promise<AvailableSlotsData> {
  const baseUrl = getBaseUrl()
  const engagementCode = getEngagementCode()

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/book/code/${encodeURIComponent(engagementCode)}/available-slots`

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
    console.error('[available-slots] request payload json', JSON.stringify(payload, null, 2))
    console.error('[available-slots] error response json', JSON.stringify(data, null, 2))

    if (data && typeof data === 'object') {
      const body = data as AvailableSlotsResponse & { message?: string }
      const apiMessage =
        (typeof body.data?.status === 'string' && body.data.status !== 'success' && body.message) ||
        (typeof body.message === 'string' && body.message) ||
        null
      if (apiMessage) {
        throw new Error(toUserFacingServiceabilityMessage(apiMessage))
      }

      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}${endpointHint}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}${endpointHint}`)
    }

    throw new Error(`${statusPrefix}. Unable to load available time slots.${traceSuffix}${endpointHint}`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected response while loading available time slots.')
  }

  const body = data as AvailableSlotsResponse
  const slotsData = body.data
  if (!slotsData || !Array.isArray(slotsData.slots)) {
    throw new Error('Unexpected response while loading available time slots.')
  }

  return {
    engagement_code: slotsData.engagement_code,
    status: slotsData.status || 'success',
    slots: slotsData.slots,
  }
}
