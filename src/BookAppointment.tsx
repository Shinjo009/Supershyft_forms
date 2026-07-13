import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  House,
  Mail,
  Map,
  MapPin,
  MapPinned,
  Mars,
  Phone,
  Signpost,
  User,
  Venus,
  X,
} from 'lucide-react'
import { ContinueButton } from './components/ContinueButton'
import {
  clampBookingDate,
  formatShortBookingDate,
  getBookableDates,
  toIsoDate,
} from './lib/bookingDates'
import { loadPincodeLookup, lookupPincode } from './lib/pincodeLookup'
/** Set true when re-enabling validation before API goes live. */
const ENFORCE_REQUIRED_FIELDS = false
import { PageBackdrop } from './components/PageBackdrop'
import { Stepper } from './components'
import { defaultFormData, type FormData } from './types'
import backgroundAssessmentSvg from './assets/Background.svg'
import lastPageBackgroundSvg from './assets/lastpage BG.svg'
import nutritionEndBackgroundSvg from './assets/nutritionend.svg'
import nutritionLogBackgroundSvg from './assets/nutritionlogstart.svg'
import familyHistoryBackgroundSvg from './assets/family history.svg'
import lifestyleHabitsBackgroundSvg from './assets/lifestyle-habits/background.svg'
import { FamilyHistoryMcqStep } from './components/FamilyHistoryMcqStep'
import { FamilySectionCompleteStep } from './components/FamilySectionCompleteStep'
import { HealthAssessmentStep } from './components/HealthAssessmentStep'
import { LifestyleHabitsMcqStep } from './components/LifestyleHabitsMcqStep'
import { LifestyleSectionCompleteStep } from './components/LifestyleSectionCompleteStep'
import { NutritionLogMcqStep } from './components/NutritionLogMcqStep'
import { AppointmentJourneyCompleteStep } from './components/AppointmentJourneyCompleteStep'
import { NutritionSectionCompleteStep } from './components/NutritionSectionCompleteStep'
import slotConfirmedIcon from './assets/figma/slot-confirmed-icon.svg'
import packageIcon from './assets/figma/package-icon.svg'

const RELATION_OPTIONS = [
  'Parent',
  'Sibling',
  'Spouse',
  'Child',
  'Grandparent',
  'Other',
] as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_REGEX = /^[A-Za-z\s]+$/
const sanitizeName = (value: string) => value.replace(/[^A-Za-z\s]/g, '')
const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 10)
const sanitizeAge = (value: string) => value.replace(/\D/g, '').slice(0, 2)
const sanitizePincode = (value: string) => value.replace(/\D/g, '').slice(0, 6)
const EMPLOYEE_ID_PREFIX = 'HRM'
const sanitizeEmployeeIdSuffix = (value: string) => value.replace(/\D/g, '').slice(0, 4)
const normalizeEmployeeId = (value: string) => {
  const trimmed = value.trim().toUpperCase()
  if (!trimmed) return ''
  if (trimmed.startsWith(EMPLOYEE_ID_PREFIX)) return trimmed
  if (/^\d+$/.test(trimmed)) return `${EMPLOYEE_ID_PREFIX}${trimmed}`
  return trimmed
}
const getEmployeeIdSuffix = (fullId: string) => {
  const normalized = normalizeEmployeeId(fullId)
  if (!normalized.startsWith(EMPLOYEE_ID_PREFIX)) return ''
  return normalized.slice(EMPLOYEE_ID_PREFIX.length)
}
const buildEmployeeIdFromSuffix = (suffix: string) => {
  const clean = sanitizeEmployeeIdSuffix(suffix)
  return clean ? `${EMPLOYEE_ID_PREFIX}${clean}` : ''
}
const BOOK_APPOINTMENT_ERROR_EVENT = 'book-appointment:error'
const logClientError = (message: string) => {
  console.error(`[BookAppointment] ${message}`)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BOOK_APPOINTMENT_ERROR_EVENT, { detail: message }))
  }
}
/** QA only: unlimited bookings (no localStorage cap); API uses unique employee/email/phone per submit. */
const TEST_EMPLOYEE_ID = 'HRM000'
/** Celebal-only; do not share key with CBTW or other company forms on the same domain. */
const BOOKED_EMPLOYEE_IDS_STORAGE_KEY = 'celebalBookedEmployeeIds'
/** 130 Celebal employee IDs plus {@link TEST_EMPLOYEE_ID}. */
const ALLOWED_EMPLOYEE_IDS = new Set([
  TEST_EMPLOYEE_ID,
  'HRM4196', 'HRM4039', 'HRM4032', 'HRM3803', 'HRM3666', 'HRM3598',
  'HRM3444', 'HRM2864', 'HRM2839', 'HRM2820', 'HRM2665', 'HRM2532',
  'HRM2195', 'HRM2108', 'HRM2104', 'HRM2100', 'HRM2068', 'HRM2022',
  'HRM1725', 'HRM1638', 'HRM1628', 'HRM1623', 'HRM1611', 'HRM1572',
  'HRM1493', 'HRM1479', 'HRM1336', 'HRM1259', 'HRM1235', 'HRM1068',
  'HRM1045', 'HRM760', 'HRM666', 'HRM431', 'HRM345', 'HRM254',
  'HRM154', 'HRM150', 'HRM3', 'HRM122', 'HRM41', 'HRM2089',
  'HRM2039', 'HRM146', 'HRM3806', 'HRM3643', 'HRM3599', 'HRM3443',
  'HRM3442', 'HRM2932', 'HRM2528', 'HRM2310', 'HRM2093', 'HRM1681',
  'HRM1141', 'HRM989', 'HRM965', 'HRM851', 'HRM405', 'HRM4106',
  'HRM1039', 'HRM4244', 'HRM4246', 'HRM4304', 'HRM255', 'HRM4332',
  'HRM4461', 'HRM4467', 'HRM4580', 'HRM4605', 'HRM4648', 'HRM4652',
  'HRM4650', 'HRM4672', 'HRM4697', 'HRM4707', 'HRM4710', 'HRM4906',
  'HRM4800', 'HRM4815', 'HRM4844', 'HRM4951', 'HRM4982', 'HRM4994',
  'HRM4989', 'HRM5011', 'HRM5021', 'HRM5081', 'HRM5090', 'HRM5192',
  'HRM5180', 'HRM5191', 'HRM5201', 'HRM5202', 'HRM5203', 'HRM5205',
  'HRM5297', 'HRM5412', 'HRM5498', 'HRM5608', 'HRM5667', 'HRM5732',
  'HRM5786', 'HRM5766', 'HRM5781', 'HRM5782', 'HRM5789', 'HRM5834',
  'HRM5821', 'HRM5844', 'HRM5846', 'HRM5872', 'HRM5932', 'HRM5937',
  'HRM5952', 'HRM5955', 'HRM5977', 'HRM6086', 'HRM6158', 'HRM6164',
  'HRM6441', 'HRM6539', 'HRM6597', 'HRM6596', 'HRM6643', 'HRM6649',
  'HRM3392', 'HRM4103', 'HRM4687', 'HRM5338',
])

function getBookedEmployeeIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(BOOKED_EMPLOYEE_IDS_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.map((id) => normalizeEmployeeId(String(id))))
  } catch {
    return new Set()
  }
}

function formatAddressForApi(form: FormData): string {
  return [form.houseNumber, form.street, form.landmark]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')
}

const SCHEDULE_TIME_SLOTS = [
  '06:00 AM',
  '06:30 AM',
  '07:00 AM',
  '07:30 AM',
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
] as const

function formatTimeSlotRange(slot: string): string {
  const normalized = slot.trim()
  if (!normalized) return '—'
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return normalized
  let hour = Number.parseInt(match[1], 10)
  const minute = Number.parseInt(match[2], 10)
  const meridiem = match[3].toUpperCase()
  if (meridiem === 'PM' && hour !== 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0
  const end = new Date(2000, 0, 1, hour, minute)
  end.setMinutes(end.getMinutes() + 60)
  const endHour24 = end.getHours()
  const endMinute = end.getMinutes()
  const endMeridiem = endHour24 >= 12 ? 'PM' : 'AM'
  const endHour12 = endHour24 % 12 || 12
  const startLabel = normalized.replace(/\s*(AM|PM)$/i, '')
  const endLabel = `${String(endHour12).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
  return `${startLabel} - ${endLabel} ${endMeridiem}`
}

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>

const EmployeeIdIcon: IconType = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    aria-hidden
    fill="none"
  >
    <path
      d="M2.5 5.83301C2.5 5.16997 2.76339 4.53408 3.23223 4.06524C3.70107 3.5964 4.33696 3.33301 5 3.33301H15C15.663 3.33301 16.2989 3.5964 16.7678 4.06524C17.2366 4.53408 17.5 5.16997 17.5 5.83301V14.1663C17.5 14.8294 17.2366 15.4653 16.7678 15.9341C16.2989 16.4029 15.663 16.6663 15 16.6663H5C4.33696 16.6663 3.70107 16.4029 3.23223 15.9341C2.76339 15.4653 2.5 14.8294 2.5 14.1663V5.83301Z"
      stroke="#9A9A9A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.4997 6.66602H14.1663M12.4997 9.99935H14.1663M5.83301 13.3327H14.1663M5.83301 8.33268C5.83301 8.77471 6.0086 9.19863 6.32116 9.51119C6.63372 9.82375 7.05765 9.99935 7.49967 9.99935C7.9417 9.99935 8.36562 9.82375 8.67819 9.51119C8.99075 9.19863 9.16634 8.77471 9.16634 8.33268C9.16634 7.89065 8.99075 7.46673 8.67819 7.15417C8.36562 6.84161 7.9417 6.66602 7.49967 6.66602C7.05765 6.66602 6.63372 6.84161 6.32116 7.15417C6.0086 7.46673 5.83301 7.89065 5.83301 8.33268Z"
      stroke="#9A9A9A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function labelRow(
  Icon: IconType,
  label: string,
  extra?: React.ReactNode,
  showRequired?: boolean,
  errorType?: 'missing' | 'invalid',
) {
  const helperText =
    errorType === 'missing'
      ? 'Field is required'
      : errorType === 'invalid'
        ? 'Invalid Input'
        : showRequired
          ? 'Field is required'
        : ''
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 shrink-0 items-center justify-center text-[#999]">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <span className="text-[14px] font-medium leading-normal text-[#999]">
        {label}
        {showRequired ? (
          <span className="text-[#ff6b6b]">
            {' '}
            * {helperText}
          </span>
        ) : null}
      </span>
      {extra}
    </div>
  )
}

export default function BookAppointment() {
  const [step, setStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultFormData)
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [uiError, setUiError] = useState('')
  const [attemptedPersonalContinue, setAttemptedPersonalContinue] = useState(false)
  const [attemptedAddressContinue, setAttemptedAddressContinue] = useState(false)
  const [attemptedScheduleContinue, setAttemptedScheduleContinue] = useState(false)

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    if (uiError) setUiError('')
    setForm((f) => ({ ...f, [key]: value }))
  }, [uiError])

  useEffect(() => {
    setMaxReachedStep((prev) => Math.max(prev, step))
  }, [step])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>
      const message = typeof custom.detail === 'string' ? custom.detail : 'Something went wrong.'
      setUiError(message)
    }
    window.addEventListener(BOOK_APPOINTMENT_ERROR_EVENT, handler as EventListener)
    return () => window.removeEventListener(BOOK_APPOINTMENT_ERROR_EVENT, handler as EventListener)
  }, [])

  const goNextFromPersonal = () => {
    if (!ENFORCE_REQUIRED_FIELDS) {
      setUiError('')
      setStep(2)
      return
    }
    const trimmedPhone = form.phone.trim()
    const trimmedEmail = form.email.trim()
    const trimmedAge = form.age.trim()
    const trimmedFirstName = form.firstName.trim()
    const trimmedLastName = form.lastName.trim()
    setAttemptedPersonalContinue(true)
    if (!trimmedFirstName) {
      logClientError('First Name is required.')
      return
    }
    if (!NAME_REGEX.test(trimmedFirstName)) {
      logClientError('Invalid Input for First Name.')
      return
    }
    if (!trimmedLastName) {
      logClientError('Last Name is required.')
      return
    }
    if (!NAME_REGEX.test(trimmedLastName)) {
      logClientError('Invalid Input for Last Name.')
      return
    }
    if (!trimmedPhone) {
      logClientError('Phone is required.')
      return
    }
    if (!/^\d{10}$/.test(trimmedPhone)) {
      logClientError('Invalid Input for Phone.')
      return
    }
    if (!trimmedEmail) {
      logClientError('Email is required.')
      return
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      logClientError('Please enter a valid email address.')
      return
    }
    const normalizedEmployeeId = normalizeEmployeeId(form.employeeId)
    if (!normalizedEmployeeId) {
      logClientError('Employee ID is required.')
      return
    }
    if (!ALLOWED_EMPLOYEE_IDS.has(normalizedEmployeeId)) {
      logClientError('This Employee ID is not allowed.')
      return
    }
    if (normalizedEmployeeId !== TEST_EMPLOYEE_ID && getBookedEmployeeIds().has(normalizedEmployeeId)) {
      logClientError('This Employee ID has already used the booking.')
      return
    }
    if (!trimmedAge) {
      logClientError('Age is required.')
      return
    }
    if (!/^\d{1,2}$/.test(trimmedAge)) {
      logClientError('Age must be up to 2 digits.')
      return
    }
    if (!form.gender) {
      logClientError('Gender is required.')
      return
    }

    setStep(2)
  }

  const goNextFromSchedule = () => {
    if (!ENFORCE_REQUIRED_FIELDS) {
      setUiError('')
      setStep(4)
      return
    }
    setAttemptedScheduleContinue(true)
    if (!form.appointmentDate) {
      logClientError('Please select a schedule date.')
      return
    }
    if (!form.appointmentTime) {
      logClientError('Please select a time slot.')
      return
    }

    setStep(4)
  }

  const goNextFromAddress = () => {
    if (!ENFORCE_REQUIRED_FIELDS) {
      setUiError('')
      setStep(3)
      return
    }
    setAttemptedAddressContinue(true)
    const trimmedHouseNumber = form.houseNumber.trim()
    const trimmedStreet = form.street.trim()
    const trimmedLandmark = form.landmark.trim()
    const trimmedPincode = form.pincode.trim()
    const trimmedCity = form.city.trim()
    const trimmedState = form.state.trim()

    if (!trimmedHouseNumber) {
      logClientError('House No./ Building is required.')
      return
    }
    if (!trimmedStreet) {
      logClientError('Area/ Street is required.')
      return
    }
    if (!trimmedLandmark) {
      logClientError('Landmark is required.')
      return
    }
    if (!trimmedPincode) {
      logClientError('Pincode is required.')
      return
    }
    if (!/^\d{6}$/.test(trimmedPincode)) {
      logClientError('Pincode must be 6 digits.')
      return
    }
    if (!trimmedCity) {
      logClientError('City is required.')
      return
    }
    if (!trimmedState) {
      logClientError('State is required.')
      return
    }

    setStep(3)
  }

  const handleConfirmBooking = async () => {
    if (isSubmittingBooking) return

    if (!ENFORCE_REQUIRED_FIELDS) {
      setUiError('')
      setIsSubmittingBooking(true)
      try {
        setStep(5)
      } finally {
        setIsSubmittingBooking(false)
      }
      return
    }

    const normalizedEmployeeId = normalizeEmployeeId(form.employeeId)
    const trimmedPhone = form.phone.trim()
    const trimmedEmail = form.email.trim()
    const trimmedAge = form.age.trim()
    const parsedAge = Number.parseInt(form.age, 10)
    const safeAge = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : NaN

    if (!form.firstName.trim()) {
      logClientError('First Name is required.')
      return
    }
    if (!form.lastName.trim()) {
      logClientError('Last Name is required.')
      return
    }
    if (!normalizedEmployeeId) {
      logClientError('Employee ID is required.')
      return
    }
    if (!ALLOWED_EMPLOYEE_IDS.has(normalizedEmployeeId)) {
      logClientError('This Employee ID is not allowed.')
      return
    }
    if (normalizedEmployeeId !== TEST_EMPLOYEE_ID && getBookedEmployeeIds().has(normalizedEmployeeId)) {
      logClientError('This Employee ID has already used the booking.')
      return
    }
    if (!trimmedEmail) {
      logClientError('Email is required.')
      return
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      logClientError('Please enter a valid email address.')
      return
    }
    if (!trimmedPhone) {
      logClientError('Phone is required.')
      return
    }
    if (!/^\d{10}$/.test(trimmedPhone)) {
      logClientError('Phone must be exactly 10 digits.')
      return
    }
    if (!form.gender) {
      logClientError('Gender is required.')
      return
    }
    if (!/^\d{1,2}$/.test(trimmedAge) || !Number.isFinite(safeAge)) {
      logClientError('Age must be up to 2 digits.')
      return
    }
    if (!form.appointmentDate) {
      logClientError('Please select a schedule date.')
      return
    }
    const apiAddress = formatAddressForApi(form)
    const apiPincode = form.pincode.trim()
    const apiCity = form.city.trim()
    const apiState = form.state.trim()
    if (!apiAddress) {
      logClientError('House No./ Building is required.')
      return
    }
    if (!apiPincode || !/^\d{6}$/.test(apiPincode)) {
      logClientError('Pincode must be 6 digits.')
      return
    }
    if (!apiCity) {
      logClientError('City is required.')
      return
    }
    if (!apiState) {
      logClientError('State is required.')
      return
    }

    setIsSubmittingBooking(true)
    setStep(5)
    setIsSubmittingBooking(false)
  }

  const mobileScreenTitle = 'Book Appointment'

  const showBack = step > 1
  const hideGlobalContinue = step === 4 || step === 5 || step === 6 || step === 7 || step === 8 || step === 9 || step === 10 || step === 11 || step === 12 || step === 13
  const hideStepper = step >= 5
  const hideMainHeader = step === 6 || step === 7 || step === 8 || step === 9 || step === 10 || step === 11 || step === 12
  const confirmStepperBorder = step === 4

  const handleStepContinue = () => {
    if (step === 1) goNextFromPersonal()
    else if (step === 2) goNextFromAddress()
    else goNextFromSchedule()
  }

  const continueVariant = step === 3 ? 'mobileBar' : 'mobileBarCompact'

  return (
    <PageBackdrop
      mobileBackgroundSrc={
        step === 13
          ? lastPageBackgroundSvg
          : step === 6 || step === 8
            ? backgroundAssessmentSvg
            : step === 10
              ? nutritionEndBackgroundSvg
              : step === 11 || step === 12
                ? nutritionLogBackgroundSvg
                : step === 7
                  ? familyHistoryBackgroundSvg
                  : step === 9
                    ? lifestyleHabitsBackgroundSvg
                    : undefined
      }
    >
      <div className="flex h-full min-w-0 flex-col">
        {/* Header — Figma: p-20px */}
        {hideMainHeader ? null : (
        <header className="grid shrink-0 grid-cols-[32px_1fr_32px] items-center p-5">
          {showBack ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="flex size-8 items-center justify-start text-white"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" strokeWidth={2} />
            </button>
          ) : (
            <span className="size-8" aria-hidden />
          )}
          <h1 className="text-center text-[20px] font-semibold leading-6 text-white">
            {mobileScreenTitle}
          </h1>
          {step === 5 || step === 13 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex size-8 items-center justify-end text-white"
              aria-label="Close"
            >
              <X className="size-6" strokeWidth={1.75} />
            </button>
          ) : (
            <span className="size-8" aria-hidden />
          )}
        </header>
        )}

        {hideStepper ? null : (
          <div
            className={
              confirmStepperBorder
                ? 'shrink-0 border-b border-[rgba(154,154,154,0.1)] px-5 pb-5'
                : 'shrink-0 px-5'
            }
          >
            <Stepper
              current={step}
              maxReachable={maxReachedStep}
              onStepClick={(target) => setStep(target)}
            />
          </div>
        )}

        {uiError ? (
          <div className="mx-6 mb-2 rounded-lg border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-3 py-2 text-sm text-[#ffd1d1]">
            {uiError}
          </div>
        ) : null}

        {/* Form body — Figma: pt-48px px-24px pb-24px, justify-between */}
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col ${
            step === 5
              ? 'flex min-h-0 min-w-0 flex-1 flex-col justify-between px-6 pb-6 pt-4'
              : step === 6 || step === 7 || step === 8 || step === 9 || step === 10 || step === 11 || step === 12 || step === 13
                ? 'px-0 pb-0 pt-0'
                : 'justify-between px-6 pb-6 pt-12'
          }`}
        >
          <div
            className={
              step === 7 || step === 9 || step === 11
                ? 'min-h-0 min-w-0 flex-1 overflow-hidden'
                : step === 5 || step === 8 || step === 10 || step === 12
                  ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                  : 'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            }
          >
            {step === 1 && (
              <PersonalStep
                form={form}
                update={update}
                labelRow={labelRow}
                showMissingRequired={ENFORCE_REQUIRED_FIELDS && attemptedPersonalContinue}
              />
            )}
            {step === 2 && (
              <AddressStep
                form={form}
                update={update}
                labelRow={labelRow}
                showMissingRequired={ENFORCE_REQUIRED_FIELDS && attemptedAddressContinue}
              />
            )}
            {step === 3 && (
              <ScheduleStep
                form={form}
                update={update}
                showMissingRequired={ENFORCE_REQUIRED_FIELDS && attemptedScheduleContinue}
              />
            )}
            {step === 4 && (
              <ConfirmStep
                form={form}
                onEdit={(s) => setStep(s)}
                onProceed={handleConfirmBooking}
                isSubmitting={isSubmittingBooking}
              />
            )}
            {step === 5 && (
              <BookingConfirmedStep form={form} />
            )}
            {step === 6 && (
              <HealthAssessmentStep onStartAssessment={() => setStep(7)} />
            )}
            {step === 7 && (
              <FamilyHistoryMcqStep
                onBack={() => setStep(6)}
                onComplete={() => setStep(8)}
              />
            )}
            {step === 8 && (
              <FamilySectionCompleteStep
                onStartLifestyle={() => setStep(9)}
              />
            )}
            {step === 9 && (
              <LifestyleHabitsMcqStep
                onBack={() => setStep(8)}
                onComplete={() => setStep(10)}
              />
            )}
            {step === 10 && (
              <LifestyleSectionCompleteStep
                onStartNutrition={() => setStep(11)}
              />
            )}
            {step === 11 && (
              <NutritionLogMcqStep
                onBack={() => setStep(10)}
                onComplete={() => setStep(12)}
              />
            )}
            {step === 12 && (
              <NutritionSectionCompleteStep
                onContinue={() => setStep(13)}
              />
            )}
            {step === 13 && (
              <AppointmentJourneyCompleteStep bookingId={form.employeeId} />
            )}
          </div>

          {step === 5 ? (
            <ContinueButton
              variant="mobileBar"
              className="mt-6 !h-[52px] w-full shrink-0 border border-[#969696] shadow-[0_12px_20px_rgba(255,255,255,0.15)]"
              onClick={() => setStep(6)}
            >
              Continue
            </ContinueButton>
          ) : !hideGlobalContinue ? (
            <div className="mt-6 shrink-0">
              <ContinueButton variant={continueVariant} onClick={handleStepContinue}>
                Continue
              </ContinueButton>
            </div>
          ) : null}
        </div>
      </div>
    </PageBackdrop>
  )
}

