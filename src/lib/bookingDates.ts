const pad = (n: number) => String(n).padStart(2, '0')

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseIsoDate(iso: string): Date | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Sole bookable camp date: 18 August 2026. */
export const BOOKING_CAMP_ISO = '2026-08-18'

export function getCampDate(): Date {
  const camp = new Date(2026, 7, 18)
  camp.setHours(0, 0, 0, 0)
  return camp
}

/** Only 18 August 2026 is selectable. */
export function getBookingDateBounds(): { min: Date; max: Date } {
  const camp = getCampDate()
  return { min: camp, max: camp }
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
