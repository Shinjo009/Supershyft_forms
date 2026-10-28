import { getBackendBaseUrl, getCelebalEngagementCodeForGender } from './onboard'

export type EngagementInfo = {
  engagementCode: string
  diagnosticPackageId: number | null
}

type EngagementResponse = {
  data?: {
    engagement_code?: string
    diagnostic_package_id?: number | string | null
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function toPackageId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

export async function fetchEngagementForGender(gender: string): Promise<EngagementInfo> {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const engagementCode = getCelebalEngagementCodeForGender(gender)
  const url = `${trimTrailingSlash(baseUrl)}/engagements/code/${encodeURIComponent(engagementCode)}`

  console.info('[engagement] fetch', { engagementCode, url })

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    console.error('[engagement] error response', data)
    throw new Error('Unable to load the diagnostic package for this booking.')
  }

  const row = data && typeof data === 'object' ? (data as EngagementResponse).data : undefined
  const diagnosticPackageId = toPackageId(row?.diagnostic_package_id)

  if (diagnosticPackageId == null) {
    throw new Error('This engagement does not have a diagnostic package configured.')
  }

  return {
    engagementCode: row?.engagement_code?.trim() || engagementCode,
    diagnosticPackageId,
  }
}