const mobileFieldInput =
  'h-10 w-full rounded-[8px] border-0 bg-white/5 px-4 text-[12px] text-white outline-none placeholder:text-[12px] placeholder:text-white/60 focus:ring-1 focus:ring-[#4b8d83]'
const mobileFieldInputName =
  'h-10 w-full rounded-[8px] border-0 bg-white/5 px-4 text-[14px] text-white outline-none placeholder:text-[14px] placeholder:text-white/60 focus:ring-1 focus:ring-[#4b8d83]'

function PersonalStep({
  form,
  update,
  labelRow,
  showMissingRequired,
}: {
  form: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  labelRow: (
    Icon: IconType,
    label: string,
    extra?: React.ReactNode,
    showRequired?: boolean,
    errorType?: 'missing' | 'invalid',
  ) => React.ReactNode
  showMissingRequired?: boolean
}) {
  const showRequired = Boolean(showMissingRequired)
  const isMissing = (value: string) => showRequired && !value.trim()
  const isMissingGender = showRequired && !form.gender
  const fullNameError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.firstName.trim() || !form.lastName.trim()
      ? 'missing'
      : !NAME_REGEX.test(form.firstName.trim()) || !NAME_REGEX.test(form.lastName.trim())
        ? 'invalid'
        : undefined
  const phoneError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.phone.trim()
      ? 'missing'
      : !/^\d{10}$/.test(form.phone.trim())
        ? 'invalid'
        : undefined
  const emailError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.email.trim()
      ? 'missing'
      : !EMAIL_REGEX.test(form.email.trim())
        ? 'invalid'
        : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        {labelRow(User, 'Full Name', undefined, Boolean(fullNameError), fullNameError)}
        <div className="flex gap-2">
          <input
            className={`${mobileFieldInputName} min-w-0 flex-1`}
            placeholder="First name"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(e) => update('firstName', sanitizeName(e.target.value))}
          />
          <input
            className={`${mobileFieldInputName} min-w-0 flex-1`}
            placeholder="Last Name"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(e) => update('lastName', sanitizeName(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Phone, 'Phone', undefined, Boolean(phoneError), phoneError)}
        <input
          className={mobileFieldInput}
          inputMode="tel"
          placeholder="+91 999999999"
          maxLength={10}
          value={form.phone}
          onChange={(e) => update('phone', sanitizePhone(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Mail, 'Email', undefined, Boolean(emailError), emailError)}
        <input
          className={mobileFieldInput}
          type="email"
          inputMode="email"
          placeholder="abc.xyz@gmail.com"
          autoComplete="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Calendar, 'Age', undefined, isMissing(form.age))}
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="24"
          maxLength={2}
          value={form.age}
          onChange={(e) => update('age', sanitizeAge(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(User, 'Gender', undefined, isMissingGender)}
        <div className="flex h-10 gap-6">
          <button
            type="button"
            onClick={() => update('gender', 'male')}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] leading-4 transition',
              form.gender === 'male'
                ? 'bg-[radial-gradient(ellipse_at_center,_#11795f_0%,_#1c493d_100%)] text-white'
                : 'bg-white/5 text-[#999]',
            ].join(' ')}
          >
            <Mars className="size-3 shrink-0" strokeWidth={2} />
            Male
          </button>
          <button
            type="button"
            onClick={() => update('gender', 'female')}
            className={[
              'flex flex-1 items-center justify-center gap-2.5 rounded-full px-2.5 py-1 text-[12px] leading-4 transition',
              form.gender === 'female'
                ? 'bg-[radial-gradient(ellipse_at_center,_#11795f_0%,_#1c493d_100%)] text-white'
                : 'bg-white/5 text-[#999]',
            ].join(' ')}
          >
            <Venus className="size-2.5 shrink-0" strokeWidth={2} />
            Female
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center text-[#999]">
            <EmployeeIdIcon className="size-6" />
          </span>
          <span className="text-[14px] font-medium text-[#999]">
            Employee ID
            {isMissing(form.employeeId) ? (
              <span className="text-[#ff6b6b]"> * Field is required</span>
            ) : null}
          </span>
        </div>
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="1324"
          maxLength={4}
          value={getEmployeeIdSuffix(form.employeeId)}
          onChange={(e) => update('employeeId', buildEmployeeIdFromSuffix(e.target.value))}
        />
      </div>
    </div>
  )
}

