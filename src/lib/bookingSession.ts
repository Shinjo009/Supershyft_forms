import type { FormData } from '../types'
import { defaultFormData } from '../types'

const BOOKING_SESSION_KEY = 'supershyft_booking_session'

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
