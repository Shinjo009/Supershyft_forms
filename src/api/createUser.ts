export type CreateUserPayload = {
  age: number
  first_name: string
  last_name: string
  email: string
  phone: string
  gender: string
  participants_employee_id: string
}

type CreateUserErrorBody = {
  error_code?: string
  message?: string
  detail?: unknown
  id?: number | string
  user_id?: number | string
  data?: {
    message?: string
    error_code?: string
    id?: number | string
    user_id?: number | string
    user?: {
      id?: number | string
      user_id?: number | string
    }
  }
  user?: {
    id?: number | string
    user_id?: number | string
  }
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

function collectErrorText(data: unknown): string {
  if (!data) return ''
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return ''

  const body = data as CreateUserErrorBody
  const parts = [
    body.message,
    body.error_code,
    body.data?.message,
    body.data?.error_code,
    typeof body.detail === 'string' ? body.detail : '',
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')

  if (parts) return parts
  try {
    return JSON.stringify(data)
  } catch {
    return ''
  }
}

function parseUserIdCandidate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export function extractUserId(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null
  const body = data as CreateUserErrorBody

  return (
    parseUserIdCandidate(body.user_id) ??
    parseUserIdCandidate(body.id) ??
    parseUserIdCandidate(body.data?.user_id) ??
    parseUserIdCandidate(body.data?.id) ??
    parseUserIdCandidate(body.data?.user?.user_id) ??
    parseUserIdCandidate(body.data?.user?.id) ??
    parseUserIdCandidate(body.user?.user_id) ??
    parseUserIdCandidate(body.user?.id)
  )
}

export function isUserAlreadyExistsError(status: number, data: unknown): boolean {
  if (status === 409) return true

  const text = collectErrorText(data).toLowerCase()
  if (!text) return false

  return (
    text.includes('already exists') ||
    text.includes('user exists') ||
    text.includes('already registered') ||
    text.includes('duplicate') ||
    text.includes('email already') ||
    text.includes('phone already')
  )
}

export async function createUser(payload: CreateUserPayload): Promise<number> {
  const baseUrl = getBaseUrl()

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/users`

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

  if (response.ok || isUserAlreadyExistsError(response.status, data)) {
    if (isUserAlreadyExistsError(response.status, data) && !response.ok) {
      console.info('[create-user] user already exists; continuing without error')
    }

    const userId = extractUserId(data)
    if (userId == null) {
      throw new Error('User created, but user id was missing in the response.')
    }
    return userId
  }

  const requestId = response.headers.get('x-request-id') || ''
  const statusPrefix = `Request failed (${response.status})`
  const traceSuffix = requestId ? ` [request-id: ${requestId}]` : ''
  const endpointHint = ` [url: ${url}]`
  console.error('[create-user] request payload json', JSON.stringify(payload, null, 2))
  console.error('[create-user] error response json', JSON.stringify(data, null, 2))

  const message = collectErrorText(data)
  if (message) {
    throw new Error(`${statusPrefix}: ${message}${traceSuffix}${endpointHint}`)
  }

  throw new Error(`${statusPrefix}. Unable to create user.${traceSuffix}${endpointHint}`)
}