function AddressStep({
  form,
  update,
  labelRow,
  showMissingRequired,
}: {
  form: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  labelRow: (
    Icon: IconType,
    label: string,
    extra?: React.ReactNode,
    showRequired?: boolean,
    errorType?: 'missing' | 'invalid',
  ) => React.ReactNode
  showMissingRequired?: boolean
}) {
  const showRequired = Boolean(showMissingRequired)
  const isMissing = (value: string) => showRequired && !value.trim()
  const [pincodeLookupLoading, setPincodeLookupLoading] = useState(false)
  const [pincodeLookupError, setPincodeLookupError] = useState<'not_found' | 'load_failed' | null>(
    null,
  )
  const lastResolvedPincode = useRef('')

  const pincodeError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.pincode.trim()
      ? 'missing'
      : !/^\d{6}$/.test(form.pincode.trim())
        ? 'invalid'
        : undefined

  useEffect(() => {
    void loadPincodeLookup().catch(() => {
      /* lookup loads again when user enters a pincode */
    })
  }, [])

  useEffect(() => {
    const pin = form.pincode.trim()
    if (pin.length !== 6) {
      setPincodeLookupError(null)
      setPincodeLookupLoading(false)
      lastResolvedPincode.current = ''
      return
    }
    if (pin === lastResolvedPincode.current) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        setPincodeLookupLoading(true)
        setPincodeLookupError(null)
        try {
          const result = await lookupPincode(pin)
          if (cancelled) return
          if (!result) {
            setPincodeLookupError('not_found')
            return
          }
          lastResolvedPincode.current = pin
          update('city', result.city)
          update('state', result.state)
        } catch {
          if (!cancelled) setPincodeLookupError('load_failed')
        } finally {
          if (!cancelled) setPincodeLookupLoading(false)
        }
      })()
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [form.pincode, update])

  const pincodeHint = pincodeLookupLoading
    ? 'Looking up city and state…'
    : pincodeLookupError === 'not_found'
      ? 'Pincode not found — enter city and state manually.'
      : pincodeLookupError === 'load_failed'
        ? 'Could not load pincode data — enter city and state manually.'
        : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        {labelRow(House, 'House No./ Building', undefined, isMissing(form.houseNumber))}
        <input
          className={mobileFieldInput}
          placeholder="350 A, Avenue Street"
          value={form.houseNumber}
          onChange={(e) => update('houseNumber', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Signpost, 'Area/ Street', undefined, isMissing(form.street))}
        <input
          className={mobileFieldInput}
          placeholder="Area/ Street"
          value={form.street}
          onChange={(e) => update('street', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Building2, 'Landmark', undefined, isMissing(form.landmark))}
        <input
          className={mobileFieldInput}
          placeholder="opp. Pink Salt Cafe"
          value={form.landmark}
          onChange={(e) => update('landmark', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(MapPinned, 'Pincode', undefined, Boolean(pincodeError), pincodeError)}
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="402201"
          maxLength={6}
          value={form.pincode}
          onChange={(e) => update('pincode', sanitizePincode(e.target.value))}
        />
        {pincodeHint ? (
          <p className="text-[11px] font-light text-[#999]">{pincodeHint}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(MapPin, 'City', undefined, isMissing(form.city))}
        <input
          className={mobileFieldInput}
          placeholder="Mumbai"
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
        />
      </div>
    </div>
  )
}

