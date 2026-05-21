import type { FormData } from '../types'
import { defaultFormData } from '../types'

const BOOKING_SESSION_KEY = 'supershyft_booking_session'
const USED_BOOKING_CONTACTS_KEY = 'supershyft_used_booking_contacts'

export function bookingContactKey(phone: string, email: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalizedPhone = digits.length >= 10 ? digits.slice(-10) : digits
  return `${normalizedPhone}|${email.trim().toLowerCase()}`
}

/** True when this phone+email already completed a successful onboard in this browser. */
export function shouldUniquifyBookingContact(phone: string, email: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(USED_BOOKING_CONTACTS_KEY)
    if (!raw) return false
    const used = JSON.parse(raw) as string[]
    return Array.isArray(used) && used.includes(bookingContactKey(phone, email))
  } catch {
    return false
  }
}

export function markBookingContactUsed(phone: string, email: string): void {
  if (typeof window === 'undefined') return
  const key = bookingContactKey(phone, email)
  try {
    const raw = window.localStorage.getItem(USED_BOOKING_CONTACTS_KEY)
    const used: string[] = raw ? JSON.parse(raw) : []
    if (!Array.isArray(used) || used.includes(key)) return
    used.push(key)
    window.localStorage.setItem(USED_BOOKING_CONTACTS_KEY, JSON.stringify(used))
  } catch {
    window.localStorage.setItem(USED_BOOKING_CONTACTS_KEY, JSON.stringify([key]))
  }
}

export type BookingSession = {
  form: FormData
  step: number
  maxReachedStep: number
}

function isFormData(value: unknown): value is FormData {
  return Boolean(value && typeof value === 'object' && 'firstName' in value && 'phone' in value)
}

export function loadBookingSession(): BookingSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(BOOKING_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BookingSession
    if (!isFormData(parsed.form)) return null
    return {
      form: { ...defaultFormData, ...parsed.form },
      step: typeof parsed.step === 'number' ? parsed.step : 1,
      maxReachedStep: typeof parsed.maxReachedStep === 'number' ? parsed.maxReachedStep : 1,
    }
  } catch {
    return null
  }
}

export function saveBookingSession(session: BookingSession): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(BOOKING_SESSION_KEY, JSON.stringify(session))
}

export function clearBookingSession(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(BOOKING_SESSION_KEY)
}

export function stepToHash(step: number): string {
  return `#step-${step}`
}

export function parseStepFromHash(hash: string = typeof window !== 'undefined' ? window.location.hash : ''): number | null {
  const match = hash.match(/^#step-(\d+)$/)
  if (!match) return null
  const step = Number.parseInt(match[1], 10)
  return Number.isFinite(step) && step >= 1 && step <= 6 ? step : null
}

export function syncHistoryForStep(step: number, mode: 'push' | 'replace' = 'push'): void {
  if (typeof window === 'undefined') return
  const url = `${window.location.pathname}${window.location.search}${stepToHash(step)}`
  const state = { step, formWizard: true }
  if (mode === 'replace') {
    window.history.replaceState(state, '', url)
  } else {
    window.history.pushState(state, '', url)
  }
}
