import { isFrontendOnly } from '../lib/frontendOnly'
import { applyAuthTokensFromResponse } from '../lib/authStorage'
import { createEmployeeUser, type EmployeeCreateUserPayload } from './users'
import { publicPost } from './http'

export type BookingOtpTarget = {
  phone?: string
  email?: string
}

const PHONE_REGEX = /^[6-9]\d{9}$/

function normalizePhone(phone: string | undefined): string | undefined {
  const digits = String(phone || '')
    .replace(/\D/g, '')
    .replace(/^91(?=\d{10}$)/, '')
  if (!digits) return undefined
  if (!PHONE_REGEX.test(digits)) {
    throw new Error('Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.')
  }
  return digits
}

function requirePhone(phone: string | undefined): string {
  const normalized = normalizePhone(phone)
  if (!normalized) {
    throw new Error('Phone is required to send OTP.')
  }
  return normalized
}

export type BookingOtpSendResult = {
  email: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readEmailField(row: Record<string, unknown> | null): string {
  if (!row) return ''
  const value = row.email
  return typeof value === 'string' ? value.trim() : ''
}

/** Email the OTP was sent to, returned by `/auth/resend-otp`. */
export function readOtpDestinationEmail(data: unknown): string {
  const root = asRecord(data)
  if (!root) return ''
  const direct = readEmailField(root)
  if (direct) return direct
  const nested = asRecord(root.data)
  const fromData = readEmailField(nested)
  if (fromData) return fromData
  return readEmailField(asRecord(nested?.user)) || readEmailField(asRecord(root.user))
}

async function postResendOtp(
  target: BookingOtpTarget,
  action: 'send' | 'resend',
): Promise<BookingOtpSendResult> {
  const payload = { phone: requirePhone(target.phone) }

  if (isFrontendOnly()) {
    console.info(`[frontend-only] skipped resend-otp (${action})`, payload)
    return { email: '' }
  }

  console.info(`[otp] ${action} via resend-otp`, payload)
  const data = await publicPost('/auth/resend-otp', payload)
  applyAuthTokensFromResponse(data)
  return { email: readOtpDestinationEmail(data) }
}

export async function sendBookingOtp(target: BookingOtpTarget): Promise<BookingOtpSendResult> {
  return postResendOtp(target, 'send')
}

export async function resendBookingOtp(target: BookingOtpTarget): Promise<BookingOtpSendResult> {
  return postResendOtp(target, 'resend')
}

export async function verifyBookingOtp(target: BookingOtpTarget, otp: string): Promise<void> {
  const phone = requirePhone(target.phone)
  const code = String(otp || '').replace(/\D/g, '')

  if (!/^\d{4,10}$/.test(code)) {
    throw new Error('Enter the 6-digit OTP.')
  }

  const payload = { phone, otp: code }

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped verify-otp', { phone })
    return
  }

  console.info('[otp] verify', { phone })
  const data = await publicPost('/auth/verify-otp', payload)
  applyAuthTokensFromResponse(data)
}

/** Create the user if needed, then send OTP. Existing users (409) still proceed to OTP. */
export async function startBookingOtpFlow(userPayload: EmployeeCreateUserPayload): Promise<void> {
  await createEmployeeUser(userPayload)
  await sendBookingOtp({ phone: userPayload.phone })
}
