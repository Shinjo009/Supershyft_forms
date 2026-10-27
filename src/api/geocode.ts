export type GeocodeResult = {
  display_name: string
  address: string
  sub_locality: string | null
  landmark: string | null
  city: string
  pincode: string
  state: string
  country: string
  latitude: number
  longitude: number
}

type GeocodeSearchResponse = {
  data?: GeocodeResult[]
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

export function applyGeocodeToForm(result: GeocodeResult): {
  houseNumber: string
  street: string
  landmark: string
  pincode: string
  city: string
  state: string
} {
  const fullAddress = result.address || result.display_name || ''
  const parts = fullAddress.split(',').map((part) => part.trim()).filter(Boolean)

  return {
    houseNumber: parts[0] || fullAddress,
    street: result.sub_locality?.trim() || parts[1] || '',
    landmark: result.landmark?.trim() || '',
    pincode: result.pincode || '',
    city: result.city || '',
    state: result.state || '',
  }
}

export async function searchGeocode(query: string, limit = 1): Promise<GeocodeResult[]> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const params = new URLSearchParams({
    q: query.trim(),
    limit: String(limit),
  })
  const url = `${trimTrailingSlash(baseUrl)}/geocode/public/search?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const requestId = response.headers.get('x-request-id') || ''
    const statusPrefix = `Request failed (${response.status})`
    const traceSuffix = requestId ? ` [request-id: ${requestId}]` : ''
    console.error('[geocode] error response json', JSON.stringify(data, null, 2))

    if (data && typeof data === 'object') {
      const body = data as GeocodeSearchResponse
      if (typeof body.message === 'string' && body.message.trim()) {
        throw new Error(body.message)
      }
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}`)
    }

    throw new Error(`${statusPrefix}. Unable to search address.${traceSuffix}`)
  }

  if (!data || typeof data !== 'object') return []

  const body = data as GeocodeSearchResponse
  return Array.isArray(body.data) ? body.data : []
}
