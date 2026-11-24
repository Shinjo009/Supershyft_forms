import { isFrontendOnly } from '../lib/frontendOnly'
import { buildTenMinuteTimeSlots, getCityBookableDates, toIsoDate } from '../lib/bookingDates'
import { publicGet } from './http'

export type EngagementSlot = {
  hhmm: string
  display: string
  spotLeft: number
}

export type EngagementCabin = {
  name: string
}

export type CabinDay = {
  name: string
  key: string
  slots: EngagementSlot[]
  /** Minutes per slot from API `slot_duration`. Used to show start–end ranges. */
  slotDuration: number
}

export type EngagementSchedule = {
  engagementCode: string
  cabins: EngagementCabin[]
  datesByCabin: Record<string, string[]>
  days: Record<string, CabinDay>
  dateEnabled: Record<string, boolean>
  source: 'api' | 'fallback'
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function unwrapData(value: unknown): Record<string, unknown> {
  const root = asRecord(value)
  if (!root) return {}
  return asRecord(root.data) ?? root
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function readEnabledFlag(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const token = value.trim().toLowerCase()
    if (token === 'false' || token === '0' || token === 'no') return false
    if (token === 'true' || token === '1' || token === 'yes') return true
  }
  return fallback
}

function normalizeHHmm(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return ''
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function minutesFromHHmm(value: string): number | null {
  const hhmm = normalizeHHmm(value)
  if (!hhmm) return null
  const [hour, minute] = hhmm.split(':').map(Number)
  return hour * 60 + minute
}

export function toDisplayTimeSlot(value: string): string {
  const minutes = minutesFromHHmm(value)
  if (minutes === null) return value
  const hour24 = Math.floor(minutes / 60) % 24
  const minute = minutes % 60
  const meridiem = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${meridiem}`
}

/** Start time + duration minutes → "7:00 AM – 9:00 AM". */
export function toDisplayTimeSlotRange(startHHmm: string, durationMinutes: number): string {
  const startLabel = toDisplayTimeSlot(startHHmm)
  if (!(durationMinutes > 0)) return startLabel
  const startMinutes = minutesFromHHmm(startHHmm)
  if (startMinutes === null) return startLabel
  const endTotal = startMinutes + durationMinutes
  const endHHmm = `${String(Math.floor(endTotal / 60) % 24).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`
  return `${startLabel} – ${toDisplayTimeSlot(endHHmm)}`
}

/** Preferred-time hint: first start through last start + duration. */
export function formatPreferredTimeHint(
  slots: EngagementSlot[],
  slotDuration: number,
): string {
  if (slots.length === 0) return ''
  if (slotDuration > 0) {
    const firstStart = minutesFromHHmm(slots[0].hhmm)
    const lastStart = minutesFromHHmm(slots[slots.length - 1].hhmm)
    if (firstStart === null || lastStart === null) return slots[0].display
    const overallMinutes = lastStart - firstStart + slotDuration
    return toDisplayTimeSlotRange(slots[0].hhmm, Math.max(slotDuration, overallMinutes))
  }
  if (slots.length === 1) return slots[0].display
  return `${slots[0].display} – ${slots[slots.length - 1].display}`
}

export function displaySlotToHHmm(slot: string): string {
  // Ranges are stored as "7:00 AM – 9:00 AM"; API still needs the start time.
  const startPart = slot.split(/\s*[–-]\s*/)[0]?.trim() || slot.trim()
  const match = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (match) {
    let hour = Number.parseInt(match[1], 10)
    const minute = match[2]
    const meridiem = match[3].toUpperCase()
    if (meridiem === 'PM' && hour !== 12) hour += 12
    if (meridiem === 'AM' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${minute}`
  }
  return normalizeHHmm(startPart)
}

function dayLookupKey(cabinName: string, date: string): string {
  return `${cabinName}::${date}`
}

export function getCabinDay(
  schedule: EngagementSchedule,
  cabinName: string,
  date: string,
): CabinDay | null {
  return schedule.days[dayLookupKey(cabinName, date)] ?? null
}

export function getAllScheduleDates(schedule: EngagementSchedule | null): string[] {
  if (!schedule) return []
  const dates = new Set<string>(Object.keys(schedule.dateEnabled))
  for (const cabinDates of Object.values(schedule.datesByCabin)) {
    for (const iso of cabinDates) dates.add(iso)
  }
  return [...dates].sort()
}

export function isScheduleDateEnabled(
  schedule: EngagementSchedule | null,
  date: string,
): boolean {
  if (!schedule || !date) return false
  if (Object.prototype.hasOwnProperty.call(schedule.dateEnabled, date)) {
    return schedule.dateEnabled[date] !== false
  }
  return Object.values(schedule.datesByCabin).some((cabinDates) => cabinDates.includes(date))
}

export function getAllBookableDates(schedule: EngagementSchedule | null): string[] {
  return getAllScheduleDates(schedule).filter((iso) => isScheduleDateEnabled(schedule, iso))
}

export function getCabinsForDate(
  schedule: EngagementSchedule | null,
  date: string,
): EngagementCabin[] {
  if (!schedule || !date) return []
  return schedule.cabins.filter((cabin) => (schedule.datesByCabin[cabin.name] ?? []).includes(date))
}

export function getSlotDisplays(day: CabinDay | null): string[] {
  return day?.slots.map((slot) => slot.display) ?? []
}

export function getSpotLeft(day: CabinDay | null, displaySlot: string): number {
  return day?.slots.find((slot) => slot.display === displaySlot)?.spotLeft ?? 0
}

export function resolveCabinKey(
  schedule: EngagementSchedule | null,
  cabinName: string,
  date: string,
): string {
  if (!schedule) return cabinName
  return getCabinDay(schedule, cabinName, date)?.key || cabinName
}

function slotDisplayLabel(hhmm: string, durationMinutes: number): string {
  return durationMinutes > 0
    ? toDisplayTimeSlotRange(hhmm, durationMinutes)
    : toDisplayTimeSlot(hhmm)
}

function parseAvailableSlots(value: unknown, durationMinutes: number): EngagementSlot[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const row = asRecord(item)
    if (!row) return []
    const hhmm = normalizeHHmm(readString(row.slot) || readString(row.time))
    if (!hhmm) return []
    return [
      {
        hhmm,
        display: slotDisplayLabel(hhmm, durationMinutes),
        spotLeft: Math.max(0, readNumber(row.spot_left ?? row.spots_left ?? row.capacity, 0)),
      },
    ]
  })
}

