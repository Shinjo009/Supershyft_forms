import { isFrontendOnly } from '../lib/frontendOnly'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

export function getBackendBaseUrl(): string {
  return firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getApiErrorStatus(error: unknown): number | null {
  if (error instanceof ApiError) return error.status
  return null
}

type ValidationErrorDetail = {
  msg?: string
}

function parseErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const body = data as { detail?: string | ValidationErrorDetail[]; message?: string }
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      const messages = body.detail
        .map((item) => item.msg)
        .filter((msg): msg is string => typeof msg === 'string' && msg.length > 0)
      if (messages.length > 0) return messages.join(', ')
    }
    if (typeof body.detail === 'string' && body.detail.trim()) return body.detail
    if (typeof body.message === 'string' && body.message.trim()) return body.message
  }
  if (typeof data === 'string' && data.trim()) return data
  return `Request failed (${status})`
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const params = new URLSearchParams()
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      params.append(key, String(value))
    }
  }
  const queryString = params.toString()
  return `${trimTrailingSlash(baseUrl)}${path.startsWith('/') ? path : `/${path}`}${
    queryString ? `?${queryString}` : ''
  }`
}

async function authorizedRequest<T = unknown>(
  path: string,
  accessToken: string,
  options: {
    method?: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE'
    query?: Record<string, string | number | undefined>
    body?: unknown
  } = {},
): Promise<T> {
  const method = options.method || 'GET'

  // No-send mode: block every write so redesign never hits the backend.
  if (isFrontendOnly() && method !== 'GET') {
    console.info('[frontend-only] blocked write', { method, path })
    return null as T
  }

  if (!accessToken.trim()) {
    throw new Error('You are not logged in. Please confirm your booking again.')
  }

  const url = buildUrl(path, options.query)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, response.status))
  }

  return data as T
}

export async function publicGet<T = unknown>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = buildUrl(path, query)
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    throw new ApiError(parseErrorMessage(data, response.status), response.status)
  }

  return data as T
}

export async function publicPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  if (isFrontendOnly()) {
    console.info('[frontend-only] blocked write', { method: 'POST', path })
    return null as T
  }

  const url = buildUrl(path)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body === undefined ? {} : body),
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    throw new ApiError(parseErrorMessage(data, response.status), response.status)
  }

  return data as T
}

export async function authorizedGet<T = unknown>(
  path: string,
  accessToken: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  return authorizedRequest<T>(path, accessToken, { method: 'GET', query })
}

export async function authorizedPut<T = unknown>(
  path: string,
  accessToken: string,
  body: unknown,
): Promise<T> {
  return authorizedRequest<T>(path, accessToken, { method: 'PUT', body })
}

export async function authorizedPost<T = unknown>(
  path: string,
  accessToken: string,
  body?: unknown,
): Promise<T> {
  return authorizedRequest<T>(path, accessToken, {
    method: 'POST',
    body: body === undefined ? {} : body,
  })
}
