import type { FormData } from '../types'

const BOOKING_DRAFT_KEY = 'supershyft_booking_draft'
const PAYMENT_RETURN_HANDLED_KEY = 'supershyft_payment_return_handled'
const PENDING_ONBOARD_AFTER_PAYMENT_KEY = 'supershyft_pending_onboard_after_payment'
const ONBOARD_IN_FLIGHT_KEY = 'supershyft_onboard_in_flight'

const DEFAULT_RAZORPAY_PAYMENT_LINK = 'https://rzp.io/rzp/Xml9FK3'

export type BookingDraft = {
  form: FormData
  savedAt: number
}

export function getRazorpayPaymentLinkUrl(): string {
  const fromEnv = import.meta.env.VITE_RAZORPAY_PAYMENT_LINK_URL?.trim()
  return fromEnv || DEFAULT_RAZORPAY_PAYMENT_LINK
}

export function saveBookingDraft(form: FormData): void {
  if (typeof window === 'undefined') return
  const draft: BookingDraft = { form, savedAt: Date.now() }
  window.sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft))
}

export function loadBookingDraft(): BookingDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(BOOKING_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BookingDraft
    if (!parsed?.form || typeof parsed.form !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function clearBookingDraft(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(BOOKING_DRAFT_KEY)
}

function paymentReturnAlreadyHandled(): boolean {
  return typeof window !== 'undefined' && window.sessionStorage.getItem(PAYMENT_RETURN_HANDLED_KEY) === '1'
}

export function hasPendingOnboardAfterPayment(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem(PENDING_ONBOARD_AFTER_PAYMENT_KEY) === '1'
  )
}

export function setPendingOnboardAfterPayment(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(PENDING_ONBOARD_AFTER_PAYMENT_KEY, '1')
}

export function clearPendingOnboardAfterPayment(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(PENDING_ONBOARD_AFTER_PAYMENT_KEY)
}

/** Prevents duplicate onboard POSTs when React remounts after Razorpay return. */
export function tryBeginOnboardInFlight(): boolean {
  if (typeof window === 'undefined') return false
  if (window.sessionStorage.getItem(ONBOARD_IN_FLIGHT_KEY) === '1') return false
  window.sessionStorage.setItem(ONBOARD_IN_FLIGHT_KEY, '1')
  return true
}

export function clearOnboardInFlight(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ONBOARD_IN_FLIGHT_KEY)
}

export function markPaymentReturnHandled(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(PAYMENT_RETURN_HANDLED_KEY, '1')
}

export function clearPaymentReturnHandled(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(PAYMENT_RETURN_HANDLED_KEY)
}

/** Razorpay Payment Link redirect query params and optional custom callbacks. */
export function parsePaymentReturnFromUrl(
  search: string = typeof window !== 'undefined' ? window.location.search : '',
): 'success' | 'failed' | null {
  if (!search) return null
  const params = new URLSearchParams(search)

  const razorpayStatus = params.get('razorpay_payment_link_status')?.toLowerCase()
  if (razorpayStatus === 'paid' || razorpayStatus === 'partially_paid') return 'success'
  if (
    razorpayStatus === 'cancelled' ||
    razorpayStatus === 'expired' ||
    razorpayStatus === 'failed'
  ) {
    return 'failed'
  }

  const custom = params.get('payment_status')?.toLowerCase()
  if (custom === 'success' || custom === 'paid') return 'success'
  if (custom === 'failed' || custom === 'cancelled' || custom === 'cancel') return 'failed'

  if (params.get('razorpay_payment_id') && !razorpayStatus) return 'success'

  return null
}

export function clearPaymentReturnQueryFromUrl(): void {
  if (typeof window === 'undefined') return
  window.history.replaceState({}, '', window.location.pathname + window.location.hash)
}

export function shouldHandlePaymentReturn(): boolean {
  if (hasPendingOnboardAfterPayment()) return true
  const status = parsePaymentReturnFromUrl()
  return status !== null && !paymentReturnAlreadyHandled()
}

export function getPaymentReturnBaseUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${window.location.pathname}`
}

export function redirectToRazorpayPayment(form: FormData): void {
  saveBookingDraft(form)
  clearPaymentReturnHandled()
  const paymentUrl = getRazorpayPaymentLinkUrl()
  console.info('[payment] Redirecting to Razorpay', {
    paymentUrl,
    returnBaseUrl: getPaymentReturnBaseUrl(),
    hint: 'Set this URL as the Razorpay Payment Link callback in the Razorpay dashboard.',
  })
  window.location.assign(paymentUrl)
}
