import { getBackendBaseUrl, getCelebalEngagementCodeForGender } from './onboard'

export type AvailableSlotsPayload = {
  address_line: string
  landmark: string
  city: string
  pincode: string
  blood_collection_date: string
}

export type AvailableSlot = {
  slotDate: string
  slotTime: string
  endTime: string
  stmId: string
  label: string
}

type AvailableSlotsResponse = {
  data?: {
    engagement_code?: string
    status?: string
    message?: string
    slots?: Array<{
      slot_date?: string
      slot_time?: string
      end_time?: string
      stm_id?: string | number
    }>
  }
  meta?: Record<string, unknown>
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

/** Converts "07:00:00" or "07:00" → "07:00 am" */
export function formatClockLabel(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?/)
  if (!match) return time.trim()
  let hour = Number.parseInt(match[1], 10)
  const minute = match[2]
  if (!Number.isFinite(hour)) return time.trim()
  const suffix = hour >= 12 ? 'pm' : 'am'
  hour = hour % 12
  if (hour === 0) hour = 12
  return `${String(hour).padStart(2, '0')}:${minute} ${suffix}`
}

export function formatSlotRangeLabel(slotTime: string, endTime: string): string {
  return `${formatClockLabel(slotTime)} - ${formatClockLabel(endTime)}`
}

export async function fetchAvailableSlots(
  gender: string,
  payload: AvailableSlotsPayload,
): Promise<AvailableSlot[]> {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const engagementCode = getCelebalEngagementCodeForGender(gender)
  const url = `${trimTrailingSlash(baseUrl)}/book/code/${encodeURIComponent(engagementCode)}/available-slots`

  console.info('[available-slots] request', { engagementCode, url, payload })

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
    console.error('[available-slots] error response', data)
    if (data && typeof data === 'object') {
      const row = data as AvailableSlotsResponse
      if (row.data?.message) throw new Error(row.data.message)
      const jsonText = JSON.stringify(data)
      if (jsonText && jsonText !== '{}') {
        throw new Error(`Unable to load time slots (${response.status}): ${jsonText}`)
      }
    }
    if (typeof data === 'string' && data.trim()) {
      throw new Error(`Unable to load time slots (${response.status}): ${data}`)
    }
    throw new Error(`Unable to load time slots (${response.status}). Please try again.`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid available-slots response from server.')
  }

  const row = (data as AvailableSlotsResponse).data
  const status = (row?.status || '').trim().toLowerCase()
  if (status && status !== 'success') {
    throw new Error(row?.message?.trim() || 'Unable to load time slots for this date.')
  }

  const slots = Array.isArray(row?.slots) ? row.slots : []
  return slots
    .map((slot) => {
      const slotTime = String(slot.slot_time || '').trim()
      const endTime = String(slot.end_time || '').trim()
      const slotDate = String(slot.slot_date || '').trim()
      const stmId = slot.stm_id != null ? String(slot.stm_id).trim() : ''
      if (!slotTime || !endTime) return null
      return {
        slotDate,
        slotTime,
        endTime,
        stmId,
        label: formatSlotRangeLabel(slotTime, endTime),
      } satisfies AvailableSlot
    })
    .filter((slot): slot is AvailableSlot => slot != null)
}
