const pad = (n: number) => String(n).padStart(2, '0')

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseIsoDate(iso: string): Date | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function startOfDay(date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** First selectable date: day after tomorrow (today + 2). */
export function getEarliestBookableDate(from = new Date()): Date {
  const d = startOfDay(from)
  d.setDate(d.getDate() + 2)
  return d
}

/** Default selected appointment ISO (earliest bookable day). */
export function getDefaultAppointmentIso(from = new Date()): string {
  return toIsoDate(getEarliestBookableDate(from))
}

/** @deprecated Prefer getDefaultAppointmentIso() — kept for older imports. */
export const BOOKING_CAMP_ISO = getDefaultAppointmentIso()

/** Selectable window: earliest bookable day through 6 months ahead. */
export function getBookingDateBounds(from = new Date()): { min: Date; max: Date } {
  const min = getEarliestBookableDate(from)
  const max = new Date(min)
  max.setMonth(max.getMonth() + 6)
  return { min, max }
}

export function isDateInBookingRange(date: Date, min: Date, max: Date): boolean {
  const d = startOfDay(date)
  const lo = startOfDay(min)
  const hi = startOfDay(max)
  return d >= lo && d <= hi
}

export function clampBookingDate(iso: string, bounds = getBookingDateBounds()): string {
  const parsed = parseIsoDate(iso)
  if (!parsed) return ''
  if (isDateInBookingRange(parsed, bounds.min, bounds.max)) return iso
  return toIsoDate(bounds.min)
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
