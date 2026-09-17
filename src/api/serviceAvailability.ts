export type CheckServiceAvailabilityPayload = {
  address_line: string
  landmark: string
  city: string
  pincode: string
}

export type ServiceAvailabilityStatus = 'serviceable' | 'not_serviceable'

export type ServiceAvailabilityData = {
  engagement_code?: string
  status: ServiceAvailabilityStatus | string
  message?: string
  zone_id?: string
}

type ServiceAvailabilityResponse = {
  data?: ServiceAvailabilityData
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

export async function checkServiceAvailability(
  payload: CheckServiceAvailabilityPayload,
): Promise<ServiceAvailabilityData> {
  const baseUrl = getBaseUrl()
  const engagementCode = getEngagementCode()

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/book/code/${encodeURIComponent(engagementCode)}/check-service-availability`

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
    console.error('[check-service-availability] request payload json', JSON.stringify(payload, null, 2))
    console.error('[check-service-availability] error response json', JSON.stringify(data, null, 2))

    if (data && typeof data === 'object') {
      const body = data as ServiceAvailabilityResponse & { message?: string; detail?: unknown }
      const apiMessage =
        (typeof body.data?.message === 'string' && body.data.message) ||
        (typeof body.message === 'string' && body.message) ||
        null
      if (apiMessage) {
        throw new Error(apiMessage)
      }

      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}${endpointHint}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}${endpointHint}`)
    }

    throw new Error(`${statusPrefix}. Unable to check service availability.${traceSuffix}${endpointHint}`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected response while checking service availability.')
  }

  const body = data as ServiceAvailabilityResponse
  const availability = body.data
  if (!availability || typeof availability.status !== 'string') {
    throw new Error('Unexpected response while checking service availability.')
  }

  return availability
}
