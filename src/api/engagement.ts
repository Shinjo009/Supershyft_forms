export type EngagementDetails = {
  engagement_name?: string
  organization_name?: string
  organization_logo_url?: string
  engagement_code?: string
  engagement_type?: string
  slot_duration?: number
  status?: string
  consultations?: Record<string, boolean>
  consultation_mode?: string
  diagnostic_package_id: number
}

type EngagementResponse = EngagementDetails & {
  data?: EngagementDetails
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

function parsePackageId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export async function fetchEngagementDetails(): Promise<EngagementDetails> {
  const baseUrl = getBaseUrl()
  const engagementCode = getEngagementCode()

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/engagements/code/${encodeURIComponent(engagementCode)}`

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
    const endpointHint = ` [url: ${url}] [engagement: ${engagementCode}]`
    console.error('[engagement] error response json', JSON.stringify(data, null, 2))

    if (data && typeof data === 'object') {
      const body = data as EngagementResponse
      if (typeof body.message === 'string' && body.message.trim()) {
        throw new Error(body.message)
      }
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}${endpointHint}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}${endpointHint}`)
    }

    throw new Error(`${statusPrefix}. Unable to load engagement details.${traceSuffix}${endpointHint}`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected response while loading engagement details.')
  }

  const body = data as EngagementResponse
  const details = body.data && typeof body.data === 'object' ? body.data : body
  const diagnosticPackageId = parsePackageId(details.diagnostic_package_id)

  if (diagnosticPackageId == null) {
    throw new Error('Diagnostic package id is missing from engagement details.')
  }

  return {
    ...details,
    diagnostic_package_id: diagnosticPackageId,
  }
}
