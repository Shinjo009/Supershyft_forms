import { ApiError } from '../api/http'

const INTERNET = 'Please check your internet and try again.'
const GENERIC = 'Something went wrong. Please try again.'
const TRY_AGAIN = 'Please try again.'
const INVALID_DETAILS = 'Some details look invalid. Please check and try again.'
const SESSION = 'Your session expired. Please go back and continue again.'
const FORBIDDEN = "You don't have access to continue. Please try again later."
const UNAVAILABLE = 'Service unavailable. Please try again later.'
const ALREADY_REGISTERED = 'This is already registered. Please continue or use different details.'
const SERVER_BUSY = 'Server is busy. Please try again in a moment.'
const SERVICE_DOWN = 'Service is temporarily unavailable. Please try again later.'

function rawText(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error.trim()
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return fallback
}

function statusFrom(error: unknown, text: string): number | null {
  if (error instanceof ApiError && Number.isFinite(error.status)) return error.status
  const match = text.match(/request failed \((\d{3})\)/i)
  if (!match) return null
  const status = Number(match[1])
  return Number.isFinite(status) ? status : null
}

/** Turn technical API and network failures into the copy users should see. */
export function toUserFacingError(error: unknown, fallback = GENERIC): string {
  const text = rawText(error, fallback)
  const lower = text.toLowerCase()
  const status = statusFrom(error, text)

  if (lower.includes('missing api base url')) return SERVICE_DOWN
  if (lower.includes('load failed') || lower.includes('failed to fetch')) return INTERNET
  if (lower.includes('method not allowed') || status === 405) return GENERIC
  if (lower.includes('internal_error')) return TRY_AGAIN
  if (lower.includes('not logged in') || status === 401) return SESSION
  if (status === 403) return FORBIDDEN
  if (status === 404) return UNAVAILABLE
  if (status === 409) return ALREADY_REGISTERED
  if (status === 400 || status === 422) return INVALID_DETAILS
  if (status != null && status >= 500 && status <= 599) return SERVER_BUSY

  return text
}