function ConfirmStep({
  form,
  onEdit,
  onProceed,
  isSubmitting,
}: {
  form: FormData
  onEdit: (step: number) => void
  onProceed: () => void
  isSubmitting: boolean
}) {
  const fullAddress = [form.houseNumber, form.street].filter(Boolean).join(', ')
  const timeRange = formatTimeSlotRange(form.appointmentTime)
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[18px] font-semibold text-white">Confirm Details</h2>

      <section className="rounded-[8px] bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
          <h3 className="text-[15px] font-semibold text-white">Personal Information</h3>
          <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(1)}>
            Edit
          </button>
        </div>
        <MemberSummary member={form} showRelation={false} dense />
      </section>

      <section className="rounded-[8px] bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
          <h3 className="text-[15px] font-semibold text-white">Address Details</h3>
          <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(2)}>
            Edit
          </button>
        </div>
        <div className="space-y-2.5 text-[11px] font-light text-[#ccc]">
          <SummaryItem Icon={House} label={fullAddress || '—'} dense />
          <SummaryItem Icon={Building2} label={form.landmark || '—'} dense />
          <div className="grid grid-cols-2 gap-3">
            <SummaryItem Icon={MapPin} label={form.city || '—'} dense />
            <SummaryItem Icon={Map} label={form.state || '—'} dense />
            <SummaryItem Icon={MapPinned} label={form.pincode || '—'} dense />
          </div>
        </div>
      </section>

      <section className="rounded-[8px] bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
          <h3 className="text-[15px] font-semibold text-white">Sample Collection</h3>
          <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(3)}>
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[11px] font-light text-[#ccc]">
          <SummaryItem Icon={Calendar} label={formatBookingDate(form.appointmentDate)} dense />
          <SummaryItem Icon={Clock} label={timeRange} dense />
        </div>
      </section>

      <ContinueButton
        className="mt-3 w-full max-w-none"
        showChevron={false}
        variant="mobileBarCompact"
        disabled={isSubmitting}
        onClick={onProceed}
      >
        {isSubmitting ? 'Confirming...' : 'Confirm'}
      </ContinueButton>
    </div>
  )
}

