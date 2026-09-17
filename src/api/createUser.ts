import { getBackendBaseUrl } from './onboard'

export type CreateUserPayload = {
  first_name: string
  last_name: string
  email: string
  phone: string
  gender: string
  age: number
  participants_employee_id: string
}

export type CreateUserResult = {
  userId?: number
  alreadyExists: boolean
}

type CreateUserErrorResponse = {
  error_code?: string
  message?: string
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function isAlreadyExistsError(status: number, data: unknown): boolean {
  if (status === 409) return true
  if (!data || typeof data !== 'object') return false
  const row = data as CreateUserErrorResponse
  const code = (row.error_code || '').toUpperCase()
  const message = (row.message || '').toLowerCase()
  return (
    code === 'CONFLICT' ||
    message.includes('already exists') ||
    message.includes('user already exist')
  )
}

function extractUserId(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined
  const root = data as {
    data?: { user_id?: number | string }
    user_id?: number | string
  }
  const raw = root.data?.user_id ?? root.user_id
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return Number.parseInt(raw.trim(), 10)
  return undefined
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResult> {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/users`
  console.info('[users] create', { url, payload })

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

  if (isAlreadyExistsError(response.status, data)) {
    console.info('[users] already exists — continuing', data)
    return { alreadyExists: true, userId: extractUserId(data) }
  }

  if (!response.ok) {
    console.error('[users] create error', data)
    if (data && typeof data === 'object') {
      const row = data as CreateUserErrorResponse
      if (row.message) throw new Error(row.message)
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`Unable to create user (${response.status}): ${jsonText}`)
      }
    }
    if (typeof data === 'string' && data.trim()) {
      throw new Error(`Unable to create user (${response.status}): ${data}`)
    }
    throw new Error(`Unable to create user (${response.status}). Please try again.`)
  }

  return {
    alreadyExists: false,
    userId: extractUserId(data),
  }
}
