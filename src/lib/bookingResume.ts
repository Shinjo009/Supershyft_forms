import type { BookingPage } from '../api/campOnboarding'
import { defaultFormData, type FormData } from '../types'

export type BookingDraft = {
  form: FormData
  bookingPage: BookingPage
  maxReachedBookingIndex: number
}

const BOOKING_PAGES: readonly BookingPage[] = [
  'personal',
  'address',
  'schedule',
  'preview',
  'otp',
]

function storageKey(campCode: string): string {
  return `supershyft.bookingDraft.${campCode}`
}

function isBookingPage(value: unknown): value is BookingPage {
  return typeof value === 'string' && (BOOKING_PAGES as readonly string[]).includes(value)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readForm(value: unknown): FormData {
  const row = asRecord(value) ?? {}
  const merged: FormData = { ...defaultFormData }
  for (const key of Object.keys(defaultFormData) as Array<keyof FormData>) {
    const next = row[key]
    if (typeof next !== 'string') continue
    if (key === 'gender') {
      merged.gender = next === 'male' || next === 'female' ? next : ''
      continue
    }
    ;(merged as Record<string, string>)[key] = next
  }
  return merged
}

export function readBookingDraft(campCode: string): BookingDraft | null {
  if (typeof window === 'undefined' || !campCode) return null
  try {
    const raw = window.sessionStorage.getItem(storageKey(campCode))
    if (!raw) return null
    const parsed = asRecord(JSON.parse(raw) as unknown)
    if (!parsed) return null
    const bookingPage = parsed.bookingPage
    if (!isBookingPage(bookingPage)) return null
    const maxReachedBookingIndex = Number(parsed.maxReachedBookingIndex)
    return {
      form: readForm(parsed.form),
      bookingPage,
      maxReachedBookingIndex: Number.isFinite(maxReachedBookingIndex)
        ? Math.max(0, Math.floor(maxReachedBookingIndex))
        : 0,
    }
  } catch {
    return null
  }
}

export function writeBookingDraft(campCode: string, draft: BookingDraft): void {
  if (typeof window === 'undefined' || !campCode) return
  try {
    window.sessionStorage.setItem(storageKey(campCode), JSON.stringify(draft))
  } catch {
    // Quota or private-mode restrictions — resume is best-effort.
  }
}

export function clearBookingDraft(campCode: string): void {
  if (typeof window === 'undefined' || !campCode) return
  try {
    window.sessionStorage.removeItem(storageKey(campCode))
  } catch {
    // ignore
  }
}
