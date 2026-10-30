import { useMemo } from 'react'
import {
  getCabinDay,
  getCabinsForDate,
  getAllScheduleDates,
  isScheduleDateEnabled,
  resolveCabinKey,
  type EngagementSchedule,
} from '../api/engagements'
import { parseIsoDate } from '../lib/bookingDates'

type Props = {
  city: string
  schedule: EngagementSchedule | null
  isLoading: boolean
  appointmentDate: string
  appointmentTime: string
  appointmentCabin: string
  onDateChange: (iso: string) => void
  onCabinChange: (cabinName: string, cabinKey: string) => void
  onTimeChange: (slot: string) => void
  showMissingRequired?: boolean
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function PreferredDateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M6.66699 1.66699V5.00033M13.3337 1.66699V5.00033" stroke="#9A9A9A" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.16667 3.33398H15.8333C16.7538 3.33398 17.5 4.08018 17.5 5.00065V16.6673C17.5 17.5878 16.7538 18.334 15.8333 18.334H4.16667C3.24619 18.334 2.5 17.5878 2.5 16.6673V5.00065C2.5 4.08018 3.24619 3.33398 4.16667 3.33398V3.33398" stroke="#9A9A9A" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 8.33398H17.5" stroke="#9A9A9A" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PreferredTimeSlotIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="#9A9A9A" strokeWidth="1.66667" />
      <path d="M10 5.83398V10.0007H13.3333" stroke="#9A9A9A" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PickCabinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3.33301 16.667V8.33366L9.99967 3.33366L16.6663 8.33366V16.667" stroke="#9A9A9A" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.33301 16.667V11.667H11.6663V16.667" stroke="#9A9A9A" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ScheduleStep({
  city,
  schedule,
  isLoading,
  appointmentDate,
  appointmentTime,
  appointmentCabin,
  onDateChange,
  onCabinChange,
  onTimeChange,
  showMissingRequired,
}: Props) {
  const cabins = schedule?.cabins ?? []
  const bookableDates = useMemo(() => {
    return getAllScheduleDates(schedule).flatMap((iso) => {
      const date = parseIsoDate(iso)
      return date ? [{ iso, date, enabled: isScheduleDateEnabled(schedule, iso) }] : []
    })
  }, [schedule])

  const cabinsForDate = getCabinsForDate(schedule, appointmentDate)
  const selectedCabin =
    cabinsForDate.find((cabin) => cabin.name === appointmentCabin) ??
    (cabinsForDate.length === 1 ? cabinsForDate[0] : null)
  const cabinDay =
    schedule && selectedCabin && appointmentDate
      ? getCabinDay(schedule, selectedCabin.name, appointmentDate)
      : null
  const timeSlots = cabinDay?.slots ?? []
  const timeHint =
    timeSlots.length > 0
      ? `${timeSlots[0].display} – ${timeSlots[timeSlots.length - 1].display}`
      : ''

  const selectedSlotClass =
    'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] border-transparent'
  const idleSlotClass = 'border-white/[0.08] bg-white/5'
  const selectedDateClass =
    'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)]'
  const idleDateClass = 'bg-white/5'
  const sectionLabelClass = 'font-sans text-[14px] font-medium leading-normal text-[#9A9A9A]'

  const assignCabin = (cabinName: string, date: string) => {
    onCabinChange(cabinName, resolveCabinKey(schedule, cabinName, date))
  }

  const pickDate = (iso: string) => {
    onDateChange(iso)
    const nextCabins = getCabinsForDate(schedule, iso)
    if (nextCabins.length === 1) assignCabin(nextCabins[0].name, iso)
  }

  const pickCabin = (cabinName: string) => {
    assignCabin(cabinName, appointmentDate)
    onTimeChange('')
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <PreferredDateIcon />
          <h2 className={sectionLabelClass}>
            Preferred Date
            {showMissingRequired && !appointmentDate ? (
              <span className="text-[#ff6b6b]"> * Field is required</span>
            ) : null}
          </h2>
        </div>
        {isLoading ? (
          <p className="text-[12px] font-light text-[#9a9a9a]">Loading dates...</p>
        ) : bookableDates.length === 0 ? (
          <p className="text-[12px] font-light text-[#9a9a9a]">
            {city
              ? 'No dates are available yet.'
              : 'Select a city on the previous page to see available dates.'}
          </p>
        ) : (
          <div className="grid w-full grid-cols-4 gap-2">
            {bookableDates.map(({ iso, date, enabled }) => {
              const selected = enabled && appointmentDate === iso
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!enabled}
                  onClick={() => {
                    if (!enabled) return
                    pickDate(iso)
                  }}
                  aria-pressed={selected}
                  aria-disabled={!enabled}
                  className={[
                    'flex h-20 w-full min-w-0 origin-center flex-col items-center justify-center gap-1 rounded-[8px] transition duration-200',
                    enabled
                      ? 'hover:z-[1] hover:scale-[1.03]'
                      : 'pointer-events-none cursor-not-allowed opacity-40',
                    selected ? selectedDateClass : idleDateClass,
                  ].join(' ')}
                >
                  <span
                    className={
                      selected
                        ? 'text-[13px] font-medium leading-4 text-white'
                        : 'text-[13px] font-medium leading-4 text-[#9a9a9a]'
                    }
                  >
                    {DAY_LABELS[date.getDay()]}
                  </span>
                  <span
                    className={
                      selected
                        ? 'text-[22px] font-semibold leading-6 text-white'
                        : 'text-[22px] font-semibold leading-6 text-[#cccccc]'
                    }
                  >
                    {date.getDate()}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <PickCabinIcon />
          <h2 className={sectionLabelClass}>
            Pick Cabin
            {showMissingRequired && !appointmentCabin ? (
              <span className="text-[#ff6b6b]"> * Field is required</span>
            ) : null}
          </h2>
        </div>
        {isLoading ? (
          <p className="text-[12px] font-light text-[#9a9a9a]">Loading cabins...</p>
        ) : cabins.length === 0 ? (
          <p className="text-[12px] font-light text-[#9a9a9a]">
            No cabins are available for this city yet.
          </p>
        ) : !appointmentDate ? (
          <p className="text-[12px] font-light text-[#9a9a9a]">Select a date to see available cabins.</p>
        ) : cabinsForDate.length === 0 ? (
          <p className="text-[12px] font-light text-[#9a9a9a]">No cabins are available on this date.</p>
        ) : (
          <div
            className="grid w-full gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.max(cabinsForDate.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {cabinsForDate.map((cabin) => {
              const selected = (selectedCabin?.name || appointmentCabin) === cabin.name
              return (
                <button
                  key={cabin.name}
                  type="button"
                  onClick={() => pickCabin(cabin.name)}
                  aria-pressed={selected}
                  className={[
                    'flex h-12 min-w-0 origin-center items-center justify-center rounded-[8px] px-3 text-[14px] font-medium transition duration-200 hover:z-[1] hover:scale-[1.03]',
                    selected ? selectedDateClass : idleDateClass,
                    selected ? 'text-white' : 'text-[#9a9a9a]',
                  ].join(' ')}
                >
                  <span className="truncate">{cabin.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start gap-2">
          <PreferredTimeSlotIcon />
          <div className="flex flex-col gap-0.5">
            <h2 className={sectionLabelClass}>
              Preferred Time Slot
              {showMissingRequired && !appointmentTime ? (
                <span className="text-[#ff6b6b]"> * Field is required</span>
              ) : null}
            </h2>
            {timeHint ? <p className="text-[10px] font-light text-[#ccc]">{timeHint}</p> : null}
          </div>
        </div>
        {!appointmentDate ? (
          <p className="text-[12px] font-light text-[#9a9a9a]">Select a date to see time slots.</p>
        ) : !selectedCabin ? (
          <p className="text-[12px] font-light text-[#9a9a9a]">Select a cabin to see time slots.</p>
        ) : (
          <div className="grid w-full grid-cols-3 gap-x-2 gap-y-3 px-1 sm:grid-cols-5 lg:grid-cols-10">
            {timeSlots.map((slot) => {
              const selected = appointmentTime === slot.display
              const remaining = slot.spotLeft
              const isFull = remaining <= 0
              return (
                <div key={slot.hhmm} className="flex min-w-0 flex-col items-center gap-1">
                  <button
                    type="button"
                    disabled={isFull}
                    onClick={() => {
                      if (!selectedCabin) return
                      assignCabin(selectedCabin.name, appointmentDate)
                      onTimeChange(slot.display)
                    }}
                    aria-pressed={selected}
                    className={[
                      'flex h-10 w-full items-center justify-center rounded-full border text-[12px] font-medium transition duration-200 hover:z-[1] hover:scale-[1.03]',
                      selected ? selectedSlotClass : idleSlotClass,
                      isFull ? 'cursor-not-allowed opacity-40 hover:scale-100' : '',
                    ].join(' ')}
                  >
                    <span className={selected ? 'text-white' : 'text-[#9a9a9a]/80'}>{slot.display}</span>
                  </button>
                  <span className="text-[9px] font-light leading-none text-[#41ab99]">
                    {isFull ? 'Full' : `${remaining} slot${remaining === 1 ? '' : 's'} left`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
