import { isFrontendOnly } from '../lib/frontendOnly'
import {
  applyAuthTokensFromResponse,
  getAccessToken,
  getRefreshToken,
} from '../lib/authStorage'

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

let refreshInFlight: Promise<boolean> | null = null

async function refreshAuthSession(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken || refreshToken.length < 10) return false

  try {
    const data = await jsonRequest<unknown>({
      path: '/auth/refresh-token',
      method: 'POST',
      body: { refresh_token: refreshToken },
      retryOnUnauthorized: false,
    })
    return Boolean(applyAuthTokensFromResponse(data)?.accessToken)
  } catch (error) {
    console.warn('[auth] refresh-token failed', error instanceof Error ? error.message : error)
    return false
  }
}

function refreshAuthSessionOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAuthSession().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function jsonRequest<T = unknown>(options: {
  path: string
  method?: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number | undefined>
  body?: unknown
  accessToken?: string
  retryOnUnauthorized?: boolean
}): Promise<T> {
  const method = options.method || 'GET'
  const retryOnUnauthorized = options.retryOnUnauthorized !== false

  if (isFrontendOnly() && method !== 'GET') {
    console.info('[frontend-only] blocked write', { method, path: options.path })
    return null as T
  }

  const url = buildUrl(options.path, options.query)
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401 && retryOnUnauthorized && options.accessToken) {
    const refreshed = await refreshAuthSessionOnce()
    if (refreshed) {
      return jsonRequest<T>({
        ...options,
        accessToken: getAccessToken(),
        retryOnUnauthorized: false,
      })
    }
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const raw = await response.text()
  let data: unknown = raw
  if (isJson && raw.trim()) {
    try {
      data = JSON.parse(raw) as unknown
    } catch {
      data = raw
    }
  }

  if (!response.ok) {
    throw new ApiError(parseErrorMessage(data, response.status), response.status)
  }

  return data as T
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

  if (!accessToken.trim()) {
    throw new Error('You are not logged in. Please confirm your booking again.')
  }

  return jsonRequest<T>({
    path,
    method,
    query: options.query,
    body: options.body,
    accessToken,
    retryOnUnauthorized: true,
  })
}

export async function publicPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  return jsonRequest<T>({
    path,
    method: 'POST',
    body: body === undefined ? {} : body,
    retryOnUnauthorized: false,
  })
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
