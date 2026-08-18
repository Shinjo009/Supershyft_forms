import { isFrontendOnly } from '../lib/frontendOnly'
import { applyAuthTokensFromResponse } from '../lib/authStorage'
import { createEmployeeUser, type EmployeeCreateUserPayload } from './users'
import { publicPost } from './http'

export type BookingOtpTarget = {
  phone?: string
  email?: string
}

const PHONE_REGEX = /^[6-9]\d{9}$/
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

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

function normalizeEmail(email: string | undefined): string | undefined {
  const trimmed = String(email || '').trim()
  if (!trimmed) return undefined
  if (!EMAIL_REGEX.test(trimmed) || trimmed.length < 3 || trimmed.length > 254) {
    throw new Error('Please enter a valid email address.')
  }
  return trimmed
}

function requirePhone(phone: string | undefined): string {
  const normalized = normalizePhone(phone)
  if (!normalized) {
    throw new Error('Phone is required to send OTP.')
  }
  return normalized
}

function requireEmail(email: string | undefined): string {
  const normalized = normalizeEmail(email)
  if (!normalized) {
    throw new Error('Email is required to resend OTP.')
  }
  return normalized
}

export async function sendBookingOtp(target: BookingOtpTarget): Promise<void> {
  const payload = { phone: requirePhone(target.phone) }

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped send-otp', payload)
    return
  }

  console.info('[otp] send', payload)
  const data = await publicPost('/auth/send-otp', payload)
  applyAuthTokensFromResponse(data)
}

export async function resendBookingOtp(target: BookingOtpTarget): Promise<void> {
  const payload = {
    phone: requirePhone(target.phone),
    email: requireEmail(target.email),
  }

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped resend-otp', payload)
    return
  }

  console.info('[otp] resend', payload)
  const data = await publicPost('/auth/resend-otp', payload)
  applyAuthTokensFromResponse(data)
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
