import { isFrontendOnly } from '../lib/frontendOnly'
import { publicGet, publicPost } from './http'

export const DEFAULT_DIAGNOSTICS_PROVIDER = 'healthians'
const DEFAULT_ENGAGEMENT_CODE = 'SUMU0226'
const DEFAULT_EMPLOYEE_ID = '0000IN0000'

function firstNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

export function resolveEngagementCode(): string {
  return firstNonEmpty(import.meta.env.VITE_ENGAGEMENT_CODE, DEFAULT_ENGAGEMENT_CODE)
}

export function resolveEmployeeId(): string {
  return firstNonEmpty(import.meta.env.VITE_PARTICIPANTS_EMPLOYEE_ID, DEFAULT_EMPLOYEE_ID)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function unwrapData(value: unknown): Record<string, unknown> | null {
  const row = asRecord(value)
  if (!row) return null
  const nested = asRecord(row.data)
  return nested || row
}

function parseId(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function parseHms(value: string): { hour: number; minute: number } | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null
  const hour = Number.parseInt(match[1], 10)
  const minute = Number.parseInt(match[2], 10)
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) return null
  return { hour, minute }
}

function formatClockWithMeridiem(hour24: number, minute: number): string {
  const hour12 = hour24 % 12 || 12
  const meridiem = hour24 >= 12 ? 'pm' : 'am'
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${meridiem}`
}

export function formatAvailableSlotLabel(slotTime: string, endTime: string): string {
  const start = parseHms(slotTime)
  const end = parseHms(endTime)
  if (!start || !end) {
    return [slotTime, endTime].map((part) => part.trim()).filter(Boolean).join(' - ')
  }
  return `${formatClockWithMeridiem(start.hour, start.minute)} - ${formatClockWithMeridiem(end.hour, end.minute)}`
}

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

/** Onboard start time only, matching available-slots slot_time, e.g. "06:30:00". */
export function formatOnboardTimeSlot(slot: string): string {
  const startPart = slot.split('-')[0]?.trim() || slot.trim()
  if (!startPart) return ''

  const parsed =
    parseHms(startPart) ||
    (() => {
      const match = startPart.match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?$/i)
      if (!match) return null
      let hour = Number.parseInt(match[1], 10)
      const minute = Number.parseInt(match[2], 10)
      const meridiem = match[3]?.toLowerCase()
      if (meridiem === 'pm' && hour !== 12) hour += 12
      if (meridiem === 'am' && hour === 12) hour = 0
      if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) {
        return null
      }
      return { hour, minute }
    })()

  if (!parsed) return startPart
  return `${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}:00`
}

export function dobFromAge(age: number, from = new Date()): string {
  const d = new Date(from)
  d.setFullYear(d.getFullYear() - age)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export type EngagementConfig = {
  engagementCode: string
  diagnosticPackageId: number | null
  consultations: Record<string, unknown>
}

export async function fetchEngagementConfig(): Promise<EngagementConfig> {
  const engagementCode = resolveEngagementCode()
  const envPackageId = parseId(import.meta.env.VITE_DIAGNOSTIC_PACKAGE_ID)

  if (isFrontendOnly()) {
    return {
      engagementCode,
      diagnosticPackageId: envPackageId,
      consultations: {},
    }
  }

  try {
    const response = await publicGet<unknown>(
      `/engagements/code/${encodeURIComponent(engagementCode)}`,
    )
    const row = unwrapData(response)
    const diagnosticPackageId =
      parseId(row?.diagnostic_package_id) ??
      parseId(row?.diagnostics_package_id) ??
      parseId(row?.package_id) ??
      envPackageId
    const consultations = asRecord(row?.consultations) ?? {}
    return { engagementCode, diagnosticPackageId, consultations }
  } catch (error) {
    console.warn('[booking] engagement GET failed; using env fallback', error)
    return {
      engagementCode,
      diagnosticPackageId: envPackageId,
      consultations: {},
    }
  }
}

export type ServiceAvailabilityResult = {
  serviceable: boolean
  provider: string
  zoneId: string
  message: string
}

type ServiceabilityProvider = {
  provider?: string
  serviceable?: boolean
  message?: string
  zone_id?: string | number
  data?: { zone_id?: string | number }
}

function readProviders(payload: unknown): ServiceabilityProvider[] {
  const root = asRecord(payload)
  const nested = unwrapData(payload)
  const raw = root?.providers ?? nested?.providers
  return Array.isArray(raw) ? (raw as ServiceabilityProvider[]) : []
}

function readZoneId(provider: ServiceabilityProvider): string {
  return firstNonEmpty(
    provider.zone_id === undefined || provider.zone_id === null ? '' : String(provider.zone_id),
    provider.data?.zone_id === undefined || provider.data?.zone_id === null
      ? ''
      : String(provider.data.zone_id),
  )
}

function pickServiceableProvider(providers: ServiceabilityProvider[]): ServiceabilityProvider | null {
  const serviceable = providers.filter((row) => row.serviceable === true)
  if (serviceable.length === 0) return null
  return (
    serviceable.find((row) => String(row.provider || '').toLowerCase() === DEFAULT_DIAGNOSTICS_PROVIDER) ||
    serviceable[0]
  )
}

export async function checkServiceAvailability(payload: {
  address_line: string
  landmark: string
  city: string
  pincode: string
  latitude: number
  longitude: number
  diagnostic_package_id: number
}): Promise<ServiceAvailabilityResult> {
  if (isFrontendOnly()) {
    return {
      serviceable: true,
      provider: DEFAULT_DIAGNOSTICS_PROVIDER,
      zoneId: 'frontend-only-zone',
      message: 'Serviceable',
    }
  }

  const body = {
    provider: DEFAULT_DIAGNOSTICS_PROVIDER,
    address_line: payload.address_line,
    landmark: payload.landmark || '',
    city: payload.city,
    pincode: payload.pincode,
    latitude: payload.latitude,
    longitude: payload.longitude,
    diagnostic_package_id: payload.diagnostic_package_id,
  }

  console.info('[booking] diagnostics serviceability', {
    city: payload.city,
    pincode: payload.pincode,
    packageId: payload.diagnostic_package_id,
  })

  const response = await publicPost<unknown>('/diagnostics/public/serviceability', body)
  const providers = readProviders(response)
  const chosen = pickServiceableProvider(providers)

  if (chosen) {
    return {
      serviceable: true,
      provider: firstNonEmpty(chosen.provider, DEFAULT_DIAGNOSTICS_PROVIDER),
      zoneId: readZoneId(chosen),
      message: firstNonEmpty(chosen.message, 'Serviceable'),
    }
  }

  const fallback = providers[0]
  return {
    serviceable: false,
    provider: firstNonEmpty(fallback?.provider, DEFAULT_DIAGNOSTICS_PROVIDER),
    zoneId: fallback ? readZoneId(fallback) : '',
    message: firstNonEmpty(fallback?.message, 'Location not serviceable.'),
  }
}

export type AvailableSlot = {
  stmId: string
  slotDate: string
  slotTime: string
  endTime: string
  label: string
}

export async function fetchAvailableSlots(payload: {
  provider: string
  slot_date: string
  diagnostic_package_id?: number | null
  zone_id?: string
  latitude: number
  longitude: number
  pincode?: string
  has_female_patient?: boolean
}): Promise<AvailableSlot[]> {
  const provider = firstNonEmpty(payload.provider, DEFAULT_DIAGNOSTICS_PROVIDER)
  const isOrange = provider.toLowerCase() === 'orange_health'

  if (isFrontendOnly()) {
    return [
      {
        stmId: 'frontend-only-1',
        slotDate: payload.slot_date,
        slotTime: '06:00:00',
        endTime: '07:00:00',
        label: formatAvailableSlotLabel('06:00:00', '07:00:00'),
      },
    ]
  }

  const body = isOrange
    ? {
        provider,
        slot_date: payload.slot_date,
        latitude: payload.latitude,
        longitude: payload.longitude,
      }
    : {
        provider,
        slot_date: payload.slot_date,
        diagnostic_package_id: payload.diagnostic_package_id,
        zone_id: payload.zone_id,
        latitude: payload.latitude,
        longitude: payload.longitude,
        pincode: payload.pincode,
        has_female_patient: Boolean(payload.has_female_patient),
      }

  console.info('[booking] diagnostics available-slots', {
    provider,
    date: payload.slot_date,
    zoneId: payload.zone_id,
  })

  const response = await publicPost<unknown>('/diagnostics/public/available-slots', body)
  const row = unwrapData(response) || asRecord(response)
  const rawSlots = Array.isArray(row?.slots) ? row.slots : []

  return rawSlots
    .map((item) => {
      const slot = asRecord(item)
      if (!slot) return null
      const slotTime = String(slot.slot_time || '').trim()
      const endTime = String(slot.end_time || '').trim()
      if (!slotTime) return null
      return {
        stmId: String(slot.stm_id ?? ''),
        slotDate: String(slot.slot_date || payload.slot_date),
        slotTime,
        endTime,
        label: formatAvailableSlotLabel(slotTime, endTime || slotTime),
      } satisfies AvailableSlot
    })
    .filter((slot): slot is AvailableSlot => Boolean(slot))
}

export type OnboardBookingPayload = {
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
  blood_collection_cabin: null
  participants_employee_id: string
  participant_department: string
  participant_blood_group: string
  consultations: Record<string, unknown>
}

export async function confirmOnboardBooking(payload: OnboardBookingPayload): Promise<unknown> {
  const engagementCode = resolveEngagementCode()

  if (isFrontendOnly()) {
    console.info('[frontend-only] skipped onboard', {
      engagementCode,
      phone: payload.phone,
    })
    return null
  }

  const path = `/users/code/${encodeURIComponent(engagementCode)}/onboard`
  console.info('[booking] onboard', {
    engagementCode,
    date: payload.blood_collection_date,
    slotId: payload.blood_collection_time_slot_id,
  })

  return publicPost(path, payload)
}
