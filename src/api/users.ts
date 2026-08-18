import { isFrontendOnly } from '../lib/frontendOnly'
import { applyAuthTokensFromResponse } from '../lib/authStorage'
import { getApiErrorStatus, publicPost } from './http'

export type EmployeeCreateUserPayload = {
  age: number
  phone: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  profile_photo?: string | null
  date_of_birth?: string | null
  gender?: string | null
  address?: string | null
  pin_code?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  referred_by?: string | null
  is_participant?: boolean | null
  status?: string | null
}

export type CreateUserResult = {
  userId?: number
  alreadyExisted: boolean
}

function isAlreadyExistsError(error: unknown): boolean {
  if (getApiErrorStatus(error) === 409) return true
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase()
  return (
    message.includes('already exists') ||
    message.includes('already registered') ||
    message.includes('already onboard') ||
    message.includes('duplicate')
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

export async function createEmployeeUser(
  payload: EmployeeCreateUserPayload,
): Promise<CreateUserResult> {
  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped create user', {
      phone: payload.phone,
      age: payload.age,
    })
    return { userId: 0, alreadyExisted: false }
  }

  console.info('[users] create', {
    phone: payload.phone,
    age: payload.age,
    gender: payload.gender,
  })

  try {
    const data = await publicPost('/users', payload)
    applyAuthTokensFromResponse(data)
    return { userId: readUserId(data), alreadyExisted: false }
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      console.info('[users] already exists; continuing', { phone: payload.phone })
      return { alreadyExisted: true }
    }
    throw error
  }
}
