import { getBackendBaseUrl, getDiagnosticPackageId } from './onboard'

export type ServiceabilityPayload = {
  provider?: string
  address_line: string
  landmark: string
  city: string
  pincode: string
  latitude: number
  longitude: number
  diagnostic_package_id?: number
}

export type ServiceabilityResult = {
  serviceable: boolean
  provider: string
  zoneId: string
  message: string
}

type ServiceabilityProvider = {
  provider?: string
  serviceable?: boolean
  message?: string
  zone_id?: string | number
  data?: {
    zone_id?: string | number
    [key: string]: unknown
  }
}

type ServiceabilityResponse = {
  providers?: ServiceabilityProvider[]
  data?: {
    providers?: ServiceabilityProvider[]
    message?: string
  }
  message?: string
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

const LOCATION_NOT_SERVICEABLE = 'This address is not serviceable.'
const DEFAULT_PROVIDER = 'healthians'

function toUserFacingServiceabilityMessage(message: string | undefined, fallback: string): string {
  const trimmed = typeof message === 'string' ? message.trim() : ''
  if (!trimmed) return fallback
  if (/lat\s*[-_]?\s*long/i.test(trimmed)) return LOCATION_NOT_SERVICEABLE
  return trimmed
}

function extractProviders(data: unknown): ServiceabilityProvider[] {
  if (!data || typeof data !== 'object') return []
  const row = data as ServiceabilityResponse
  if (Array.isArray(row.providers)) return row.providers
  if (Array.isArray(row.data?.providers)) return row.data.providers
  return []
}

function zoneIdFromProvider(provider: ServiceabilityProvider): string {
  if (provider.zone_id != null && String(provider.zone_id).trim()) return String(provider.zone_id).trim()
  if (provider.data?.zone_id != null && String(provider.data.zone_id).trim()) {
    return String(provider.data.zone_id).trim()
  }
  return ''
}

export async function checkServiceAvailability(
  payload: ServiceabilityPayload,
): Promise<ServiceabilityResult> {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const diagnosticPackageId = payload.diagnostic_package_id ?? getDiagnosticPackageId()
  if (diagnosticPackageId == null) {
    throw new Error('Unable to find a diagnostic package for this engagement.')
  }

  const body = {
    provider: payload.provider?.trim() || DEFAULT_PROVIDER,
    address_line: payload.address_line,
    landmark: payload.landmark || '',
    city: payload.city,
    pincode: payload.pincode,
    latitude: payload.latitude,
    longitude: payload.longitude,
    diagnostic_package_id: diagnosticPackageId,
  }

  const url = `${trimTrailingSlash(baseUrl)}/diagnostics/public/serviceability`
  console.info('[serviceability] check', { url, payload: body })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    console.error('[serviceability] error response', data)
    if (data && typeof data === 'object') {
      const row = data as ServiceabilityResponse
      const message = row.data?.message || row.message
      if (message) {
        throw new Error(toUserFacingServiceabilityMessage(message, LOCATION_NOT_SERVICEABLE))
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

  const providers = extractProviders(data)
  const serviceableProviders = providers.filter((item) => item.serviceable === true)
  const preferred =
    serviceableProviders.find((item) => (item.provider || '').trim().toLowerCase() === DEFAULT_PROVIDER) ||
    serviceableProviders[0]

  if (!preferred) {
    const fallbackMessage =
      providers.find((item) => typeof item.message === 'string' && item.message.trim())?.message ||
      (data && typeof data === 'object' ? (data as ServiceabilityResponse).message : '') ||
      LOCATION_NOT_SERVICEABLE
    return {
      serviceable: false,
      provider: '',
      zoneId: '',
      message: toUserFacingServiceabilityMessage(fallbackMessage, LOCATION_NOT_SERVICEABLE),
    }
  }

  return {
    serviceable: true,
    provider: (preferred.provider || DEFAULT_PROVIDER).trim() || DEFAULT_PROVIDER,
    zoneId: zoneIdFromProvider(preferred),
    message: preferred.message?.trim() || 'Serviceable',
  }
}
