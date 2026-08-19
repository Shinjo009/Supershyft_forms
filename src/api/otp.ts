import { isFrontendOnly } from '../lib/frontendOnly'
import { applyAuthTokensFromResponse } from '../lib/authStorage'
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
  const payload = { phone: requirePhone(target.phone) }

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