function generateSlots(startTime: string, endTime: string, duration: number, spotLeft: number): EngagementSlot[] {
  const start = minutesFromHHmm(startTime)
  const end = minutesFromHHmm(endTime)
  if (start === null || end === null) return []
  const step = duration > 0 ? duration : 10
  const slots: EngagementSlot[] = []
  for (let total = start; total <= end; total += step) {
    const hhmm = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    slots.push({ hhmm, display: slotDisplayLabel(hhmm, duration), spotLeft })
  }
  return slots
}

function parseCabinDay(value: unknown, index: number): CabinDay | null {
  const row = asRecord(value)
  if (!row) return null
  if (row.is_active === false) return null

  const name = readString(row.cabin_name) || readString(row.name) || `Cabin ${index + 1}`
  const key = readString(row.cabin_key) || readString(row.key) || name
  const duration = Math.max(0, readNumber(row.slot_duration, 0))
  let slots = parseAvailableSlots(row.available_slots, duration)
  let slotDuration = duration
  if (slots.length === 0) {
    const start = normalizeHHmm(readString(row.start_time)) || '09:00'
    const end = normalizeHHmm(readString(row.end_time)) || '13:50'
    slotDuration = duration > 0 ? duration : 10
    const capacity = readNumber(row.capacity_per_slot, 6)
    slots = generateSlots(start, end, slotDuration, capacity)
  }
  if (!name) return null
  return { name, key, slots, slotDuration }
}

