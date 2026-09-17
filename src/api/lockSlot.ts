import { getBackendBaseUrl, resolveEngagementCodeFromGender } from './onboard'

export type LockSlotPayload = {
  address_line: string
  landmark?: string
  city: string
  pincode: string
  user_id: number
  blood_collection_date: string
  blood_collection_time_slot_id: string
  blood_collection_time_slot: string
}

export type LockSlotResult = {
  engagementCode: string
  status: string
  message: string
  slotId?: string
  freezeTime?: string
  vendorBillingUserId?: string
  zoneId?: string
}

type LockSlotResponse = {
  data?: {
    engagement_code?: string
    status?: string
    message?: string
    slot_id?: string
    freeze_time?: string
    vendor_billing_user_id?: string
    zone_id?: string
  }
  meta?: Record<string, unknown>
}

function parseErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const body = data as {
      detail?: string | Array<{ msg?: string }>
      message?: string
      data?: { message?: string }
    }
    if (typeof body.data?.message === 'string' && body.data.message.trim()) {
      return body.data.message.trim()
    }
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      const messages = body.detail
        .map((item) => item.msg)
        .filter((msg): msg is string => typeof msg === 'string' && msg.length > 0)
      if (messages.length > 0) return messages.join(', ')
    }
    if (typeof body.detail === 'string' && body.detail.trim()) return body.detail
    if (typeof body.message === 'string' && body.message.trim()) return body.message
  }
  if (typeof data === 'string' && data.trim()) return data
  return `Request failed (${status})`
}

/** Normalize display/"7:00"/"07:00:00" to HH:mm:ss for lock payload. */
export function toLockTimeSlot(value: string): string {
  const normalized = value.trim()
  if (!normalized) return '07:00:00'

  if (/^\d{1,2}:\d{2}:\d{2}$/.test(normalized)) {
    const [h, m, s] = normalized.split(':')
    return `${String(Number.parseInt(h, 10)).padStart(2, '0')}:${m}:${s}`
  }

  if (/^\d{1,2}:\d{2}$/.test(normalized)) {
    const [h, m] = normalized.split(':')
    return `${String(Number.parseInt(h, 10)).padStart(2, '0')}:${m}:00`
  }

  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)
  if (match) {
    let hour = Number.parseInt(match[1], 10)
    const minute = match[2]
    const period = match[3].toLowerCase()
    if (period === 'pm' && hour < 12) hour += 12
    if (period === 'am' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${minute}:00`
  }

  const firstPart = normalized.split('-')[0]?.trim() || normalized
  return toLockTimeSlot(firstPart)
}

export async function lockBookingSlot(
  payload: LockSlotPayload,
  gender: string,
): Promise<LockSlotResult> {
  const engagementCode = resolveEngagementCodeFromGender(gender)
  const baseUrl = getBackendBaseUrl()
  const url = `${baseUrl}/book/code/${encodeURIComponent(engagementCode)}/lock`

  const apiPayload = {
    address_line: payload.address_line.trim(),
    landmark: (payload.landmark ?? '').trim(),
    city: payload.city.trim(),
    pincode: payload.pincode.trim(),
    user_id: payload.user_id,
    blood_collection_date: payload.blood_collection_date.trim(),
    blood_collection_time_slot_id: payload.blood_collection_time_slot_id.trim(),
    blood_collection_time_slot: toLockTimeSlot(payload.blood_collection_time_slot),
  }

  console.info('[lock] slot', { engagementCode, url, apiPayload })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(apiPayload),
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data: unknown = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    console.error('[lock] error response', data)
    throw new Error(parseErrorMessage(data, response.status))
  }

  const body = (data && typeof data === 'object' ? data : {}) as LockSlotResponse
  const row = body.data
  const status = (row?.status || '').trim().toLowerCase() || 'success'
  const message = row?.message?.trim() || 'Slot locked'

  if (status && status !== 'success') {
    throw new Error(message || 'Unable to lock slot.')
  }

  return {
    engagementCode: row?.engagement_code?.trim() || engagementCode,
    status,
    message,
    slotId: row?.slot_id?.trim() || undefined,
    freezeTime: row?.freeze_time?.trim() || undefined,
    vendorBillingUserId: row?.vendor_billing_user_id?.trim() || undefined,
    zoneId: row?.zone_id?.trim() || undefined,
  }
}
