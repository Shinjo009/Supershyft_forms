import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  buildCalendarCells,
  formatMonthYear,
  getBookingDateBounds,
  isAfterCalendarMonth,
  isDateInBookingRange,
  monthWithinBounds,
  parseIsoDate,
  toIsoDate,
} from '../lib/bookingDates'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

type Props = {
  open: boolean
  value: string
  onClose: () => void
  onConfirm: (iso: string) => void
}

export function PreferredDateCalendar({ open, value, onClose, onConfirm }: Props) {
  const bounds = useMemo(() => getBookingDateBounds(), [open])
  const initialMonth = useMemo(() => {
    const fromValue = parseIsoDate(value)
    if (fromValue && isDateInBookingRange(fromValue, bounds.min, bounds.max)) {
      return { year: fromValue.getFullYear(), month: fromValue.getMonth() }
    }
    return { year: bounds.min.getFullYear(), month: bounds.min.getMonth() }
  }, [value, bounds.min, bounds.max])

  const [visibleYear, setVisibleYear] = useState(initialMonth.year)
  const [visibleMonth, setVisibleMonth] = useState(initialMonth.month)
  const [draftIso, setDraftIso] = useState(value)

  useEffect(() => {
    if (!open) return
    setDraftIso(value)
    setVisibleYear(initialMonth.year)
    setVisibleMonth(initialMonth.month)
  }, [open, value, initialMonth.year, initialMonth.month])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const cells = useMemo(
    () => buildCalendarCells(visibleYear, visibleMonth),
    [visibleYear, visibleMonth],
  )

  const canGoPrev = monthWithinBounds(
    visibleMonth === 0 ? visibleYear - 1 : visibleYear,
    visibleMonth === 0 ? 11 : visibleMonth - 1,
    bounds.min,
    bounds.max,
  )
  const canGoNext = monthWithinBounds(
    visibleMonth === 11 ? visibleYear + 1 : visibleYear,
    visibleMonth === 11 ? 0 : visibleMonth + 1,
    bounds.min,
    bounds.max,
  )

  if (!open) return null

  const cellHeightClass = 'h-[44px]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-[10px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end px-5 pb-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calendar"
            className="flex size-9 items-center justify-center rounded text-white transition hover:bg-white/10"
          >
            <X className="size-6" strokeWidth={2} />
          </button>
        </div>

        <div
          className="w-full rounded-t-[24px] border border-b-0 border-[#999] bg-black px-5 pb-6 pt-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose preferred date"
        >
        <div className="mx-auto mb-3 h-[2px] w-[50px] rounded-full bg-[#999]" aria-hidden />

        <div className="mb-3 flex h-7 items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoPrev}
            onClick={() => {
              if (!canGoPrev) return
              if (visibleMonth === 0) {
                setVisibleYear((y) => y - 1)
                setVisibleMonth(11)
              } else {
                setVisibleMonth((m) => m - 1)
              }
            }}
            className="flex size-7 items-center justify-center rounded text-white transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="size-5" strokeWidth={2} />
          </button>
          <p className="text-base font-bold leading-6 text-white">
            {formatMonthYear(visibleYear, visibleMonth)}
          </p>
          <button
            type="button"
            aria-label="Next month"
            disabled={!canGoNext}
            onClick={() => {
              if (!canGoNext) return
              if (visibleMonth === 11) {
                setVisibleYear((y) => y + 1)
                setVisibleMonth(0)
              } else {
                setVisibleMonth((m) => m + 1)
              }
            }}
            className="flex size-7 items-center justify-center rounded text-white transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="mb-1.5 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <span
              key={label}
              className="text-center text-xs leading-4 text-[#999]"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mb-3 grid grid-cols-7 gap-0.5">
          {cells.map((date) => {
            if (isAfterCalendarMonth(date, visibleYear, visibleMonth)) {
              return (
                <div
                  key={`empty-${toIsoDate(date)}`}
                  className={cellHeightClass}
                  aria-hidden
                />
              )
            }

            const iso = toIsoDate(date)
            const inMonth = date.getMonth() === visibleMonth
            const selectable = inMonth && isDateInBookingRange(date, bounds.min, bounds.max)
            const selected = draftIso === iso
            const isToday =
              date.toDateString() === new Date().toDateString()

            return (
              <button
                key={iso + (inMonth ? '' : '-pad')}
                type="button"
                disabled={!selectable}
                onClick={() => selectable && setDraftIso(iso)}
                aria-label={
                  selectable
                    ? `${date.toDateString()}${selected ? ', selected' : ''}`
                    : undefined
                }
                aria-pressed={selectable ? selected : undefined}
                className={[
                  `flex ${cellHeightClass} items-center justify-center rounded-full text-sm transition`,
                  !inMonth && 'text-[#444]',
                  inMonth && !selectable && 'cursor-not-allowed text-[#444]',
                  inMonth && selectable && !selected && 'text-white hover:bg-white/10',
                  selected &&
                    'border border-[#999] bg-[#063533] font-normal text-white',
                  isToday && selectable && !selected && 'ring-1 ring-white/20',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={!draftIso}
          onClick={() => {
            if (!draftIso) return
            onConfirm(draftIso)
            onClose()
          }}
          className="flex h-[52px] w-full items-center justify-center rounded-[36px] border border-[#969696] bg-gradient-to-r from-[#296359] to-[#41ab99] text-base font-bold text-white shadow-[0_12px_10px_rgba(255,255,255,0.15)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm date
        </button>
        </div>
      </div>
    </div>
  )
}
