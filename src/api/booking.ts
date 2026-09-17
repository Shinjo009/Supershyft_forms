import { isFrontendOnly } from '../lib/frontendOnly'
import { publicPost } from './http'

export type CheckServiceAvailabilityPayload = {
  address_line: string
  landmark: string
  city: string
  pincode: string
}

export type ServiceAvailabilityResult = {
  engagementCode: string
  status: 'serviceable' | 'not_serviceable' | string
  message: string
  zoneId?: string
}

type CheckServiceAvailabilityResponse = {
  data?: {
    engagement_code?: string
    status?: string
    message?: string
    zone_id?: string | number
  }
  meta?: unknown
}

export type AvailableSlotsPayload = {
  address_line: string
  landmark: string
  city: string
  pincode: string
  blood_collection_date: string
}

export type AvailableSlot = {
  stmId: string
  slotDate: string
  /** API start time, e.g. "07:00:00" */
  slotTime: string
  endTime: string
  /** UI label, e.g. "07:00 - 08:00 AM" */
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
    slots?: Array<{
      end_time?: string
      slot_date?: string
      slot_time?: string
      stm_id?: string | number
    }>
  }
  meta?: unknown
}

const DEFAULT_ENGAGEMENT_CODE = 'SUMU0226'

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

function resolveEngagementCode(): string {
  return firstNonEmpty(import.meta.env.VITE_ENGAGEMENT_CODE, DEFAULT_ENGAGEMENT_CODE)
}

function parseHms(value: string): { hour: number; minute: number } | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null
  const hour = Number.parseInt(match[1], 10)
  const minute = Number.parseInt(match[2], 10)
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) return null
  return { hour, minute }
}

function format12HourClock(hour24: number, minute: number): string {
  const hour12 = hour24 % 12 || 12
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatAvailableSlotLabel(slotTime: string, endTime: string): string {
  const start = parseHms(slotTime)
  const end = parseHms(endTime)
  if (!start || !end) {
    return [slotTime, endTime].map((part) => part.trim()).filter(Boolean).join(' - ')
  }
  const meridiem = end.hour >= 12 ? 'PM' : 'AM'
  return `${format12HourClock(start.hour, start.minute)} - ${format12HourClock(end.hour, end.minute)} ${meridiem}`
}

/** Format a stored slot start ("07:00:00" or legacy UI label) for display. */
export function formatStoredSlotLabel(slot: string): string {
  const trimmed = slot.trim()
  if (!trimmed) return ''
  if (trimmed.includes('-')) return trimmed
  const start = parseHms(trimmed)
  if (!start) return trimmed
  const endHour = (start.hour + 1) % 24
  return formatAvailableSlotLabel(
    `${String(start.hour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}:00`,
    `${String(endHour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}:00`,
  )
}

export async function checkServiceAvailability(
  payload: CheckServiceAvailabilityPayload,
): Promise<ServiceAvailabilityResult> {
  const engagementCode = resolveEngagementCode()

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped check-service-availability', {
      engagementCode,
      pincode: payload.pincode,
    })
    return {
      engagementCode,
      status: 'serviceable',
      message: 'Serviceable',
    }
  }

  const path = `/book/code/${encodeURIComponent(engagementCode)}/check-service-availability`
  console.info('[booking] check-service-availability', {
    engagementCode,
    city: payload.city,
    pincode: payload.pincode,
  })

  const response = await publicPost<CheckServiceAvailabilityResponse>(path, payload)
  const data = response?.data
  const status = String(data?.status || '').trim().toLowerCase() || 'unknown'
  const message =
    (typeof data?.message === 'string' && data.message.trim()) ||
    (status === 'not_serviceable'
      ? 'This location is not serviceable.'
      : status === 'serviceable'
        ? 'Serviceable'
        : 'Unable to confirm service availability.')
  const zoneId =
    data?.zone_id === undefined || data?.zone_id === null ? undefined : String(data.zone_id)

  return {
    engagementCode: String(data?.engagement_code || engagementCode),
    status,
    message,
    zoneId,
  }
}

