const pad = (n: number) => String(n).padStart(2, '0')

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseIsoDate(iso: string): Date | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** First selectable day: today + 2. Last selectable day: June 30 (current or next year). */
export function getBookingDateBounds(now = new Date()): { min: Date; max: Date } {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const min = new Date(today)
  min.setDate(min.getDate() + 2)

  let max = new Date(today.getFullYear(), 5, 30)
  if (max < min) {
    max = new Date(today.getFullYear() + 1, 5, 30)
  }

  return { min, max }
}

export function isDateInBookingRange(date: Date, min: Date, max: Date): boolean {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const lo = new Date(min)
  lo.setHours(0, 0, 0, 0)
  const hi = new Date(max)
  hi.setHours(0, 0, 0, 0)
  return d >= lo && d <= hi
}

export function clampBookingDate(iso: string, bounds = getBookingDateBounds()): string {
  const parsed = parseIsoDate(iso)
  if (!parsed) return ''
  if (isDateInBookingRange(parsed, bounds.min, bounds.max)) return iso
  return ''
}

export const BOOKING_CITIES = ['Pune', 'Bangalore', 'Gurugram', 'Hyderabad'] as const
export type BookingCity = (typeof BOOKING_CITIES)[number]

export const CITY_LOCATION: Record<BookingCity, { state: string; pincode: string }> = {
  Pune: { state: 'Maharashtra', pincode: '411001' },
  Bangalore: { state: 'Karnataka', pincode: '560001' },
  Gurugram: { state: 'Haryana', pincode: '122001' },
  Hyderabad: { state: 'Telangana', pincode: '500001' },
}

/** Month is 0-indexed. Pune 1–3 Sep, Bangalore 31 Aug–3 Sep, Gurugram 1 Sep, Hyderabad 2–3 Sep. */
const CITY_SCHEDULE_MONTH_DAYS: Record<BookingCity, Array<[month: number, day: number]>> = {
  Pune: [[8, 1], [8, 2], [8, 3]],
  Bangalore: [[7, 31], [8, 1], [8, 2], [8, 3]],
  Gurugram: [[8, 1]],
  Hyderabad: [[8, 2], [8, 3]],
}

export function isBookingCity(city: string): city is BookingCity {
  return (BOOKING_CITIES as readonly string[]).includes(city)
}

/** Use this year's campaign if 3 Sep has not passed; otherwise next year. */
export function getCityScheduleYear(now = new Date()): number {
  const campaignEnd = new Date(now.getFullYear(), 8, 3, 23, 59, 59, 999)
  return now.getTime() > campaignEnd.getTime() ? now.getFullYear() + 1 : now.getFullYear()
}

export function getCityBookableDates(city: string, now = new Date()): Date[] {
  if (!isBookingCity(city)) return []
  const year = getCityScheduleYear(now)
  return CITY_SCHEDULE_MONTH_DAYS[city].map(([month, day]) => {
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)
    return date
  })
}

export function clampCityBookingDate(iso: string, city: string): string {
  if (!iso || !isBookingCity(city)) return ''
  return getCityBookableDates(city).some((date) => toIsoDate(date) === iso) ? iso : ''
}

/** 9:00 AM through 1:50 PM in 10-minute steps. */
export function buildTenMinuteTimeSlots(): string[] {
  const slots: string[] = []
  const startMinutes = 9 * 60
  const endMinutes = 13 * 60 + 50
  for (let total = startMinutes; total <= endMinutes; total += 10) {
    const hour24 = Math.floor(total / 60)
    const minute = total % 60
    const meridiem = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = hour24 % 12 || 12
    slots.push(`${hour12}:${pad(minute)} ${meridiem}`)
  }
  return slots
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`
}

export function formatPreferredDateLabel(iso: string): string {
  const d = parseIsoDate(iso)
  if (!d) return 'Select date'
  return `${DAY_LABELS[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

/** Monday-first weekday index (0 = Mon … 6 = Sun). */
export function mondayFirstWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function isAfterCalendarMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() > year || (date.getFullYear() === year && date.getMonth() > month)
}

export function buildCalendarCells(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const startOffset = mondayFirstWeekdayIndex(first)
  const gridStart = new Date(year, month, 1 - startOffset)
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })

  let lastIndex = -1
  for (let i = cells.length - 1; i >= 0; i--) {
    if (!isAfterCalendarMonth(cells[i], year, month)) {
      lastIndex = i
      break
    }
  }
  if (lastIndex < 0) return cells

  const lastRowEnd = Math.floor(lastIndex / 7) * 7 + 6
  return cells.slice(0, lastRowEnd + 1)
}

export function monthWithinBounds(year: number, month: number, min: Date, max: Date): boolean {
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  return monthEnd >= min && monthStart <= max
}

/** All selectable booking dates from min through max (inclusive). */
export function getBookableDates(bounds = getBookingDateBounds()): Date[] {
  const dates: Date[] = []
  const cursor = new Date(bounds.min)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(bounds.max)
  end.setHours(0, 0, 0, 0)
  while (cursor <= end) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function formatShortBookingDate(iso: string): string {
  const d = parseIsoDate(iso)
  if (!d) return '—'
  return `${DAY_LABELS[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}
