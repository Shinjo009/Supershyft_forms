declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export type OnboardUserPayload = {
  age: number
  first_name: string
  last_name: string
  email: string
  phone: string
  gender: string
  dob: string
  address: string
  pincode: string
  city: string
  state: string
  country: string
  blood_collection_date: string
  blood_collection_time_slot: string
  blood_collection_time_slot_id: string
  blood_collection_cabin: string | null
  participants_employee_id: string
  participant_department: string
  participant_blood_group: string
  consultations: Record<string, boolean>
}

export type OnboardUserResult = {
  user_id: number
  created: boolean
  is_participant: boolean
  engagement_id: number | null
  engagement_code: string
  engagement_participant_id: number | null
  assessment_instance_id: number | null
  metsights_record_id: number | null
  preview_available: boolean
  payment_required: boolean
  otp_session_id: number | null
}

export type BookOnboardPayload = {
  user_id: number
  blood_collection_date: string
  blood_collection_time_slot_id: string
  blood_collection_time_slot: string
  consultations: Record<string, boolean>
  diagnostic_package_id: number
  payment_required?: boolean
  otp_session_id?: number | null
}

type ValidationErrorDetail = {
  loc?: Array<string | number>
  msg?: string
  type?: string
  input?: string
  ctx?: Record<string, unknown>
}

type ValidationErrorResponse = {
  detail?: ValidationErrorDetail[]
  message?: string
  data?: {
    message?: string
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

function parseValidationMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const response = data as ValidationErrorResponse

  if (typeof response.message === 'string' && response.message.trim()) {
    return response.message
  }
  if (typeof response.data?.message === 'string' && response.data.message.trim()) {
    return response.data.message
  }

  if (!Array.isArray(response.detail) || response.detail.length === 0) return null

  const messages = response.detail
    .map((item) => item.msg)
    .filter((msg): msg is string => typeof msg === 'string' && msg.length > 0)

  return messages.length > 0 ? messages.join(', ') : null
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export async function onboardUserToEngagement(
  payload: OnboardUserPayload,
): Promise<OnboardUserResult> {
  const baseUrl = firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )

  const engagementCode = firstNonEmpty(
    import.meta.env.VITE_ENGAGEMENT_CODE,
    import.meta.env.VITE_CBTW_ENGAGEMENT_CODE,
    import.meta.env.ENGAGEMENT_CODE,
    'CBMU0626',
  )

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/users/code/${encodeURIComponent(engagementCode)}/onboard`

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
    const requestId = response.headers.get('x-request-id') || ''
    const statusPrefix = `Request failed (${response.status})`
    const traceSuffix = requestId ? ` [request-id: ${requestId}]` : ''
    const endpointHint = ` [url: ${url}] [engagement: ${engagementCode}]`
    console.error('[onboard] request payload json', JSON.stringify(payload, null, 2))
    console.error('[onboard] error response json', JSON.stringify(data, null, 2))

    const validationMessage = parseValidationMessage(data)
    if (validationMessage) {
      throw new Error(`${statusPrefix}: ${validationMessage}${traceSuffix}${endpointHint}`)
    }

    if (data && typeof data === 'object') {
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}${endpointHint}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}${endpointHint}`)
    }

    throw new Error(`${statusPrefix}. Unable to onboard user.${traceSuffix}${endpointHint}`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected response while onboarding user.')
  }

  const body = data as OnboardUserResult & { data?: OnboardUserResult }
  const result = body.data && typeof body.data === 'object' ? body.data : body
  const userId = parseOptionalNumber(result.user_id)

  if (userId == null) {
    throw new Error('Onboard response did not include a user id.')
  }

  return {
    user_id: userId,
    created: Boolean(result.created),
    is_participant: Boolean(result.is_participant),
    engagement_id: parseOptionalNumber(result.engagement_id),
    engagement_code: result.engagement_code || engagementCode,
    engagement_participant_id: parseOptionalNumber(result.engagement_participant_id),
    assessment_instance_id: parseOptionalNumber(result.assessment_instance_id),
    metsights_record_id: parseOptionalNumber(result.metsights_record_id),
    preview_available: Boolean(result.preview_available),
    payment_required: Boolean(result.payment_required),
    otp_session_id: parseOptionalNumber(result.otp_session_id),
  }
}

