import { isFrontendOnly } from '../lib/frontendOnly'
import { publicGet } from './http'

export type GeocodeSuggestion = {
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

type GeocodeSearchResponse = {
  data?: Array<{
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
  }>
}

function parseCoord(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : null
}

function normalizeSuggestion(
  row: NonNullable<GeocodeSearchResponse['data']>[number],
): GeocodeSuggestion {
  const displayName = String(row.display_name || row.address || '').trim()
  return {
    displayName,
    address: String(row.address || displayName).trim(),
    subLocality: String(row.sub_locality || '').trim(),
    landmark: String(row.landmark || '').trim(),
    city: String(row.city || '').trim(),
    pincode: String(row.pincode || '').replace(/\D/g, '').slice(0, 6),
    state: String(row.state || '').trim(),
    country: String(row.country || '').trim(),
    latitude: parseCoord(row.latitude),
    longitude: parseCoord(row.longitude),
  }
}

export function hasValidCoordinates(suggestion: Pick<GeocodeSuggestion, 'latitude' | 'longitude'>): boolean {
  return suggestion.latitude !== null && suggestion.longitude !== null
}

export async function searchGeocode(query: string, limit = 5): Promise<GeocodeSuggestion[]> {
  const q = query.trim()
  if (q.length < 3) return []

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped geocode search', { q, limit })
    return []
  }

  const response = await publicGet<GeocodeSearchResponse>('/geocode/public/search', { q, limit })
  return Array.isArray(response?.data) ? response.data.map(normalizeSuggestion) : []
}

export async function resolveGeocodeCoordinates(
  query: string,
): Promise<Pick<GeocodeSuggestion, 'latitude' | 'longitude'> | null> {
  const results = await searchGeocode(query, 1)
  const first = results[0]
  if (!first || !hasValidCoordinates(first)) return null
  return { latitude: first.latitude, longitude: first.longitude }
}