function MemberSummary({
  member,
  showRelation,
  dense = false,
}: {
  member: FormData
  showRelation: boolean
  dense?: boolean
}) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(' ') || '—'
  const GenderIcon = member.gender === 'female' ? Venus : Mars
  const genderLabel = member.gender
    ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1)
    : '—'
  const relationLabel =
    RELATION_OPTIONS.find((o) => o.toLowerCase() === member.relation) ?? member.relation

  return (
    <div>
      <div className={`grid grid-cols-2 gap-x-3 ${dense ? 'gap-y-3 text-[11px]' : 'gap-y-4 text-sm'} text-[#cccccc]`}>
        {showRelation ? (
          <>
            <SummaryItem Icon={User} label={name} dense={dense} />
            <SummaryItem Icon={User} label={relationLabel || '—'} capitalize dense={dense} />
          </>
        ) : (
          <div className="col-span-2">
            <SummaryItem Icon={User} label={name} dense={dense} />
          </div>
        )}
        <SummaryItem Icon={Phone} label={member.phone || '—'} dense={dense} />
        <SummaryItem Icon={GenderIcon} label={genderLabel} dense={dense} />
        <SummaryItem Icon={Calendar} label={member.age ? `${member.age} Years` : '—'} dense={dense} />
        <SummaryItem Icon={EmployeeIdIcon} label={getEmployeeIdSuffix(member.employeeId) || member.employeeId || '—'} dense={dense} />
        <div className="col-span-2">
          <SummaryItem Icon={Mail} label={member.email || '—'} dense={dense} />
        </div>
      </div>
    </div>
  )
}

