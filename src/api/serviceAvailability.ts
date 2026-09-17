import { getBackendBaseUrl, resolveEngagementCodeFromGender } from './onboard'

export type CheckServiceAvailabilityPayload = {
  address_line: string
  landmark?: string
  city: string
  pincode: string
}

export type ServiceAvailabilityResult = {
  engagementCode: string
  status: 'serviceable' | 'not_serviceable' | string
  message: string
  zoneId?: string
}

type ServiceAvailabilityResponse = {
  data?: {
    engagement_code?: string
    status?: string
    message?: string
    zone_id?: string
  }
  meta?: Record<string, unknown>
}

export async function checkServiceAvailability(
  payload: CheckServiceAvailabilityPayload,
  gender: string,
): Promise<ServiceAvailabilityResult> {
  const engagementCode = resolveEngagementCodeFromGender(gender)
  const baseUrl = getBackendBaseUrl()
  const url = `${baseUrl}/book/code/${encodeURIComponent(engagementCode)}/check-service-availability`

  const apiPayload = {
    address_line: payload.address_line.trim(),
    landmark: (payload.landmark ?? '').trim(),
    city: payload.city.trim(),
    pincode: payload.pincode.trim(),
  }

  console.info('[service-availability] check', { engagementCode, url, apiPayload })

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
    console.error('[service-availability] error response', data)

    if (data && typeof data === 'object') {
      const body = data as ServiceAvailabilityResponse
      const apiMessage = body.data?.message?.trim()
      if (apiMessage) {
        throw new Error(apiMessage)
      }
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}`)
    }

    throw new Error(`${statusPrefix}. Unable to check service availability.${traceSuffix}`)
  }

  const body = (data && typeof data === 'object' ? data : {}) as ServiceAvailabilityResponse
  const row = body.data
  const status = (row?.status || '').trim().toLowerCase() || 'unknown'
  const message =
    row?.message?.trim() ||
    (status === 'serviceable'
      ? 'Serviceable'
      : status === 'not_serviceable'
        ? 'This location is not serviceable.'
        : 'Unable to confirm service availability.')

  return {
    engagementCode: row?.engagement_code?.trim() || engagementCode,
    status,
    message,
    zoneId: row?.zone_id?.trim() || undefined,
  }
}
