import { getBackendBaseUrl, getCelebalEngagementCodeForGender } from './onboard'

export type CheckServiceAvailabilityPayload = {
  address_line: string
  landmark: string
  city: string
  pincode: string
}

export type ServiceAvailabilityResult = {
  status: 'serviceable' | 'not_serviceable'
  message: string
  engagementCode: string
  zoneId?: string
}

type ServiceAvailabilityResponse = {
  data?: {
    engagement_code?: string
    status?: string
    message?: string
    zone_id?: string | number
  }
  meta?: Record<string, unknown>
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export async function checkServiceAvailability(
  gender: string,
  payload: CheckServiceAvailabilityPayload,
): Promise<ServiceAvailabilityResult> {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const engagementCode = getCelebalEngagementCodeForGender(gender)
  const url = `${trimTrailingSlash(baseUrl)}/book/code/${encodeURIComponent(engagementCode)}/check-service-availability`

  console.info('[serviceability] check', { engagementCode, url, payload })

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
    console.error('[serviceability] error response', data)
    if (data && typeof data === 'object') {
      const row = data as ServiceAvailabilityResponse
      if (row.data?.message) {
        throw new Error(row.data.message)
      }
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`Serviceability check failed (${response.status}): ${jsonText}`)
      }
    }
    if (typeof data === 'string' && data.trim()) {
      throw new Error(`Serviceability check failed (${response.status}): ${data}`)
    }
    throw new Error(`Serviceability check failed (${response.status}). Please try again.`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid serviceability response from server.')
  }

  const row = (data as ServiceAvailabilityResponse).data
  const statusRaw = (row?.status || '').trim().toLowerCase()
  const message =
    (typeof row?.message === 'string' && row.message.trim()) ||
    (statusRaw === 'serviceable'
      ? 'Serviceable'
      : 'This location is not serviceable.')

  if (statusRaw === 'serviceable') {
    return {
      status: 'serviceable',
      message,
      engagementCode: row?.engagement_code?.trim() || engagementCode,
      zoneId: row?.zone_id != null ? String(row.zone_id) : undefined,
    }
  }

  if (statusRaw === 'not_serviceable' || statusRaw === 'not-serviceable') {
    return {
      status: 'not_serviceable',
      message,
      engagementCode: row?.engagement_code?.trim() || engagementCode,
    }
  }

  throw new Error(message || 'Unable to verify serviceability for this location.')
}