export async function bookOnboardEngagement(payload: BookOnboardPayload): Promise<string> {
  const baseUrl = firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )

  const engagementCode = firstNonEmpty(
    import.meta.env.VITE_ENGAGEMENT_CODE,
    import.meta.env.VITE_CBTW_ENGAGEMENT_CODE,
    import.meta.env.ENGAGEMENT_CODE,
    'CBMU0626',
  )

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/users/code/${encodeURIComponent(engagementCode)}/onboard/book`

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
    const requestId = response.headers.get('x-request-id') || ''
    const statusPrefix = `Request failed (${response.status})`
    const traceSuffix = requestId ? ` [request-id: ${requestId}]` : ''
    const endpointHint = ` [url: ${url}] [engagement: ${engagementCode}]`
    console.error('[onboard-book] request payload json', JSON.stringify(payload, null, 2))
    console.error('[onboard-book] error response json', JSON.stringify(data, null, 2))

    const validationMessage = parseValidationMessage(data)
    if (validationMessage) {
      throw new Error(`${statusPrefix}: ${validationMessage}${traceSuffix}${endpointHint}`)
    }

    if (data && typeof data === 'object') {
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}${endpointHint}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}${endpointHint}`)
    }

    throw new Error(`${statusPrefix}. Unable to confirm booking.${traceSuffix}${endpointHint}`)
  }

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  return 'Booking confirmed'
}

export type VerifyPayPayload = {
  phone: string
  otp: string
  discount_code: string | null
}

export type VerifyPayResult = {
  razorpay_order_id: string
  amount_paise: number
  amount_rupees: number
  currency: string
  key_id: string
  booking_ids: number[]
  booking_id: number | null
  user_id: number | null
  engagement_id: number | null
  discount: unknown
  tokens?: {
    access_token?: string
    refresh_token?: string
  }
}

export async function verifyOnboardPay(payload: VerifyPayPayload): Promise<VerifyPayResult> {
  const baseUrl = firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )

  const engagementCode = firstNonEmpty(
    import.meta.env.VITE_ENGAGEMENT_CODE,
    import.meta.env.VITE_CBTW_ENGAGEMENT_CODE,
    import.meta.env.ENGAGEMENT_CODE,
    'CBMU0626',
  )

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/users/code/${encodeURIComponent(engagementCode)}/onboard/verify-pay`

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
    const requestId = response.headers.get('x-request-id') || ''
    const statusPrefix = `Request failed (${response.status})`
    const traceSuffix = requestId ? ` [request-id: ${requestId}]` : ''
    const endpointHint = ` [url: ${url}] [engagement: ${engagementCode}]`
    console.error('[verify-pay] request payload json', JSON.stringify(payload, null, 2))
    console.error('[verify-pay] error response json', JSON.stringify(data, null, 2))

    const validationMessage = parseValidationMessage(data)
    if (validationMessage) {
      throw new Error(`${statusPrefix}: ${validationMessage}${traceSuffix}${endpointHint}`)
    }

    if (data && typeof data === 'object') {
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}${endpointHint}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}${endpointHint}`)
    }

    throw new Error(`${statusPrefix}. Unable to verify payment OTP.${traceSuffix}${endpointHint}`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected response while verifying payment OTP.')
  }

  const body = data as VerifyPayResult & { data?: VerifyPayResult }
  const result = body.data && typeof body.data === 'object' ? body.data : body

  return {
    razorpay_order_id: result.razorpay_order_id || '',
    amount_paise: typeof result.amount_paise === 'number' ? result.amount_paise : 0,
    amount_rupees: typeof result.amount_rupees === 'number' ? result.amount_rupees : 0,
    currency: result.currency || 'INR',
    key_id: result.key_id || '',
    booking_ids: Array.isArray(result.booking_ids) ? result.booking_ids : [],
    booking_id: parseOptionalNumber(result.booking_id),
    user_id: parseOptionalNumber(result.user_id),
    engagement_id: parseOptionalNumber(result.engagement_id),
    discount: result.discount ?? null,
    tokens: result.tokens,
  }
}

