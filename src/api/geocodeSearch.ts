import { getBackendBaseUrl } from './onboard'

export type GeocodePlace = {
  displayName: string
  address: string
  subLocality: string
  landmark: string
  city: string
  pincode: string
  state: string
  country: string
  latitude: number | null
  longitude: number | null
}

type GeocodeApiRow = {
  display_name?: string
  address?: string
  sub_locality?: string | null
  landmark?: string | null
  city?: string
  pincode?: string
  state?: string
  country?: string
  latitude?: number | string | null
  longitude?: number | string | null
}

type GeocodeSearchResponse = {
  data?: GeocodeApiRow[]
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value.trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

export function hasCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): latitude is number {
  return (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
  )
}

export function resolveCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): { latitude: number; longitude: number } | null {
  if (!hasCoordinates(latitude, longitude) || longitude == null) return null
  return { latitude, longitude }
}

function mapPlace(row: GeocodeApiRow): GeocodePlace | null {
  const displayName = toText(row.display_name) || toText(row.address)
  if (!displayName) return null
  return {
    displayName,
    address: toText(row.address),
    subLocality: toText(row.sub_locality),
    landmark: toText(row.landmark),
    city: toText(row.city),
    pincode: toText(row.pincode),
    state: toText(row.state),
    country: toText(row.country) || 'India',
    latitude: toOptionalNumber(row.latitude),
    longitude: toOptionalNumber(row.longitude),
  }
}

export async function searchGeocode(query: string, limit = 5): Promise<GeocodePlace[]> {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const trimmed = query.trim()
  if (!trimmed) return []

  const params = new URLSearchParams({
    q: trimmed,
    limit: String(limit),
  })
  const url = `${trimTrailingSlash(baseUrl)}/geocode/public/search?${params.toString()}`

  console.info('[geocode] search', { url, query: trimmed, limit })

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    console.error('[geocode] error response', data)
    if (typeof data === 'string' && data.trim()) {
      throw new Error(`Unable to search address (${response.status}): ${data}`)
    }
    throw new Error(`Unable to search address (${response.status}). Please try again.`)
  }

  const rows = Array.isArray((data as GeocodeSearchResponse)?.data)
    ? (data as GeocodeSearchResponse).data
    : Array.isArray(data)
      ? (data as GeocodeApiRow[])
      : []

  return (rows || []).map(mapPlace).filter((place): place is GeocodePlace => place != null)
}

export async function geocodeOnce(query: string): Promise<GeocodePlace | null> {
  const places = await searchGeocode(query, 1)
  return places[0] ?? null
}