function SummaryItem({
  Icon,
  label,
  capitalize,
  dense = false,
}: {
  Icon: IconType
  label: string
  capitalize?: boolean
  dense?: boolean
}) {
  return (
    <div className="flex items-center gap-2 leading-snug">
      <Icon className={`${dense ? 'size-[14px]' : 'size-[18px]'} shrink-0 opacity-70`} strokeWidth={1.75} />
      <span className={[dense ? 'text-[11px] font-light text-[#ccc]' : '', 'truncate', capitalize ? 'capitalize' : ''].join(' ')}>
        {label}
      </span>
    </div>
  )
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

function ScheduleStep({
  form,
  update,
  showMissingRequired,
}: {
  form: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  showMissingRequired?: boolean
}) {
  const bookableDates = useMemo(() => getBookableDates(), [])

  useEffect(() => {
    const clamped = clampBookingDate(form.appointmentDate)
    if (form.appointmentDate && clamped !== form.appointmentDate) {
      update('appointmentDate', clamped)
    }
  }, [form.appointmentDate, update])

  const selectedSlotClass =
    'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] border-transparent'
  const idleSlotClass = 'border-white/[0.08] bg-white/5'
  const selectedDateClass =
    'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)]'
  const idleDateClass = 'bg-white/5'

  const sectionLabelClass =
    'font-sans text-[14px] font-medium leading-normal text-[#9A9A9A]'

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <PreferredDateIcon />
          <h2 className={sectionLabelClass}>
            Preferred Date
            {showMissingRequired && !form.appointmentDate ? (
              <span className="text-[#ff6b6b]"> * Field is required</span>
            ) : null}
          </h2>
        </div>
        <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bookableDates.map((date) => {
            const iso = toIsoDate(date)
            const selected = form.appointmentDate === iso
            return (
              <button
                key={iso}
                type="button"
                onClick={() => update('appointmentDate', iso)}
                aria-pressed={selected}
                className={[
                  'mx-0 flex h-[75px] w-[70px] shrink-0 flex-col items-center justify-center gap-1 rounded-[6px] px-4 transition',
                  selected ? selectedDateClass : idleDateClass,
                ].join(' ')}
              >
                <span className={selected ? 'text-[12px] font-medium text-white' : 'text-[12px] font-medium text-[#9a9a9a]/80'}>
                  {DAY_LABELS[date.getDay()]}
                </span>
                <span className={selected ? 'text-[18px] font-semibold text-white' : 'text-[18px] font-semibold text-[#9a9a9a]/80'}>
                  {date.getDate()}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <PreferredTimeSlotIcon />
          <div className="flex flex-col gap-1">
            <h2 className={sectionLabelClass}>
              Preferred Time Slot
              {showMissingRequired && !form.appointmentTime ? (
                <span className="text-[#ff6b6b]"> * Field is required</span>
              ) : null}
            </h2>
            <p className="pl-7 text-[10px] font-light text-[#ccc]">Collection window is of 1 hour</p>
          </div>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 px-1">
          {SCHEDULE_TIME_SLOTS.map((slot) => {
            const selected = form.appointmentTime === slot
            return (
              <button
                key={slot}
                type="button"
                onClick={() => update('appointmentTime', slot)}
                aria-pressed={selected}
                className={[
                  'flex h-10 w-full items-center justify-center rounded-full border text-[14px] font-medium transition',
                  selected ? selectedSlotClass : idleSlotClass,
                ].join(' ')}
              >
                <span className={selected ? 'text-white' : 'text-[#9a9a9a]/80'}>{slot}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

function formatBookingDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return `${DAY_LABELS[d.getDay()]}, ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`
}

function BookingConfirmedStep({ form }: { form: FormData }) {
  const memberName =
    [form.firstName, form.lastName].filter(Boolean).join(' ') || '—'
  const bookingDate = formatShortBookingDate(form.appointmentDate)
  const timeRange = formatTimeSlotRange(form.appointmentTime).replace(' - ', '-')
  const bookingDateTime = `${bookingDate}  |  ${timeRange}`
  const locationLabel = [form.street?.trim() || form.city?.trim(), form.city?.trim()]
    .filter(Boolean)
    .filter((part, index, arr) => arr.indexOf(part) === index)
    .join(', ') || '—'
  const packageLabel =
    form.gender === 'female'
      ? 'Full Body with Vitamins, Women Peak Performance'
      : 'Full Body with Vitamins, Men Peak Performance'

  return (
    <div className="flex min-h-full w-full flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center gap-1.5">
        <div className="flex size-14 items-center justify-center rounded-xl border border-[rgba(144,223,158,0.5)] shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
          <img src={slotConfirmedIcon} alt="" className="size-7" aria-hidden />
        </div>
        <div className="flex w-full flex-col items-center pb-3 text-center">
          <h2 className="text-[18px] font-semibold tracking-[0.2px] text-white">
            Slot Confirmed!
          </h2>
          <p className="text-[12px] leading-4 text-[#9a9a9a]">
            Complete the Health Assessment To confirm your booking.
          </p>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 px-[17px] py-[25px] backdrop-blur-[12px]">
        <div className="flex w-full items-center justify-between whitespace-nowrap">
          <div className="flex flex-col items-start gap-1">
            <p className="text-[16px] font-semibold leading-[18px] tracking-[-0.96px] text-white">
              Step 1
            </p>
            <p className="text-[11px] leading-3 text-[#90df9e]">Completed</p>
          </div>
          <div className="flex flex-col items-start gap-1">
            <p className="text-[16px] font-semibold leading-[18px] tracking-[-0.96px] text-white">
              Step 2
            </p>
            <p className="text-[11px] font-light leading-3 text-[#9a9a9a]">Pending</p>
          </div>
        </div>
        <div className="relative mt-4 h-2 w-full rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 w-[29%] rounded-full bg-[#dac15a]" />
          <div className="absolute left-[29%] top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#dac15a] bg-white shadow-[0_0_15px_#dac15a]" />
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 rounded-xl border border-[rgba(144,223,158,0.2)] bg-[rgba(75,141,131,0.1)] p-[13px]">
        <SuccessDetailRow icon={<CalendarIcon />} label="Date & Time" value={bookingDateTime} />
        <SuccessDetailRow
          icon={<img src={packageIcon} alt="" className="size-5" aria-hidden />}
          label="Package"
          value={packageLabel}
        />
        <SuccessDetailRow icon={<UserIcon />} label="Member Name" value={memberName} />
        <SuccessDetailRow icon={<LocationIcon />} label="Location" value={locationLabel} />
      </div>

      <div className="mt-auto flex w-full flex-col items-start gap-1 pt-4">
        <p className="text-[12px] tracking-[-0.06em] text-[#9a9a9a]">Step 2</p>
        <p className="text-[16px] leading-[18px] tracking-[-0.06em] text-white">
          Health Assessment
        </p>
      </div>
    </div>
  )
}

function SuccessDetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-[#9a9a9a]">{label}</p>
        <p className="text-[15px] font-medium leading-normal text-[#ccc]">{value}</p>
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M6.6665 1.66699V5.00033M13.3332 1.66699V5.00033" stroke="#4B8D83" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.16667 3.33398H15.8333C16.7538 3.33398 17.5 4.08018 17.5 5.00065V16.6673C17.5 17.5878 16.7538 18.334 15.8333 18.334H4.16667C3.24619 18.334 2.5 17.5878 2.5 16.6673V5.00065C2.5 4.08018 3.24619 3.33398 4.16667 3.33398V3.33398" stroke="#4B8D83" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 8.33398H17.5" stroke="#4B8D83" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M15.8332 17.5V15.8333C15.8332 13.9924 14.3408 12.5 12.4998 12.5H7.49984C5.65889 12.5 4.1665 13.9924 4.1665 15.8333V17.5" stroke="#4B8D83" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.6665 5.83333C6.6665 7.67305 8.16012 9.16667 9.99984 9.16667C11.8396 9.16667 13.3332 7.67305 13.3332 5.83333C13.3332 3.99362 11.8396 2.5 9.99984 2.5C8.16012 2.5 6.6665 3.99362 6.6665 5.83333V5.83333" stroke="#4B8D83" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M16.667 8.33268C16.667 13.3327 10.0003 18.3327 10.0003 18.3327C10.0003 18.3327 3.33366 13.3327 3.33366 8.33268C3.33366 6.56457 4.03604 4.86888 5.28628 3.61864C6.53652 2.3684 8.23221 1.66602 10.0003 1.66602C11.7684 1.66602 13.4641 2.3684 14.7144 3.61864C15.9646 4.86888 16.667 6.56457 16.667 8.33268Z" stroke="#4B8D83" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.0003 10.8327C11.381 10.8327 12.5003 9.71339 12.5003 8.33268C12.5003 6.95197 11.381 5.83268 10.0003 5.83268C8.61961 5.83268 7.50033 6.95197 7.50033 8.33268C7.50033 9.71339 8.61961 10.8327 10.0003 10.8327Z" stroke="#4B8D83" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

