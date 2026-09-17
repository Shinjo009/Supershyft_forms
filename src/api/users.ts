import { getBackendBaseUrl } from './onboard'

export type CreateUserPayload = {
  age: number
  phone: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  gender?: string | null
  address?: string | null
  pin_code?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  is_participant?: boolean | null
  status?: string | null
}

export type CreateUserResult = {
  userId?: number
  alreadyExisted: boolean
}

function isAlreadyExistsError(status: number, data: unknown, message: string): boolean {
  if (status === 409) return true
  const haystack = [
    message,
    typeof data === 'string' ? data : '',
    data && typeof data === 'object' ? JSON.stringify(data) : '',
  ]
    .join(' ')
    .toLowerCase()

  return (
    haystack.includes('already exists') ||
    haystack.includes('already registered') ||
    haystack.includes('already onboard') ||
    haystack.includes('duplicate')
  )
}

function readUserId(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined
  const row = data as Record<string, unknown>
  const nested =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : row
  const raw = nested.user_id ?? nested.id
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : undefined
}

function parseErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const body = data as { detail?: string | Array<{ msg?: string }>; message?: string }
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

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResult> {
  const baseUrl = getBackendBaseUrl()
  const url = `${baseUrl}/users`

  console.info('[users] create', {
    phone: payload.phone,
    age: payload.age,
    gender: payload.gender,
  })

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
    const message = parseErrorMessage(data, response.status)
    if (isAlreadyExistsError(response.status, data, message)) {
      console.info('[users] already exists; continuing', { phone: payload.phone })
      return { alreadyExisted: true, userId: readUserId(data) }
    }
    console.error('[users] create failed', { status: response.status, data })
    throw new Error(message)
  }

  return { userId: readUserId(data), alreadyExisted: false }
}