export async function fetchAvailableSlots(
  payload: AvailableSlotsPayload,
): Promise<AvailableSlotsResult> {
  const engagementCode = resolveEngagementCode()

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped available-slots', {
      engagementCode,
      date: payload.blood_collection_date,
    })
    return {
      engagementCode,
      status: 'success',
      slots: [
        {
          stmId: 'frontend-only-1',
          slotDate: payload.blood_collection_date,
          slotTime: '07:00:00',
          endTime: '08:00:00',
          label: formatAvailableSlotLabel('07:00:00', '08:00:00'),
        },
        {
          stmId: 'frontend-only-2',
          slotDate: payload.blood_collection_date,
          slotTime: '08:00:00',
          endTime: '09:00:00',
          label: formatAvailableSlotLabel('08:00:00', '09:00:00'),
        },
      ],
    }
  }

  const path = `/book/code/${encodeURIComponent(engagementCode)}/available-slots`
  console.info('[booking] available-slots', {
    engagementCode,
    date: payload.blood_collection_date,
    pincode: payload.pincode,
  })

  const response = await publicPost<AvailableSlotsResponse>(path, payload)
  const data = response?.data
  const slots = Array.isArray(data?.slots)
    ? data.slots
        .map((row) => {
          const slotTime = String(row.slot_time || '').trim()
          const endTime = String(row.end_time || '').trim()
          if (!slotTime) return null
          return {
            stmId: String(row.stm_id ?? ''),
            slotDate: String(row.slot_date || payload.blood_collection_date),
            slotTime,
            endTime,
            label: formatAvailableSlotLabel(slotTime, endTime || slotTime),
          } satisfies AvailableSlot
        })
        .filter((slot): slot is AvailableSlot => Boolean(slot))
    : []

  return {
    engagementCode: String(data?.engagement_code || engagementCode),
    status: String(data?.status || '').trim().toLowerCase() || 'success',
    slots,
  }
}

export type LockSlotPayload = {
  address_line: string
  landmark: string
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
    slot_id?: string | number
    freeze_time?: string | number
    vendor_billing_user_id?: string | number
    zone_id?: string | number
  }
  meta?: unknown
}

export async function lockBookingSlot(payload: LockSlotPayload): Promise<LockSlotResult> {
  const engagementCode = resolveEngagementCode()

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped lock slot', {
      engagementCode,
      userId: payload.user_id,
      date: payload.blood_collection_date,
    })
    return {
      engagementCode,
      status: 'success',
      message: 'Slot locked',
      slotId: payload.blood_collection_time_slot_id,
      freezeTime: '30',
      vendorBillingUserId: String(payload.user_id),
    }
  }

  const path = `/book/code/${encodeURIComponent(engagementCode)}/lock`
  console.info('[booking] lock', {
    engagementCode,
    userId: payload.user_id,
    date: payload.blood_collection_date,
    slotId: payload.blood_collection_time_slot_id,
  })

  const response = await publicPost<LockSlotResponse>(path, payload)
  const data = response?.data
  const status = String(data?.status || '').trim().toLowerCase() || 'success'
  if (status && status !== 'success') {
    throw new Error(
      (typeof data?.message === 'string' && data.message.trim()) ||
        'Unable to lock the selected time slot.',
    )
  }

  return {
    engagementCode: String(data?.engagement_code || engagementCode),
    status,
    message: (typeof data?.message === 'string' && data.message.trim()) || 'Slot locked',
    slotId: data?.slot_id === undefined || data?.slot_id === null ? undefined : String(data.slot_id),
    freezeTime:
      data?.freeze_time === undefined || data?.freeze_time === null
        ? undefined
        : String(data.freeze_time),
    vendorBillingUserId:
      data?.vendor_billing_user_id === undefined || data?.vendor_billing_user_id === null
        ? undefined
        : String(data.vendor_billing_user_id),
    zoneId: data?.zone_id === undefined || data?.zone_id === null ? undefined : String(data.zone_id),
  }
}

export type OnboardBookPayload = {
  user_id: number
  blood_collection_date: string
  blood_collection_time_slot_id: string
  blood_collection_time_slot: string
  consultations: Record<string, unknown>
}

export type OnboardBookResult = {
  engagementCode: string
  raw: unknown
}

export async function confirmOnboardBooking(
  payload: OnboardBookPayload,
): Promise<OnboardBookResult> {
  const engagementCode = resolveEngagementCode()

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped onboard/book', {
      engagementCode,
      userId: payload.user_id,
      date: payload.blood_collection_date,
    })
    return { engagementCode, raw: null }
  }

  const path = `/users/code/${encodeURIComponent(engagementCode)}/onboard/book`
  console.info('[booking] onboard/book', {
    engagementCode,
    userId: payload.user_id,
    date: payload.blood_collection_date,
    slotId: payload.blood_collection_time_slot_id,
  })

  const data = await publicPost(path, payload)
  return { engagementCode, raw: data }
}
