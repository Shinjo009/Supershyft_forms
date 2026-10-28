import { getBackendBaseUrl, getDiagnosticPackageId } from './onboard'

export type AvailableSlot = {
  slotDate: string
  slotTime: string
  endTime: string
  stmId: string
  label: string
}

export type FetchAvailableSlotsInput = {
  provider: string
  slotDate: string
  zoneId: string
  latitude: number
  longitude: number
  pincode: string
  hasFemalePatient: boolean
  diagnosticPackageId?: number
}

type AvailableSlotsResponse = {
  provider?: string
  slots?: Array<{
    slot_date?: string
    slot_time?: string
    end_time?: string
    stm_id?: string | number
  }>
  data?: {
    provider?: string
    slots?: Array<{
      slot_date?: string
      slot_time?: string
      end_time?: string
      stm_id?: string | number
    }>
    message?: string
  }
  message?: string
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

function mapSlots(data: unknown): AvailableSlot[] {
  const row = data && typeof data === 'object' ? (data as AvailableSlotsResponse) : null
  const slots = Array.isArray(row?.slots) ? row.slots : Array.isArray(row?.data?.slots) ? row.data.slots : []

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

export async function fetchAvailableSlots(input: FetchAvailableSlotsInput): Promise<AvailableSlot[]> {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Copy .env.example to .env, set VITE_BACKEND_BASE_URL, and restart the dev server.',
    )
  }

  const provider = (input.provider || 'healthians').trim().toLowerCase() || 'healthians'
  const payload =
    provider === 'orange_health'
      ? {
          provider: 'orange_health',
          slot_date: input.slotDate,
          latitude: input.latitude,
          longitude: input.longitude,
        }
      : {
          provider: 'healthians',
          slot_date: input.slotDate,
          diagnostic_package_id: input.diagnosticPackageId ?? getDiagnosticPackageId(),
          zone_id: input.zoneId,
          latitude: input.latitude,
          longitude: input.longitude,
          pincode: input.pincode,
          has_female_patient: input.hasFemalePatient,
        }

  if (provider !== 'orange_health' && payload.diagnostic_package_id == null) {
    throw new Error('Unable to find a diagnostic package for this engagement.')
  }

  const url = `${trimTrailingSlash(baseUrl)}/diagnostics/public/available-slots`
  console.info('[available-slots] request', { url, payload })

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
      if (row.message) throw new Error(row.message)
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

  return mapSlots(data)
}
