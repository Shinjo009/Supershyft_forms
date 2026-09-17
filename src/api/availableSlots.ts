import { getBackendBaseUrl, resolveEngagementCodeFromGender } from './onboard'

export type AvailableSlotsPayload = {
  address_line: string
  landmark?: string
  city: string
  pincode: string
  blood_collection_date: string
}

export type AvailableSlot = {
  stmId: string
  slotDate: string
  slotTime: string
  endTime: string
  label: string
}

export type AvailableSlotsResult = {
  engagementCode: string
  status: string
  slots: AvailableSlot[]
}

type AvailableSlotsResponse = {
  data?: {
    engagement_code?: string
    status?: string
    message?: string
    slots?: Array<{
      stm_id?: string
      slot_date?: string
      slot_time?: string
      end_time?: string
    }>
  }
  meta?: Record<string, unknown>
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Convert "07:00:00" / "07:00" to "07:00 am". */
export function formatClockLabel(time: string): string {
  const parts = time.trim().split(':')
  const hour24 = Number.parseInt(parts[0] || '', 10)
  const minute = Number.parseInt(parts[1] || '0', 10)
  if (!Number.isFinite(hour24) || hour24 < 0 || hour24 > 23) return time.trim()

  const period = hour24 >= 12 ? 'pm' : 'am'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${pad2(hour12)}:${pad2(Number.isFinite(minute) ? minute : 0)} ${period}`
}

export function formatSlotRangeLabel(slotTime: string, endTime: string): string {
  return `${formatClockLabel(slotTime)} - ${formatClockLabel(endTime)}`
}

export async function fetchAvailableSlots(
  payload: AvailableSlotsPayload,
  gender: string,
): Promise<AvailableSlotsResult> {
  const engagementCode = resolveEngagementCodeFromGender(gender)
  const baseUrl = getBackendBaseUrl()
  const url = `${baseUrl}/book/code/${encodeURIComponent(engagementCode)}/available-slots`

  const apiPayload = {
    address_line: payload.address_line.trim(),
    landmark: (payload.landmark ?? '').trim(),
    city: payload.city.trim(),
    pincode: payload.pincode.trim(),
    blood_collection_date: payload.blood_collection_date.trim(),
  }

  console.info('[available-slots] fetch', { engagementCode, url, apiPayload })

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
    const requestId = response.headers.get('x-request-id') || ''
    const statusPrefix = `Request failed (${response.status})`
    const traceSuffix = requestId ? ` [request-id: ${requestId}]` : ''
    console.error('[available-slots] error response', data)

    if (data && typeof data === 'object') {
      const body = data as AvailableSlotsResponse
      const apiMessage = body.data?.message?.trim()
      if (apiMessage) throw new Error(apiMessage)
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`${statusPrefix}: ${jsonText}${traceSuffix}`)
      }
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(`${statusPrefix}: ${data}${traceSuffix}`)
    }

    throw new Error(`${statusPrefix}. Unable to load available slots.${traceSuffix}`)
  }

  const body = (data && typeof data === 'object' ? data : {}) as AvailableSlotsResponse
  const row = body.data
  const rawSlots = Array.isArray(row?.slots) ? row.slots : []

  const slots: AvailableSlot[] = rawSlots
    .map((slot) => {
      const slotTime = (slot.slot_time || '').trim()
      const endTime = (slot.end_time || '').trim()
      const stmId = (slot.stm_id || '').trim()
      if (!slotTime || !endTime || !stmId) return null
      return {
        stmId,
        slotDate: (slot.slot_date || '').trim(),
        slotTime,
        endTime,
        label: formatSlotRangeLabel(slotTime, endTime),
      }
    })
    .filter((slot): slot is AvailableSlot => slot !== null)

  return {
    engagementCode: row?.engagement_code?.trim() || engagementCode,
    status: (row?.status || '').trim().toLowerCase() || 'success',
    slots,
  }
}
