import { toUserFacingServiceabilityMessage } from './serviceabilityMessage'

export type DiagnosticServiceabilityPayload = {
  provider: string
  address_line: string
  landmark: string
  city: string
  pincode: string
  latitude: number
  longitude: number
  diagnostic_package_id: number
}

export type DiagnosticProviderResult = {
  provider: string
  serviceable: boolean
  message?: string
  zone_id?: string
  latitude?: number
  longitude?: number
  data?: Record<string, unknown>
}

type DiagnosticServiceabilityResponse = {
  providers?: DiagnosticProviderResult[]
  data?: {
    providers?: DiagnosticProviderResult[]
  }
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

export function getFirstServiceableProvider(
  providers: DiagnosticProviderResult[],
): DiagnosticProviderResult | null {
  return (
    providers.find((provider) => provider.serviceable && provider.provider === 'healthians') ||
    providers.find((provider) => provider.serviceable) ||
    null
  )
}

export function getProviderZoneId(provider: DiagnosticProviderResult): string {
  if (typeof provider.zone_id === 'string' && provider.zone_id.trim()) {
    return provider.zone_id.trim()
  }
  const nestedZoneId = provider.data?.zone_id
  return typeof nestedZoneId === 'string' ? nestedZoneId.trim() : ''
}

export function getServiceabilitySummary(providers: DiagnosticProviderResult[]): {
  serviceable: boolean
  message: string
} {
  if (providers.some((provider) => provider.serviceable)) {
    return { serviceable: true, message: 'ok' }
  }

  const providerMessage = providers.find((provider) => provider.message?.trim())?.message
  return {
    serviceable: false,
    message: toUserFacingServiceabilityMessage(providerMessage),
  }
}

export async function checkDiagnosticServiceability(
  payload: DiagnosticServiceabilityPayload,
): Promise<DiagnosticProviderResult[]> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/diagnostics/public/serviceability`

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
    const endpointHint = ` [url: ${url}]`
    console.error('[diagnostic-serviceability] request payload json', JSON.stringify(payload, null, 2))
    console.error('[diagnostic-serviceability] error response json', JSON.stringify(data, null, 2))

    if (data && typeof data === 'object') {
      const body = data as DiagnosticServiceabilityResponse
      if (typeof body.message === 'string' && body.message.trim()) {
        throw new Error(toUserFacingServiceabilityMessage(body.message))
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

  const body = data as DiagnosticServiceabilityResponse
  const providers = Array.isArray(body.providers)
    ? body.providers
    : Array.isArray(body.data?.providers)
      ? body.data.providers
      : []

  return providers
}