export type RazorpaySuccessPayload = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type ConfirmPaymentResult = {
  payment_verified: boolean
  razorpay_order_id: string
  razorpay_payment_id: string
  booking_ids: number[]
  members: Array<{
    user_id?: number
    engagement_id?: number
    status?: string
    message?: string
  }>
  engagement_id: number | null
  engagement_code: string
}

export async function confirmOnboardPayment(
  payload: RazorpaySuccessPayload,
): Promise<ConfirmPaymentResult> {
  const baseUrl = firstNonEmpty(
    import.meta.env.VITE_BACKEND_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_BASE_URL,
    import.meta.env.BACKEND_BASE_URL,
    import.meta.env.API_BASE_URL,
  )

  const engagementCode = firstNonEmpty(
    import.meta.env.VITE_ENGAGEMENT_CODE,
    import.meta.env.VITE_CBTW_ENGAGEMENT_CODE,
    import.meta.env.ENGAGEMENT_CODE,
    'CBMU0626',
  )

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Set VITE_BACKEND_BASE_URL in .env and restart the dev server.',
    )
  }

  const url = `${trimTrailingSlash(baseUrl)}/users/code/${encodeURIComponent(engagementCode)}/onboard/confirm-payment`

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
    const requestId = response.headers.get('x-request-id') || ''
    const statusPrefix = `Request failed (${response.status})`
    const traceSuffix = requestId ? ` [request-id: ${requestId}]` : ''
    const endpointHint = ` [url: ${url}] [engagement: ${engagementCode}]`
    console.error('[confirm-payment] request payload json', JSON.stringify(payload, null, 2))
    console.error('[confirm-payment] error response json', JSON.stringify(data, null, 2))

    const validationMessage = parseValidationMessage(data)
    if (validationMessage) {
      throw new Error(`${statusPrefix}: ${validationMessage}${traceSuffix}${endpointHint}`)
    }

    if (data && typeof data === 'object') {
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}${endpointHint}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}${endpointHint}`)
    }

    throw new Error(`${statusPrefix}. Unable to confirm payment.${traceSuffix}${endpointHint}`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected response while confirming payment.')
  }

  const body = data as ConfirmPaymentResult & { data?: ConfirmPaymentResult }
  const result = body.data && typeof body.data === 'object' ? body.data : body

  return {
    payment_verified: Boolean(result.payment_verified),
    razorpay_order_id: result.razorpay_order_id || payload.razorpay_order_id,
    razorpay_payment_id: result.razorpay_payment_id || payload.razorpay_payment_id,
    booking_ids: Array.isArray(result.booking_ids) ? result.booking_ids : [],
    members: Array.isArray(result.members) ? result.members : [],
    engagement_id: parseOptionalNumber(result.engagement_id),
    engagement_code: result.engagement_code || engagementCode,
  }
}

export function openRazorpayCheckout(
  order: VerifyPayResult,
  user: { name: string; email: string; phone: string },
): Promise<RazorpaySuccessPayload> {
  return new Promise((resolve, reject) => {
    if (!order.razorpay_order_id || !order.key_id) {
      reject(new Error('Razorpay order details are missing.'))
      return
    }

    const RazorpayCtor = window.Razorpay
    if (!RazorpayCtor) {
      reject(new Error('Razorpay is not available. Please refresh and try again.'))
      return
    }

    const checkout = new RazorpayCtor({
      key: order.key_id,
      amount: order.amount_paise,
      currency: order.currency || 'INR',
      order_id: order.razorpay_order_id,
      name: 'SuperShyft',
      description: 'Booking payment',
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone,
      },
      handler: (response: RazorpaySuccessPayload) => {
        if (!response?.razorpay_payment_id || !response?.razorpay_order_id || !response?.razorpay_signature) {
          reject(new Error('Incomplete Razorpay payment response.'))
          return
        }
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        })
      },
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled.')),
      },
    })

    checkout.open()
  })
}

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay can only be loaded in the browser.'))
  }
  if (window.Razorpay) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Unable to load Razorpay.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Razorpay.'))
    document.body.appendChild(script)
  })
}
