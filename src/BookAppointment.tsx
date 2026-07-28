import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Calendar,
  House,
  Mail,
  MapPin,
  MapPinned,
  Mars,
  Phone,
  Signpost,
  User,
  Users,
  Venus,
} from 'lucide-react'
import { ContinueButton } from './components/ContinueButton'
import { onboardUserForEngagement, type OnboardUserForEngagementPayload } from './api/onboard'
import { PageBackdrop } from './components/PageBackdrop'
import { SavedMemberCard } from './components/SavedMemberCard'
import { Stepper } from './components'
import { defaultFormData, type FormData } from './types'
import supershyftWhiteLogo from './assets/SuperShyft - Logo [Final]-03 7 (1).svg'

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
const normalizeEmployeeId = (value: string) => value.trim().toUpperCase()
const DEFAULT_ADDRESS_STATE = 'Maharashtra'
const DEFAULT_ADDRESS_COUNTRY = 'India'

function buildOnboardAddress(form: FormData): string {
  return [form.houseNumber, form.street, form.landmark].filter((part) => part.length > 0).join(', ')
}
const BOOK_APPOINTMENT_ERROR_EVENT = 'book-appointment:error'
const logClientError = (message: string) => {
  console.error(`[BookAppointment] ${message}`)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BOOK_APPOINTMENT_ERROR_EVENT, { detail: message }))
  }
}
const TEST_EMPLOYEE_IDS = new Set(['0000IN000', '0000IN0000'])
const BOOKED_EMPLOYEE_IDS_STORAGE_KEY = 'bookedEmployeeIds'
const ALLOWED_EMPLOYEE_IDS = new Set([
  ...TEST_EMPLOYEE_IDS,
  '0000IN0210', '0000IN0221', '0000IN0224', '0000IN0227', '0000IN0228', '0000IN0229',
  '0000IN0232', '0000IN0233', '0000IN0235', '0000IN0237', '0000IN0245', '0000IN0277',
  '0000IN0315', '0000IN0338', '0000IN0351', '0000IN0354', '0000IN0368',
  '0000IN0406', '0000IN0424', '0000IN0428', '0000IN0442', '0000IN0451',
  '0000IN0508', '0000IN0524', '0000IN0543', '0000IN0547', '0000IN0548', '0000IN0550',
  '0000IN0551', '0000IN0554', '0000IN0555', '0000IN0560', '0000IN0561', '0000IN0564',
  '0000IN0567', '0000IN0570', '0000IN0580', '0000IN0583', '0000IN0585', '0000IN0591',
  '0000IN0592', '0000IN0593', '0000IN0596', '0000IN0599', '0000IN0603',
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

function markEmployeeIdAsBooked(employeeId: string) {
  const normalized = normalizeEmployeeId(employeeId)
  if (TEST_EMPLOYEE_IDS.has(normalized) || typeof window === 'undefined') return
  const booked = getBookedEmployeeIds()
  booked.add(normalized)
  window.localStorage.setItem(BOOKED_EMPLOYEE_IDS_STORAGE_KEY, JSON.stringify(Array.from(booked)))
}
const toApiTimeSlot = (slot: string) => {
  const normalized = slot.trim()
  if (!normalized) return '9:00'
  const firstPart = (normalized.split('-')[0]?.trim() || normalized).toUpperCase()
  const isPm = firstPart.includes('PM')
  const isAm = firstPart.includes('AM')
  const timeOnly = firstPart.replace(/\s*(AM|PM)\s*/gi, '').trim()
  let hour = Number.parseInt(timeOnly.split(':')[0] || '', 10)
  if (!Number.isFinite(hour)) return '9:00'
  if (isPm && hour < 12) hour += 12
  if (isAm && hour === 12) hour = 0
  if (hour < 0 || hour > 23) return '9:00'
  return `${hour}:00`
}

function useIsLg() {
  const [lg, setLg] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setLg(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return lg
}

function inputClass(short?: boolean) {
  return [
    'w-full rounded-[8px] bg-white/5 px-4 text-base text-white outline-none ring-1 ring-white/5 placeholder:text-[15px] placeholder:text-white/40 focus:ring-[#4b8d83]/70 lg:text-sm lg:placeholder:text-[13px]',
    short ? 'h-10' : 'h-[44px]',
  ].join(' ')
}

/** Figma mobile: 20px icon, 8px gap, Lato Medium 14px #999. Desktop: ~14px icon, 13px label #9a9a9a */
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

const GenderIcon: IconType = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 14 18"
    aria-hidden
    fill="none"
  >
    <path
      d="M12.1953 0H9.07032C8.82168 0 8.58322 0.0987721 8.40741 0.274587C8.23159 0.450403 8.13282 0.68886 8.13282 0.9375C8.13282 1.18614 8.23159 1.4246 8.40741 1.60041C8.58322 1.77623 8.82168 1.875 9.07032 1.875H9.9297L8.70782 3.09922C8.08216 2.5793 7.34545 2.21001 6.5545 2.01983C5.76355 1.82964 4.93949 1.82364 4.14586 2.00229C3.35222 2.18093 2.61022 2.53945 1.97705 3.0502C1.34388 3.56095 0.836461 4.21029 0.493921 4.94815C0.151381 5.68601 -0.0171317 6.49268 0.0013751 7.30596C0.0198819 8.11924 0.224914 8.91741 0.600663 9.63893C0.976412 10.3604 1.51284 10.986 2.16859 11.4674C2.82433 11.9489 3.58188 12.2733 4.38282 12.4156V13.4375H2.82032C2.57168 13.4375 2.33322 13.5363 2.15741 13.7121C1.98159 13.8879 1.88282 14.1264 1.88282 14.375C1.88282 14.6236 1.98159 14.8621 2.15741 15.0379C2.33322 15.2137 2.57168 15.3125 2.82032 15.3125H4.38282V16.5625C4.38282 16.8111 4.48159 17.0496 4.65741 17.2254C4.83322 17.4012 5.07168 17.5 5.32032 17.5C5.56896 17.5 5.80742 17.4012 5.98323 17.2254C6.15905 17.0496 6.25782 16.8111 6.25782 16.5625V15.3125H7.82032C8.06896 15.3125 8.30742 15.2137 8.48323 15.0379C8.65905 14.8621 8.75782 14.6236 8.75782 14.375C8.75782 14.1264 8.65905 13.8879 8.48323 13.7121C8.30742 13.5363 8.06896 13.4375 7.82032 13.4375H6.25782V12.4156C7.09685 12.266 7.8875 11.9164 8.56288 11.3966C9.23826 10.8767 9.77851 10.2019 10.1379 9.42911C10.4973 8.65632 10.6654 7.80834 10.6277 6.9569C10.5901 6.10545 10.348 5.27559 9.92188 4.5375L11.2578 3.20312V4.0625C11.2578 4.31114 11.3566 4.5496 11.5324 4.72541C11.7082 4.90123 11.9467 5 12.1953 5C12.444 5 12.6824 4.90123 12.8582 4.72541C13.034 4.5496 13.1328 4.31114 13.1328 4.0625V0.9375C13.1328 0.68886 13.034 0.450403 12.8582 0.274587C12.6824 0.0987721 12.444 0 12.1953 0ZM5.32032 10.625C4.64045 10.625 3.97584 10.4234 3.41055 10.0457C2.84525 9.66796 2.40466 9.1311 2.14448 8.50297C1.88431 7.87485 1.81623 7.18369 1.94887 6.51688C2.08151 5.85007 2.4089 5.23756 2.88964 4.75682C3.37038 4.27608 3.98289 3.94869 4.6497 3.81605C5.31651 3.68341 6.00767 3.75149 6.6358 4.01166C7.26392 4.27184 7.80078 4.71243 8.1785 5.27773C8.55621 5.84302 8.75782 6.50763 8.75782 7.1875C8.75679 8.09886 8.39429 8.97261 7.74986 9.61704C7.10543 10.2615 6.23169 10.624 5.32032 10.625Z"
      fill="#9A9A9A"
    />
  </svg>
)

function labelRow(
  Icon: IconType,
  label: string,
  extra?: React.ReactNode,
  mobile?: boolean,
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
    <div className={`flex items-center gap-2 ${mobile ? 'mb-1' : 'mb-1.5'}`}>
      <span
        className={`flex shrink-0 items-center justify-center ${mobile ? 'size-5 text-[#999]' : 'size-3.5 text-[#9a9a9a]'}`}
      >
        <Icon className={mobile ? 'size-5' : 'size-3.5'} strokeWidth={1.75} />
      </span>
      <span
        className={`font-medium ${mobile ? 'text-sm text-[#999]' : 'text-[13px] text-[#9a9a9a]'}`}
      >
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
  const isLg = useIsLg()
  const [step, setStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultFormData)
  const [savedMembers] = useState<FormData[]>([])
  const [expandedMemberIndex, setExpandedMemberIndex] = useState<number | null>(null)
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

  const primaryMember = savedMembers[0]

  const goNextFromPersonal = () => {
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
    if (!TEST_EMPLOYEE_IDS.has(normalizedEmployeeId) && getBookedEmployeeIds().has(normalizedEmployeeId)) {
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
    if (!form.relation.trim()) {
      logClientError('Relation is required.')
      return
    }

    setStep(2)
  }

  const goNextFromSchedule = () => {
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
    setAttemptedAddressContinue(true)
    const trimmedHouseNumber = form.houseNumber.trim()
    const trimmedStreet = form.street.trim()
    const trimmedLandmark = form.landmark.trim()
    const trimmedPincode = form.pincode.trim()
    const trimmedCity = form.city.trim()

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

    setStep(3)
  }

  const allMembers = useMemo(() => [...savedMembers, form], [savedMembers, form])

  const handleConfirmBooking = async () => {
    const normalizedEmployeeId = normalizeEmployeeId(form.employeeId)
    if (isSubmittingBooking) return

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
    if (!TEST_EMPLOYEE_IDS.has(normalizedEmployeeId) && getBookedEmployeeIds().has(normalizedEmployeeId)) {
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
    if (!form.appointmentTime) {
      logClientError('Please select a time slot.')
      return
    }

    const onboardAddress = buildOnboardAddress(form)
    const trimmedPincode = form.pincode.trim()
    const trimmedCity = form.city.trim()

    if (!onboardAddress) {
      logClientError('Address is required.')
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

    setIsSubmittingBooking(true)

    try {
      const wantsDoctorConsultation = form.personalizedDoctorConsultation === 'yes'

      const payload: OnboardUserForEngagementPayload = {
        age: safeAge,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        blood_collection_date: form.appointmentDate,
        blood_collection_time_slot: toApiTimeSlot(form.appointmentTime),
        participants_employee_id: normalizedEmployeeId,
        participant_blood_group: 'NA',
        want_doctor_consultation: wantsDoctorConsultation,
        address: onboardAddress,
        pincode: form.pincode,
        city: form.city,
        state: DEFAULT_ADDRESS_STATE,
        country: DEFAULT_ADDRESS_COUNTRY,
      }

      await onboardUserForEngagement(payload)
      markEmployeeIdAsBooked(normalizedEmployeeId)
      setStep(5)
    } catch (error) {
      logClientError(error instanceof Error ? error.message : 'Unable to confirm booking.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const desktopWelcomeTitle = 'Welcome to the world of Bio AI technology.'
  const desktopWelcomeSubtitle =
    'Book your Bio-marker sample collection & schedule your personalised doctor consultation.'

  const glassPanel =
    'rounded-[18px] border border-white/12 bg-black/18 shadow-[0_26px_70px_rgba(0,0,0,0.35)] backdrop-blur-[2px]'
  /** Mobile step 1: full-bleed on backdrop — no framed card/border (matches Figma). */
  const mobileStep1Layout = 'flex w-full flex-1 flex-col'

  const isMobile = !isLg
  const mobilePersonal = isMobile && step === 1
  const showBack = step === 5 ? false : isLg ? step > 1 : step > 1
  const stretchStepBody = !isLg || step === 4 || step === 5
  const hideGlobalContinue = mobilePersonal || step === 5 || step === 1
  const mobileHeader = isMobile
  const hideStepper = step === 5
  const showHeaderTitle = step !== 5

  return (
    <PageBackdrop>
      <div
        className={`mx-auto flex flex-col lg:max-w-none lg:min-h-svh lg:px-10 lg:py-14 ${
          mobilePersonal
            ? 'min-h-svh px-0 py-0'
            : isMobile
              ? 'min-h-svh px-0 py-0'
              : 'min-h-svh max-w-[980px] px-4 py-6 pb-24'
        }`}
      >
        {showHeaderTitle && (
          <div className="mt-4 mb-4 flex justify-center">
            <img src={supershyftWhiteLogo} alt="SuperShyft" className="h-[98px] w-[98px] object-contain" />
          </div>
        )}
        <div
          className={`flex min-h-0 flex-col ${mobilePersonal ? 'flex-1' : 'flex-1 lg:flex-none'} ${
            mobilePersonal
              ? mobileStep1Layout
              : isMobile
                ? 'w-full'
                : `${glassPanel} p-5 lg:relative lg:mx-auto lg:w-full lg:max-w-[970px] lg:p-7`
          }`}
        >
          {/* Header — Figma mobile: back | centered title | close */}
          <header
            className={
              mobileHeader
                ? 'grid grid-cols-[44px_1fr_44px] items-center gap-1 px-5 pt-5'
                : 'mb-6 grid grid-cols-[24px_1fr_24px] items-center gap-3 lg:mb-6 lg:gap-4'
            }
          >
            {mobileHeader ? (
              <>
                {showBack ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    className="flex size-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
                    aria-label="Back"
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                ) : (
                  <span aria-hidden />
                )}
                {showHeaderTitle ? (
                  <div className="min-w-0 w-full text-center">
                    <h1 className="w-full text-center text-[17px] font-semibold leading-tight tracking-tight text-white">
                      {desktopWelcomeTitle}
                    </h1>
                    <p className="mt-1 w-full text-center text-[12px] leading-normal text-[#cfcfcf]">
                      {desktopWelcomeSubtitle}
                    </p>
                  </div>
                ) : (
                  <span aria-hidden />
                )}
                <span aria-hidden />
              </>
            ) : (
              <>
                {showBack ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    className="flex size-6 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/10"
                    aria-label="Back"
                  >
                    <ArrowLeft className="size-5 lg:size-6" />
                  </button>
                ) : (
                  <span className="size-6 shrink-0" aria-hidden />
                )}
                {showHeaderTitle ? (
                  <div className="min-w-0 flex-1 text-center">
                    <h1 className="whitespace-nowrap text-[17px] font-semibold leading-none tracking-tight text-white">
                      {desktopWelcomeTitle}
                    </h1>
                    <p className="mt-2 text-[14px] font-normal leading-normal text-[#cfcfcf]">
                      {desktopWelcomeSubtitle}
                    </p>
                  </div>
                ) : (
                  <span aria-hidden />
                )}
                <span className="size-6 shrink-0" aria-hidden />
              </>
            )}
          </header>

          {!hideStepper && (
            <div
              className={
                mobilePersonal
                  ? 'mt-6 mb-[45px] shrink-0 px-5'
                  : isMobile
                    ? 'mt-6 mb-8 shrink-0 px-5'
                    : 'mb-8 px-1 lg:mx-auto lg:w-[600px] lg:px-0'
              }
            >
              <Stepper
                current={step}
                compact={!isLg}
                maxReachable={maxReachedStep}
                onStepClick={(target) => setStep(target)}
              />
            </div>
          )}

          {uiError ? (
            <div className={`mb-3 rounded-lg border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-3 py-2 text-sm text-[#ffd1d1] ${isMobile ? 'mx-5' : ''}`}>
              {uiError}
            </div>
          ) : null}

          <div
            className={`flex min-h-0 flex-col ${stretchStepBody ? 'flex-1' : 'flex-none'} ${
              mobilePersonal
                ? ''
                : isMobile
                  ? step === 5
                    ? 'px-5'
                    : 'px-5 pt-1'
                  : ''
            }`}
          >
            {step === 1 && (
              <>
                {mobilePersonal ? (
                  <div className="px-6">
                    <PersonalStep
                      form={form}
                      update={update}
                      isLg={isLg}
                      inputClass={inputClass}
                      labelRow={labelRow}
                      onContinue={goNextFromPersonal}
                      showMobileContinue
                      showMissingRequired={attemptedPersonalContinue}
                      savedMembers={savedMembers}
                      expandedMemberIndex={expandedMemberIndex}
                      onToggleMember={(i) =>
                        setExpandedMemberIndex((cur) => (cur === i ? null : i))
                      }
                      primaryMember={primaryMember}
                    />
                  </div>
                ) : (
                  <PersonalStep
                    form={form}
                    update={update}
                    isLg={isLg}
                    inputClass={inputClass}
                    labelRow={labelRow}
                    onContinue={goNextFromPersonal}
                    showMobileContinue
                    showMissingRequired={attemptedPersonalContinue}
                    savedMembers={savedMembers}
                    expandedMemberIndex={expandedMemberIndex}
                    onToggleMember={(i) =>
                      setExpandedMemberIndex((cur) => (cur === i ? null : i))
                    }
                    primaryMember={primaryMember}
                  />
                )}
              </>
            )}
            {step === 2 && (
              <AddressStep
                form={form}
                update={update}
                labelRow={labelRow}
                isMobile={isMobile}
                showMissingRequired={attemptedAddressContinue}
              />
            )}
            {step === 3 && (
              <ScheduleStep
                form={form}
                update={update}
                isMobile={isMobile}
                showMissingRequired={attemptedScheduleContinue}
              />
            )}
            {step === 4 && (
              <ConfirmStep
                form={form}
                members={allMembers}
                onEdit={(s) => setStep(s)}
                onProceed={handleConfirmBooking}
                isSubmitting={isSubmittingBooking}
              />
            )}
            {step === 5 && (
              <BookingConfirmedStep
                form={form}
                members={allMembers}
                isMobile={isMobile}
                onClose={() => setStep(1)}
              />
            )}
          </div>

          {mobilePersonal && step === 1 && null}

          {/* Footer CTA — mobile: full-width bar pinned to bottom with 30px safe-area; desktop: right-aligned pill */}
          {!hideGlobalContinue && (
            isMobile ? (
              step < 4 ? (
                <div className="mt-auto shrink-0 px-6 pt-4 pb-[30px]">
                  <ContinueButton
                    variant="mobileBar"
                    onClick={() => {
                      if (step === 1) goNextFromPersonal()
                      else if (step === 2) goNextFromAddress()
                      else goNextFromSchedule()
                    }}
                  >
                    Continue
                  </ContinueButton>
                </div>
              ) : null
            ) : (
              <div
                className={[
                  step < 4 ? 'mt-6 flex' : 'mt-auto flex pt-8',
                  'justify-end',
                ].join(' ')}
              >
                {step < 4 && (
                  <ContinueButton
                    onClick={() => {
                      if (step === 1) goNextFromPersonal()
                      else if (step === 2) goNextFromAddress()
                      else goNextFromSchedule()
                    }}
                  >
                    Continue
                  </ContinueButton>
                )}
              </div>
            )
          )}
        </div>
      </div>

    </PageBackdrop>
  )
}

const mobileFieldInput =
  'h-10 w-full rounded-lg border-0 bg-white/5 px-4 text-white outline-none ring-1 ring-transparent placeholder:text-[13px] placeholder:text-white/40 focus:ring-[#4b8d83]'
const mobileFieldInput14 = `${mobileFieldInput} text-[16px]`

function PersonalStep({
  form,
  update,
  isLg,
  inputClass,
  labelRow,
  onContinue,
  showMobileContinue,
  showMissingRequired,
  savedMembers,
  expandedMemberIndex,
  onToggleMember,
  primaryMember,
}: {
  form: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  isLg: boolean
  inputClass: (short?: boolean) => string
  labelRow: (
    Icon: IconType,
    label: string,
    extra?: React.ReactNode,
    mobile?: boolean,
    showRequired?: boolean,
    errorType?: 'missing' | 'invalid',
  ) => React.ReactNode
  onContinue: () => void
  showMobileContinue: boolean
  showMissingRequired?: boolean
  savedMembers: FormData[]
  expandedMemberIndex: number | null
  onToggleMember: (index: number) => void
  primaryMember?: FormData
}) {
  const hasSavedMembers = savedMembers.length > 0

  const phoneValue = hasSavedMembers && form.useSamePhone && primaryMember ? primaryMember.phone : form.phone
  const emailValue = hasSavedMembers && form.useSameEmail && primaryMember ? primaryMember.email : form.email

  const toggleUseSamePhone = (next: boolean) => {
    update('useSamePhone', next)
    if (next && primaryMember) update('phone', primaryMember.phone)
  }
  const toggleUseSameEmail = (next: boolean) => {
    update('useSameEmail', next)
    if (next && primaryMember) update('email', primaryMember.email)
  }

  const showRequired = Boolean(showMissingRequired)
  const isMissing = (value: string) => showRequired && !value.trim()
  const isMissingGender = showRequired && !form.gender
  const isMissingRelation = showRequired && !form.relation.trim()
  const fullNameError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.firstName.trim() || !form.lastName.trim()
      ? 'missing'
      : !NAME_REGEX.test(form.firstName.trim()) || !NAME_REGEX.test(form.lastName.trim())
        ? 'invalid'
        : undefined
  const phoneError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !phoneValue.trim()
      ? 'missing'
      : !/^\d{10}$/.test(phoneValue.trim())
        ? 'invalid'
        : undefined
  const emailError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !emailValue.trim()
      ? 'missing'
      : !EMAIL_REGEX.test(emailValue.trim())
        ? 'invalid'
        : undefined

  if (!isLg && hasSavedMembers) {
    const relationPillBase =
      'flex h-10 items-center justify-center rounded-full px-2 text-[13px] leading-none transition'
    const relationPillSelected =
      'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] text-white'
    const relationPillIdle = 'bg-white/5 text-[#9A9A9A]'

    return (
      <div className="flex min-h-0 flex-col gap-5 pb-2">
        <div className="flex flex-col gap-3">
          {savedMembers.map((m, i) => (
            <SavedMemberCard
              key={i}
              member={m}
              expanded={expandedMemberIndex === i}
              onToggle={() => onToggleMember(i)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            {labelRow(User, 'Full Name', undefined, true, Boolean(fullNameError), fullNameError)}
            <div className="flex gap-2">
              <input
                className={`${mobileFieldInput14} min-w-0 flex-1`}
                placeholder="First Name"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => update('firstName', sanitizeName(e.target.value))}
              />
              <input
                className={`${mobileFieldInput14} min-w-0 flex-1`}
                placeholder="Last Name"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => update('lastName', sanitizeName(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(GenderIcon, 'Gender', undefined, true, isMissingGender)}
            <div className="flex h-10 gap-6">
              <button
                type="button"
                onClick={() => update('gender', 'male')}
                className={[
                  'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs leading-4 transition',
                  form.gender === 'male'
                    ? 'bg-[radial-gradient(ellipse_at_center,_#11795f_0%,_#1c493d_100%)] text-white shadow-[0_0_12px_rgba(75,141,131,0.35)]'
                    : 'bg-white/5 text-[#999]',
                ].join(' ')}
              >
                <Mars className="size-3.5 shrink-0 opacity-90" strokeWidth={2} />
                Male
              </button>
              <button
                type="button"
                onClick={() => update('gender', 'female')}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-full px-2.5 py-1 text-xs leading-4 transition',
                  form.gender === 'female'
                    ? 'bg-[radial-gradient(ellipse_at_center,_#11795f_0%,_#1c493d_100%)] text-white shadow-[0_0_12px_rgba(75,141,131,0.35)]'
                    : 'bg-white/5 text-[#999]',
                ].join(' ')}
              >
                <Venus className="size-4 shrink-0 opacity-90" strokeWidth={2} />
                Female
              </button>
            </div>
          </div>


          <div className="flex flex-col gap-1">
            {labelRow(Users, 'Relation', undefined, true, isMissingRelation)}
            <div className="grid grid-cols-3 gap-2">
              {RELATION_OPTIONS.map((opt) => {
                const id = opt.toLowerCase()
                const selected = form.relation === id
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update('relation', id)}
                    className={[
                      relationPillBase,
                      selected ? relationPillSelected : relationPillIdle,
                    ].join(' ')}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(Calendar, 'Age', undefined, true, isMissing(form.age))}
            <input
              className={mobileFieldInput14}
              inputMode="numeric"
              placeholder="Age"
              maxLength={2}
              value={form.age}
              onChange={(e) => update('age', sanitizeAge(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(
              Phone,
              'Phone',
              <UseSameToggle
                checked={form.useSamePhone}
                onChange={toggleUseSamePhone}
                label="Same as before"
              />,
              true,
              Boolean(phoneError),
              phoneError,
            )}
            <input
              className={mobileFieldInput14}
              inputMode="tel"
              placeholder="+91 999999999"
              maxLength={10}
              disabled={form.useSamePhone}
              value={phoneValue}
              onChange={(e) => update('phone', sanitizePhone(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(
              Mail,
              'Email',
              <UseSameToggle checked={form.useSameEmail} onChange={toggleUseSameEmail} />,
              true,
              Boolean(emailError),
              emailError,
            )}
            <input
              className={mobileFieldInput14}
              type="email"
              inputMode="email"
              placeholder="Email"
              disabled={form.useSameEmail}
              value={emailValue}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>


          <div className="flex flex-col gap-1">
            {labelRow(EmployeeIdIcon, 'Employee ID', undefined, true, isMissing(form.employeeId))}
            <input
              className={mobileFieldInput14}
              placeholder="Employee ID"
              value={form.employeeId}
              onChange={(e) => update('employeeId', e.target.value)}
            />
          </div>

        </div>

      </div>
    )
  }

  if (!isLg) {
    return (
      <div className="flex min-h-0 flex-col gap-5 pb-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            {labelRow(User, 'Full Name', undefined, true, Boolean(fullNameError), fullNameError)}
            <div className="flex gap-2">
              <input
                className={`${mobileFieldInput14} min-w-0 flex-1`}
                placeholder="First Name"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => update('firstName', sanitizeName(e.target.value))}
              />
              <input
                className={`${mobileFieldInput14} min-w-0 flex-1`}
                placeholder="Last Name"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => update('lastName', sanitizeName(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(
              Phone,
              'Phone Number (Whatsapp)',
              undefined,
              true,
              Boolean(phoneError),
              phoneError,
            )}
            <input
              className={mobileFieldInput14}
              inputMode="tel"
              placeholder="Phone"
              maxLength={10}
              value={form.phone}
              onChange={(e) => update('phone', sanitizePhone(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(Mail, 'Email ID', undefined, true, Boolean(emailError), emailError)}
            <input
              className={mobileFieldInput14}
              type="email"
              inputMode="email"
              placeholder="Email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>


          <div className="flex flex-col gap-1">
            {labelRow(EmployeeIdIcon, 'Employee ID', undefined, true, isMissing(form.employeeId))}
            <input
              className={mobileFieldInput14}
              placeholder="Employee ID"
              value={form.employeeId}
              onChange={(e) => update('employeeId', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(Calendar, 'Age', undefined, true, isMissing(form.age))}
            <input
              className={mobileFieldInput14}
              inputMode="numeric"
              placeholder="Age"
              maxLength={2}
              value={form.age}
              onChange={(e) => update('age', sanitizeAge(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(GenderIcon, 'Gender', undefined, true, isMissingGender)}
            <div className="flex h-10 gap-6">
              <button
                type="button"
                onClick={() => update('gender', 'male')}
                className={[
                  'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs leading-4 transition',
                  form.gender === 'male'
                    ? 'bg-[radial-gradient(ellipse_at_center,_#11795f_0%,_#1c493d_100%)] text-white shadow-[0_0_12px_rgba(75,141,131,0.35)]'
                    : 'bg-white/5 text-[#999]',
                ].join(' ')}
              >
                <Mars className="size-3.5 shrink-0 opacity-90" strokeWidth={2} />
                Male
              </button>
              <button
                type="button"
                onClick={() => update('gender', 'female')}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-full px-2.5 py-1 text-xs leading-4 transition',
                  form.gender === 'female'
                    ? 'bg-[radial-gradient(ellipse_at_center,_#11795f_0%,_#1c493d_100%)] text-white shadow-[0_0_12px_rgba(75,141,131,0.35)]'
                    : 'bg-white/5 text-[#999]',
                ].join(' ')}
              >
                <Venus className="size-4 shrink-0 opacity-90" strokeWidth={2} />
                Female
              </button>
            </div>
          </div>


        </div>

        {showMobileContinue && (
          <div className="pb-4">
            <ContinueButton variant="mobileBar" onClick={onContinue}>
              Continue
            </ContinueButton>
          </div>
        )}
      </div>
    )
  }

  const genderButtons = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => update('gender', 'male')}
        className={[
          'flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[6px] text-sm text-[#9a9a9a]',
          form.gender === 'male'
            ? 'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] text-white'
            : 'bg-[linear-gradient(90deg,rgba(37,52,53,0.72)_0%,rgba(13,21,23,0.64)_100%)]',
        ].join(' ')}
      >
        <Mars className="size-4" />
        <span>Male</span>
      </button>
      <button
        type="button"
        onClick={() => update('gender', 'female')}
        className={[
          'flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[6px] text-sm',
          form.gender === 'female'
            ? 'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] text-white'
            : 'bg-[linear-gradient(90deg,rgba(37,52,53,0.72)_0%,rgba(13,21,23,0.64)_100%)] text-[#9a9a9a]',
        ].join(' ')}
      >
        <Venus className="size-4" />
        <span>Female</span>
      </button>
    </div>
  )


  if (hasSavedMembers) {
    return (
      <>
        <h2 className="mb-5 text-2xl font-medium text-white lg:text-[24px] lg:leading-none">
          Personal Information
        </h2>

        <div className="mb-6 flex flex-col gap-3">
          {savedMembers.map((m, i) => (
            <SavedMemberCard
              key={i}
              member={m}
              expanded={expandedMemberIndex === i}
              onToggle={() => onToggleMember(i)}
            />
          ))}
        </div>

        <div className="grid content-start gap-6 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6">
          <div>
            {labelRow(User, 'Full Name', undefined, false, Boolean(fullNameError), fullNameError)}
            <div className="flex gap-2">
              <input
                className={`${inputClass()} min-w-0 flex-1`}
                placeholder="First Name"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => update('firstName', sanitizeName(e.target.value))}
              />
              <input
                className={`${inputClass()} min-w-0 flex-1`}
                placeholder="Last Name"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => update('lastName', sanitizeName(e.target.value))}
              />
            </div>
          </div>

          <div>
            {labelRow(
              Phone,
              'Phone Number (Whatsapp)',
              <UseSameToggle
                checked={form.useSamePhone}
                onChange={toggleUseSamePhone}
              />,
              false,
              Boolean(phoneError),
              phoneError,
            )}
            <input
              className={inputClass()}
              placeholder="+91 999999999"
              inputMode="tel"
              maxLength={10}
              disabled={form.useSamePhone}
              value={phoneValue}
              onChange={(e) => update('phone', sanitizePhone(e.target.value))}
            />
          </div>

          <div>
            {labelRow(
              Mail,
              'Email',
              <UseSameToggle
                checked={form.useSameEmail}
                onChange={toggleUseSameEmail}
              />,
              false,
              Boolean(emailError),
              emailError,
            )}
            <input
              className={inputClass()}
              placeholder="Email"
              type="email"
              disabled={form.useSameEmail}
              value={emailValue}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>


          <div>
            {labelRow(EmployeeIdIcon, 'Employee ID', undefined, false, isMissing(form.employeeId))}
            <input
              className={inputClass()}
              placeholder="Employee ID"
              value={form.employeeId}
              onChange={(e) => update('employeeId', e.target.value)}
            />
          </div>

          <div>
            {labelRow(Calendar, 'Age', undefined, false, isMissing(form.age))}
            <input
              className={inputClass()}
              placeholder="Age"
              inputMode="numeric"
              maxLength={2}
              value={form.age}
              onChange={(e) => update('age', sanitizeAge(e.target.value))}
            />
          </div>

          <div>
            {labelRow(GenderIcon, 'Gender', undefined, false, isMissingGender)}
            {genderButtons}
          </div>


          <div>
            {labelRow(Users, 'Relation', undefined, false, isMissingRelation)}
            <div className="grid grid-cols-3 gap-3">
              {RELATION_OPTIONS.map((opt) => {
                const id = opt.toLowerCase()
                const selected = form.relation === id
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update('relation', id)}
                    className={[
                      'flex h-[44px] items-center justify-center gap-2 rounded-[6px] text-sm transition',
                      selected
                        ? 'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] text-white'
                        : 'bg-[linear-gradient(90deg,rgba(37,52,53,0.72)_0%,rgba(13,21,23,0.64)_100%)] text-[#9a9a9a]',
                    ].join(' ')}
                  >
                    <User className="size-3.5 opacity-80" strokeWidth={1.75} />
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>
          </div>

        </div>

        <div className="mt-4 flex justify-end">
          <ContinueButton onClick={onContinue}>Continue</ContinueButton>
        </div>
      </>
    )
  }

  return (
    <>
      <h2 className="mb-7 text-2xl font-medium text-white lg:text-[24px] lg:leading-none">
        Personal Information
      </h2>

      <div className="grid content-start gap-6 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6">
        <div>
          {labelRow(User, 'Full Name', undefined, false, Boolean(fullNameError), fullNameError)}
          <div className="flex gap-2">
            <input
              className={`${inputClass()} min-w-0 flex-1`}
              placeholder="First Name"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => update('firstName', sanitizeName(e.target.value))}
            />
            <input
              className={`${inputClass()} min-w-0 flex-1`}
              placeholder="Last Name"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => update('lastName', sanitizeName(e.target.value))}
            />
          </div>
        </div>

        <div>
          {labelRow(
            Phone,
            'Phone Number (Whatsapp)',
            undefined,
            false,
            Boolean(phoneError),
            phoneError,
          )}
          <input
            className={inputClass()}
            placeholder="Phone"
            inputMode="tel"
            maxLength={10}
            value={form.phone}
            onChange={(e) => update('phone', sanitizePhone(e.target.value))}
          />
        </div>

        <div>
          {labelRow(Mail, 'Email ID', undefined, false, Boolean(emailError), emailError)}
          <input
            className={inputClass()}
            placeholder="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>


        <div>
          {labelRow(EmployeeIdIcon, 'Employee ID', undefined, false, isMissing(form.employeeId))}
          <input
            className={inputClass()}
            placeholder="Employee ID"
            value={form.employeeId}
            onChange={(e) => update('employeeId', e.target.value)}
          />
        </div>

        <div>
          {labelRow(Calendar, 'Age', undefined, false, isMissing(form.age))}
          <input
            className={inputClass()}
            placeholder="Age"
            inputMode="numeric"
            maxLength={2}
            value={form.age}
            onChange={(e) => update('age', sanitizeAge(e.target.value))}
          />
        </div>

        <div>
          {labelRow(GenderIcon, 'Gender', undefined, false, isMissingGender)}
          {genderButtons}
        </div>


      </div>

      <div className="mt-4 flex justify-end">
        <ContinueButton onClick={onContinue}>Continue</ContinueButton>
      </div>
    </>
  )
}

function UseSameToggle({
  checked,
  onChange,
  label = 'Use Same',
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="ml-auto flex items-center gap-1.5 text-[12px] font-medium text-[#9a9a9a] transition hover:text-white/90"
    >
      <span>{label}</span>
      {checked ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.33333 2C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V3.33333C14 2.97971 13.8595 2.64057 13.6095 2.39052C13.3594 2.14048 13.0203 2 12.6667 2H3.33333ZM3.33333 3.33333H12.6667V12.6667H3.33333V3.33333ZM11.3 6.53C11.3637 6.4685 11.4145 6.39494 11.4494 6.3136C11.4843 6.23227 11.5027 6.14479 11.5035 6.05627C11.5043 5.96775 11.4874 5.87996 11.4539 5.79803C11.4204 5.7161 11.3709 5.64166 11.3083 5.57907C11.2457 5.51647 11.1712 5.46697 11.0893 5.43345C11.0074 5.39993 10.9196 5.38306 10.8311 5.38383C10.7425 5.3846 10.6551 5.40299 10.5737 5.43793C10.4924 5.47287 10.4188 5.52366 10.3573 5.58733L7.05733 8.88733L5.64333 7.47333C5.58144 7.41139 5.50795 7.36225 5.42706 7.32871C5.34617 7.29517 5.25947 7.2779 5.1719 7.27787C4.99506 7.2778 4.82543 7.34799 4.70033 7.473C4.57524 7.59801 4.50493 7.76758 4.50487 7.94443C4.5048 8.12128 4.57499 8.29091 4.7 8.416L6.53867 10.2547C6.60677 10.3228 6.68763 10.3768 6.77662 10.4137C6.86561 10.4506 6.961 10.4696 7.05733 10.4696C7.15367 10.4696 7.24905 10.4506 7.33805 10.4137C7.42704 10.3768 7.5079 10.3228 7.576 10.2547L11.3 6.53Z"
            fill="#9A9A9A"
          />
        </svg>
      ) : (
        <span
          className="size-4 rounded-[2px] border border-[#9A9A9A]/70"
          aria-hidden
        />
      )}
    </button>
  )
}

function AddressStep({
  form,
  update,
  labelRow,
  isMobile,
  showMissingRequired,
}: {
  form: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  labelRow: (
    Icon: IconType,
    label: string,
    extra?: React.ReactNode,
    mobile?: boolean,
    showRequired?: boolean,
    errorType?: 'missing' | 'invalid',
  ) => React.ReactNode
  isMobile: boolean
  showMissingRequired?: boolean
}) {
  const showRequired = Boolean(showMissingRequired)
  const isMissing = (value: string) => showRequired && !value.trim()
  const pincodeError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.pincode.trim()
      ? 'missing'
      : !/^\d{6}$/.test(form.pincode.trim())
        ? 'invalid'
        : undefined

  const fieldClass = isMobile ? mobileFieldInput : inputClass(true)

  return (
    <div className={`flex flex-col ${isMobile ? 'gap-6' : 'gap-5'}`}>
      <div className="flex flex-col gap-1">
        {labelRow(House, 'House No./ Building', undefined, isMobile, isMissing(form.houseNumber))}
        <input
          className={fieldClass}
          placeholder="350 A, Avenue Street"
          value={form.houseNumber}
          onChange={(e) => update('houseNumber', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Signpost, 'Area/ Street', undefined, isMobile, isMissing(form.street))}
        <input
          className={fieldClass}
          placeholder="Area/ Street"
          value={form.street}
          onChange={(e) => update('street', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Building2, 'Landmark', undefined, isMobile, isMissing(form.landmark))}
        <input
          className={fieldClass}
          placeholder="opp. Pink Salt Cafe"
          value={form.landmark}
          onChange={(e) => update('landmark', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(MapPinned, 'Pincode', undefined, isMobile, Boolean(pincodeError), pincodeError)}
        <input
          className={fieldClass}
          inputMode="numeric"
          placeholder="402201"
          maxLength={6}
          value={form.pincode}
          onChange={(e) => update('pincode', sanitizePincode(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(MapPin, 'City', undefined, isMobile, isMissing(form.city))}
        <input
          className={fieldClass}
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
  members,
  onEdit,
  onProceed,
  isSubmitting,
}: {
  form: FormData
  members: FormData[]
  onEdit: (step: number) => void
  onProceed: () => void
  isSubmitting: boolean
}) {
  const primary = members[0] ?? form
  const fullAddress = [form.houseNumber, form.street].filter(Boolean).join(', ')
  return (
    <div className="flex flex-col gap-3">
      <h2 className="mb-1 text-[18px] font-semibold text-white">Confirm Details</h2>

      <section className="rounded-[8px] bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
          <h3 className="text-[15px] font-semibold text-white">Personal Information</h3>
          <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(1)}>
            Edit
          </button>
        </div>
        <MemberSummary member={primary} showRelation={false} dense />
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
          <SummaryItem Icon={Phone} label={form.appointmentTime || '—'} dense />
        </div>
      </section>

      <ContinueButton
        className="mt-3 w-full max-w-none"
        showChevron={false}
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
        <SummaryItem Icon={EmployeeIdIcon} label={member.employeeId || '—'} dense={dense} />
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

type UpcomingDate = { iso: string; day: string; date: number }

function getMayDates(): UpcomingDate[] {
  const pad = (n: number) => String(n).padStart(2, '0')
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  base.setDate(base.getDate() + 2)
  return Array.from({ length: 4 }, (_, index) => {
    const d = new Date(base)
    d.setDate(base.getDate() + index)
    return {
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      day: DAY_LABELS[d.getDay()],
      date: d.getDate(),
    }
  })
}

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
  isMobile,
  showMissingRequired,
}: {
  form: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  isMobile: boolean
  showMissingRequired?: boolean
}) {
  const dates = useMemo(() => getMayDates(), [])
  const timeSlots = [
    '06:00 AM',
    '07:00 AM',
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
  ]

  const selectedDateClass =
    'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] border-transparent'
  const idleDateClass = 'border-white/[0.08] bg-white/5'

  const sectionLabelClass = isMobile
    ? 'font-sans text-[14px] font-medium leading-normal text-[#9A9A9A]'
    : 'text-[24px] font-medium leading-none text-white'

  return (
    <div className={`flex flex-col items-start self-stretch ${isMobile ? 'gap-6' : 'gap-9'}`}>
      <section className={`flex flex-col items-start self-stretch ${isMobile ? 'gap-3' : 'gap-6'}`}>
        {isMobile ? (
          <div className="flex items-center gap-2">
            <PreferredDateIcon />
            <h2 className={sectionLabelClass}>
              Preferred Date
              {showMissingRequired && !form.appointmentDate ? (
                <span className="text-[#ff6b6b]"> * Field is required</span>
              ) : null}
            </h2>
          </div>
        ) : (
          <h2 className={sectionLabelClass}>
            Preferred Date
            {showMissingRequired && !form.appointmentDate ? (
              <span className="text-[#ff6b6b]"> * Field is required</span>
            ) : null}
          </h2>
        )}
        <div
          className={
            isMobile
              ? 'grid w-full grid-cols-4 gap-2 self-stretch'
              : 'flex h-[79px] items-center gap-6 self-stretch overflow-x-auto lg:overflow-visible'
          }
        >
          {dates.map((d) => {
            const selected = form.appointmentDate === d.iso
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => update('appointmentDate', d.iso)}
                aria-pressed={selected}
                className={[
                  isMobile
                    ? 'flex h-[75px] w-full flex-col items-center justify-center gap-1 rounded-[6px] border transition'
                    : 'flex aspect-[85/78] h-[78px] w-[85px] shrink-0 flex-col items-center justify-center gap-1 rounded-[6px] border px-[18.39px] transition',
                  selected ? selectedDateClass : idleDateClass,
                ].join(' ')}
              >
                <span
                  className={[
                    'font-sans text-[12px] font-medium leading-none',
                    selected ? 'text-white' : 'text-[#cccccc]/80',
                  ].join(' ')}
                >
                  {d.day}
                </span>
                <span
                  className={[
                    'font-sans text-[18px] font-semibold leading-none',
                    selected ? 'text-white' : 'text-[#cccccc]/80',
                  ].join(' ')}
                >
                  {d.date}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className={`flex flex-col items-start self-stretch ${isMobile ? 'gap-3' : 'gap-6'}`}>
        <div className="flex items-center gap-2">
          <PreferredTimeSlotIcon />
          <div className="flex flex-col gap-1">
            <h2 className={sectionLabelClass}>
              Preferred Time Slot
              {showMissingRequired && !form.appointmentTime ? (
                <span className="text-[#ff6b6b]"> * Field is required</span>
              ) : null}
            </h2>
            <p className="text-[10px] font-light text-[#ccc]">Collection window is of 1 hour</p>
          </div>
        </div>
        <div className={isMobile ? 'grid w-full grid-cols-3 gap-2' : 'grid w-full grid-cols-3 gap-4'}>
          {timeSlots.map((slot) => {
            const selected = form.appointmentTime === slot
            return (
              <button
                key={slot}
                type="button"
                onClick={() => update('appointmentTime', slot)}
                aria-pressed={selected}
                className={[
                  isMobile
                    ? 'flex h-10 w-full items-center justify-center rounded-full border text-[13px] transition'
                    : 'flex h-[44px] w-full items-center justify-center rounded-[6px] border text-sm transition',
                  selected ? selectedDateClass : idleDateClass,
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

/** Set to `true` to show the “Download the App” button on the success step. */
const SHOW_BOOKING_CONFIRM_APP_CTA = true

function BookingConfirmedStep({
  form,
  members,
  isMobile,
  onClose,
}: {
  form: FormData
  members: FormData[]
  isMobile: boolean
  onClose: () => void
}) {
  const memberNames = members
    .map((m) => [m.firstName, m.lastName].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ')
  const bookingDate = formatBookingDate(form.appointmentDate)
  const bookingDateTime = `${bookingDate} | ${form.appointmentTime || '—'}`
  const bookingId = [form.employeeId?.trim(), form.appointmentDate?.replaceAll('-', '')]
    .filter(Boolean)
    .join('-') || 'XYZ123'
  const locationLabel = [form.city?.trim(), 'Mumbai'].filter(Boolean).join(', ')

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center self-stretch">
        <div className="flex w-full items-center justify-end px-1 pb-8">
          <h2 className="mx-auto text-[20px] font-semibold leading-none text-white">Book Appointment</h2>
          <button
            type="button"
            aria-label="Close"
            className="text-[28px] leading-none text-white"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="flex w-full flex-col items-center gap-12">
          <div
            className="flex size-[80px] items-center justify-center rounded-full border border-[#90DF9E] bg-black/20 shadow-[0_1px_10px_0_#90DF9E]"
            aria-hidden
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="26" viewBox="0 0 45 32" fill="none">
              <path
                d="M42.9998 1.66699L14.5832 30.0837L1.6665 17.167"
                stroke="#4B8D83"
                strokeWidth="3.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="text-center font-sans text-[16px] font-medium leading-normal text-[#90DF9E]">
            Booking Confirmed!
          </h2>

          <div className="flex w-full flex-col items-center gap-5 self-stretch rounded-[8px] border border-[#90DF9E]/20 bg-[#4B8D83]/10 px-[25px] py-[25px]">
            <div className="flex flex-col items-center">
              <p className="text-[14px] text-[#9A9A9A]">Booking ID</p>
              <p className="max-w-[280px] truncate text-[20px] font-bold leading-[28px] text-white">{bookingId}</p>
            </div>
            <div className="flex w-full flex-col items-start gap-4">
              <InfoRow icon={<CalendarIcon />} label="Date & Time" value={bookingDateTime} isMobile />
              <InfoRow icon={<UserIcon />} label="Member Name" value={memberNames || '—'} isMobile />
              <InfoRow icon={<LocationIcon />} label="Location" value={locationLabel} isMobile />
            </div>
          </div>
          <p className="text-center text-[14px] text-[#CCC]">⚠️ Don’t miss the call from our collection team</p>
        </div>

        {SHOW_BOOKING_CONFIRM_APP_CTA ? (
          <div className="mt-auto flex w-full flex-col items-center gap-3 pb-[30px] pt-10">
            <a
              href="https://app.supershyft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[36px] border border-[#969696] bg-gradient-to-r from-[#296359] to-[#41AB99] px-6 py-2.5 text-center text-[16px] font-bold text-white shadow-[0_12px_20px_0_rgba(255,255,255,0.15)] transition hover:brightness-110"
            >
              Download the App
            </a>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center self-stretch">
      <div className="flex w-full max-w-[760px] flex-col items-center gap-6 pb-10">
        <div
          className="flex size-[100px] items-center justify-center rounded-full border border-[#90DF9E] bg-black/20 shadow-[0_1px_10px_0_#90DF9E]"
          aria-hidden
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="45" height="32" viewBox="0 0 45 32" fill="none">
            <path
              d="M42.9998 1.66699L14.5832 30.0837L1.6665 17.167"
              stroke="#4B8D83"
              strokeWidth="3.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="text-center font-sans text-[24px] font-semibold leading-none text-[#4B8D83]">
          Booking Confirmed!
        </h2>

        <div className="flex w-full max-w-[520px] flex-col items-center gap-5 rounded-[8px] border border-[#90DF9E]/20 bg-[#4B8D83]/10 p-6">
          <div className="flex flex-col items-center">
            <p className="text-[14px] text-[#9A9A9A]">Booking ID</p>
            <p className="max-w-[360px] truncate text-[24px] font-bold leading-none text-white">{bookingId}</p>
          </div>
          <div className="flex w-full flex-col items-start gap-4">
            <InfoRow icon={<CalendarIcon />} label="Date & Time" value={bookingDateTime} />
            <InfoRow icon={<UserIcon />} label="Member Name" value={memberNames || '—'} />
            <InfoRow icon={<LocationIcon />} label="Location" value={locationLabel} />
          </div>
        </div>
        <p className="text-center text-[16px] text-[#CCC]">⚠️ Don’t miss the call from our collection team</p>
      </div>

      {SHOW_BOOKING_CONFIRM_APP_CTA ? (
        <>
          <a
            href="https://app.supershyft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-[10px] flex h-[52px] w-full max-w-[320px] items-center justify-center gap-2 rounded-[36px] border border-[#969696] bg-gradient-to-r from-[#296359] to-[#41AB99] px-6 py-2.5 text-center text-[16px] font-bold text-white shadow-[0_12px_20px_0_rgba(255,255,255,0.15)] transition hover:brightness-110"
          >
            Download the App
          </a>
        </>
      ) : null}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  isMobile = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  isMobile?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col self-stretch">
      <span
        className={[
          isMobile
            ? 'pl-[36px] font-sans text-[10px] font-normal leading-normal text-[#9A9A9A]'
            : 'pl-8 text-[12px] font-normal leading-none text-[#9A9A9A]',
        ].join(' ')}
      >
        {label}
      </span>
      <div className={isMobile ? 'mt-1 flex items-center gap-3' : 'mt-1 flex items-center gap-3'}>
        <span
          className={isMobile ? 'flex size-[20px] shrink-0 items-center justify-center' : 'flex size-5 shrink-0 items-center justify-center'}
          aria-hidden
        >
          {icon}
        </span>
        <span
          className={isMobile ? 'min-w-0 font-sans text-[15px] font-medium leading-normal text-[#CCC]' : 'min-w-0 truncate text-[15px] font-medium leading-normal text-[#CCC]'}
        >
          {value}
        </span>
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

