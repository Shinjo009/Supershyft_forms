export type LockSlotPayload = {
  address_line: string
  landmark: string
  city: string
  pincode: string
  user_id: number
  blood_collection_date: string
  blood_collection_time_slot_id: string
  blood_collection_time_slot: string
}

export type LockSlotData = {
  engagement_code?: string
  status?: string
  message?: string
  slot_id?: string
  freeze_time?: string
  vendor_billing_user_id?: string
  zone_id?: string
}

type LockSlotResponse = {
  data?: LockSlotData
  meta?: Record<string, unknown>
  message?: string
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

export async function lockBookingSlot(payload: LockSlotPayload): Promise<LockSlotData> {
  const baseUrl = getBaseUrl()
  const engagementCode = getEngagementCode()

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/book/code/${encodeURIComponent(engagementCode)}/lock`

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
    console.error('[lock-slot] request payload json', JSON.stringify(payload, null, 2))
    console.error('[lock-slot] error response json', JSON.stringify(data, null, 2))

    if (data && typeof data === 'object') {
      const body = data as LockSlotResponse
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

    throw new Error(`${statusPrefix}. Unable to lock time slot.${traceSuffix}${endpointHint}`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected response while locking time slot.')
  }

  const body = data as LockSlotResponse
  return body.data || { status: 'success', message: 'Slot locked' }
}