function emptySchedule(engagementCode: string): EngagementSchedule {
  return {
    engagementCode,
    cabins: [],
    datesByCabin: {},
    days: {},
    dateEnabled: {},
    source: 'api',
  }
}

function recordScheduleDate(schedule: EngagementSchedule, date: string, enabled: boolean): void {
  schedule.dateEnabled[date] = enabled
}

function addCabinDay(schedule: EngagementSchedule, date: string, cabin: CabinDay): void {
  if (!schedule.cabins.some((item) => item.name === cabin.name)) {
    schedule.cabins.push({ name: cabin.name })
  }
  const dates = schedule.datesByCabin[cabin.name] ?? []
  if (!dates.includes(date)) dates.push(date)
  schedule.datesByCabin[cabin.name] = dates
  schedule.days[dayLookupKey(cabin.name, date)] = cabin
}

function sortScheduleDates(schedule: EngagementSchedule): void {
  for (const name of Object.keys(schedule.datesByCabin)) {
    schedule.datesByCabin[name] = [...schedule.datesByCabin[name]].sort()
  }
}

function parseEngagementSchedule(payload: unknown, engagementCode: string): EngagementSchedule {
  const engagement = unwrapData(payload)
  const schedule = emptySchedule(readString(engagement.engagement_code) || engagementCode)
  const slotDetail = asRecord(engagement.slot_detail)
  const bloodCollection = slotDetail
    ? (slotDetail.blood_collection ?? slotDetail.bloodCollection ?? null)
    : null
  const bloodMap = asRecord(bloodCollection)
  if (!bloodMap) return schedule

  for (const [date, value] of Object.entries(bloodMap).sort(([a], [b]) => a.localeCompare(b))) {
    if (!DATE_KEY.test(date)) continue

    if (Array.isArray(value)) {
      recordScheduleDate(schedule, date, true)
      value.forEach((item, index) => {
        const cabin = parseCabinDay(item, index)
        if (cabin) addCabinDay(schedule, date, cabin)
      })
      continue
    }

    const day = asRecord(value)
    if (!day) continue

    const enabled = readEnabledFlag(day.is_enable ?? day.is_enabled, true)
    recordScheduleDate(schedule, date, enabled)

    const cabins = Array.isArray(day.cabins) ? day.cabins : []
    cabins.forEach((item, index) => {
      const cabin = parseCabinDay(item, index)
      if (cabin) addCabinDay(schedule, date, cabin)
    })
  }

  sortScheduleDates(schedule)
  return schedule
}

function buildFallbackSchedule(city: string, engagementCode: string): EngagementSchedule {
  const schedule = emptySchedule(engagementCode)
  schedule.source = 'fallback'
  const slots = buildTenMinuteTimeSlots().map((display) => ({
    display,
    hhmm: displaySlotToHHmm(display),
    spotLeft: 6,
  }))
  const cabin: CabinDay = { name: 'Cabin 1', key: 'cabin-1', slots, slotDuration: 10 }
  for (const date of getCityBookableDates(city).map(toIsoDate)) {
    recordScheduleDate(schedule, date, true)
    addCabinDay(schedule, date, cabin)
  }
  sortScheduleDates(schedule)
  return schedule
}

export async function loadEngagementSchedule(
  engagementCode: string,
  city: string,
): Promise<EngagementSchedule> {
  if (isFrontendOnly()) return buildFallbackSchedule(city, engagementCode)

  const engagement = await publicGet(`/engagements/code/${encodeURIComponent(engagementCode)}`)
  const parsed = parseEngagementSchedule(engagement, engagementCode)
  if (parsed.cabins.length > 0 || getAllScheduleDates(parsed).length > 0) return parsed
  return buildFallbackSchedule(city, engagementCode)
}
