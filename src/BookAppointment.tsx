import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Home,
  Mail,
  MapPin,
  Mars,
  Phone,
  User,
  Users,
  Venus,
  X,
} from 'lucide-react'
import { ContinueButton } from './components/ContinueButton'
import { formatPreferredDateLabel, parseIsoDate } from './lib/bookingDates'
import { PreferredDateCalendar } from './components/PreferredDateCalendar'
import {
  onboardUserForEngagement,
  type OnboardUserForEngagementPayload,
} from './api/onboard'
// import { resendBookingOtp, sendBookingOtp, verifyBookingOtp } from './api/otp'
import { createEmployeeUser } from './api/users'
import { isFrontendOnly } from './lib/frontendOnly'
import { PageBackdrop } from './components/PageBackdrop'
import { Stepper } from './components'
import { lookupPincode } from './lib/pincodeLookup'
import {
  defaultAdditionalMemberForm,
  defaultFormData,
  formatBookingAddress,
  type AdditionalMemberForm,
  type FormData,
} from './types'
// import { OtpVerifyStep } from './components/OtpVerifyStep'
import bookingSuccessGif from './assets/animation-gif.gif'
import superShyftLogo from './assets/SuperShyft - Logo [Final]-03 7 (1).svg'
import streetSignIcon from './assets/figma/street-sign-line.svg'
import locationFillIcon from './assets/figma/location-fill.svg'
import preferredDateIcon from './assets/figma/preferred-date-icon.svg'
import preferredTimeIcon from './assets/figma/preferred-time-icon.svg'
import addMemberUsersIcon from './assets/figma/add-member-users.svg'
import memberCheckIcon from './assets/figma/member-check.svg'

const RELATION_OPTIONS = [
  'Parent',
  'Sibling',
  'Spouse',
  'Child',
  'Grandparent',
  'Other',
] as const

const TIME_SLOTS = [
  '06:00 - 07:00 AM',
  '07:00 - 08:00 AM',
  '08:00 - 09:00 AM',
  '09:00 - 10:00 AM',
  '10:00 - 11:00 AM',
  '11:00 - 12:00 PM',
  '12:00 - 01:00 PM',
  '01:00 - 02:00 PM',
] as const

const SELECTED_CHIP_BG =
  'bg-[radial-gradient(ellipse_at_center,_#11795f_0%,_#1c493d_100%)] text-white'

const ENFORCE_REQUIRED_FIELDS = true
const NAME_REGEX = /^[A-Za-z]+(?:[ .'-]+[A-Za-z]+)*$/
const PHONE_REGEX = /^[6-9]\d{9}$/
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const AGE_REGEX = /^(?:1[89]|[2-9]\d)$/
const PINCODE_REGEX = /^\d{6}$/
const sanitizeName = (value: string) => value.replace(/[^A-Za-z .'-]/g, '').replace(/\s+/g, ' ')
const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 10)
const sanitizeAge = (value: string) => value.replace(/\D/g, '').slice(0, 2)
const sanitizeEmail = (value: string) => value.replace(/\s/g, '')
const sanitizePincode = (value: string) => value.replace(/\D/g, '').slice(0, 6)
const sanitizeAddressLine = (value: string) => value.replace(/\s+/g, ' ').slice(0, 120)
const BOOK_APPOINTMENT_ERROR_EVENT = 'book-appointment:error'
const logClientError = (message: string) => {
  console.error(`[BookAppointment] ${message}`)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BOOK_APPOINTMENT_ERROR_EVENT, { detail: message }))
  }
}

function generateEmployeeIdForApi(): string {
  return `HRM${Date.now()}`
}

function bookingAge(form: Pick<FormData, 'age'>, fallback = 25): number {
  const parsed = Number.parseInt(form.age, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function additionalMemberToFormData(
  additional: AdditionalMemberForm,
  primary: FormData,
): FormData {
  return {
    ...primary,
    firstName: additional.firstName,
    lastName: additional.lastName,
    phone: additional.phone,
    email: additional.email,
    age: additional.age,
    gender: additional.gender,
    houseNo: additional.houseNo,
    areaStreet: additional.areaStreet,
    landmark: additional.landmark,
    pincode: additional.pincode,
    city: additional.city,
    state: additional.state || primary.state,
    appointmentDate: additional.appointmentDate,
    appointmentTime: additional.appointmentTime,
  }
}

function buildOnboardPayload(
  form: FormData,
  employeeId: string,
): OnboardUserForEngagementPayload {
  const address = formatBookingAddress(form) || 'NA'
  return {
    age: bookingAge(form),
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    gender: form.gender || 'male',
    address,
    pincode: form.pincode.trim() || '000000',
    city: form.city.trim() || 'NA',
    state: form.state.trim() || 'Maharashtra',
    country: 'India',
    blood_collection_date: form.appointmentDate,
    blood_collection_time_slot: toApiTimeSlot(form.appointmentTime),
    participants_employee_id: employeeId,
    participant_blood_group: 'NA',
    want_doctor_consultation: false,
  }
}

/** Convert UI slots like "09:30 AM" to API "09:00" / "13:00" hour form. */
function toApiTimeSlot(slot: string): string {
  const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`
  const normalized = slot.trim()
  if (!normalized) return '09:00'
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (match) {
    let hour = Number.parseInt(match[1], 10)
    const meridiem = match[3].toUpperCase()
    if (meridiem === 'PM' && hour !== 12) hour += 12
    if (meridiem === 'AM' && hour === 12) hour = 0
    return formatHour(hour)
  }
  const firstPart = normalized.split('-')[0]?.trim() || normalized
  const hour = Number.parseInt(firstPart.split(':')[0] || '', 10)
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return '09:00'
  return formatHour(hour)
}

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>

function FigmaIcon({
  src,
  className,
}: {
  src: string
  className?: string
  strokeWidth?: number
}) {
  return (
    <span className={`inline-flex size-5 shrink-0 overflow-clip ${className ?? ''}`}>
      <img src={src} alt="" width={20} height={20} className="size-full object-contain" />
    </span>
  )
}

function StreetSignIcon({ className }: { className?: string; strokeWidth?: number }) {
  return <FigmaIcon src={streetSignIcon} className={className} />
}

function LocationFillIcon({ className }: { className?: string; strokeWidth?: number }) {
  return <FigmaIcon src={locationFillIcon} className={className} />
}

function PreferredDateIcon({ className }: { className?: string; strokeWidth?: number }) {
  return <FigmaIcon src={preferredDateIcon} className={className} />
}

function PreferredTimeIcon({ className }: { className?: string; strokeWidth?: number }) {
  return <FigmaIcon src={preferredTimeIcon} className={className} />
}

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
        ? 'Invalid input'
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
  const [additionalMember, setAdditionalMember] = useState<AdditionalMemberForm>(
    defaultAdditionalMemberForm,
  )
  const [attemptedAdditionalContinue, setAttemptedAdditionalContinue] = useState(false)
  const [attemptedAdditionalAddressContinue, setAttemptedAdditionalAddressContinue] = useState(false)
  const [bookingDisplayId, setBookingDisplayId] = useState('')
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [uiError, setUiError] = useState('')
  const [attemptedPersonalContinue, setAttemptedPersonalContinue] = useState(false)
  const [attemptedAddressContinue, setAttemptedAddressContinue] = useState(false)
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false)
  const [isLookingUpAdditionalPincode, setIsLookingUpAdditionalPincode] = useState(false)
  // const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  // const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [hasCreatedUser, setHasCreatedUser] = useState(false)
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [hasCreatedAdditionalUser, setHasCreatedAdditionalUser] = useState(false)
  const [hasOnboardedAdditional, setHasOnboardedAdditional] = useState(false)
  // const [otpVerified, setOtpVerified] = useState(false)

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    if (uiError) setUiError('')
    setForm((f) => ({ ...f, [key]: value }))
  }, [uiError])

  const updateAdditional = useCallback(
    <K extends keyof AdditionalMemberForm>(key: K, value: AdditionalMemberForm[K]) => {
      if (uiError) setUiError('')
      const addressKeys: (keyof AdditionalMemberForm)[] = [
        'houseNo',
        'areaStreet',
        'landmark',
        'pincode',
        'city',
        'state',
      ]
      setAdditionalMember((f) => ({
        ...f,
        [key]: value,
        ...(addressKeys.includes(key) ? { useSameAddress: false } : {}),
      }))
    },
    [uiError],
  )

  const applySameAddressAsPrimary = useCallback(
    (checked: boolean) => {
      if (uiError) setUiError('')
      if (!checked) {
        setAdditionalMember((f) => ({ ...f, useSameAddress: false }))
        return
      }
      setAdditionalMember((f) => ({
        ...f,
        useSameAddress: true,
        houseNo: form.houseNo,
        areaStreet: form.areaStreet,
        landmark: form.landmark,
        pincode: form.pincode,
        city: form.city,
        state: form.state,
      }))
    },
    [form.areaStreet, form.city, form.houseNo, form.landmark, form.pincode, form.state, uiError],
  )

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
      logClientError('First name is required.')
      return
    }
    if (!NAME_REGEX.test(trimmedFirstName)) {
      logClientError('Invalid input for first name.')
      return
    }
    if (!trimmedLastName) {
      logClientError('Last name is required.')
      return
    }
    if (!NAME_REGEX.test(trimmedLastName)) {
      logClientError('Invalid input for last name.')
      return
    }
    if (!trimmedPhone) {
      logClientError('Phone is required.')
      return
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      logClientError('Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.')
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
    if (!trimmedAge) {
      logClientError('Age is required.')
      return
    }
    if (!AGE_REGEX.test(trimmedAge)) {
      logClientError('Enter a valid age between 18 and 99.')
      return
    }
    if (!form.gender) {
      logClientError('Gender is required.')
      return
    }

    setUiError('')
    setStep(2)
  }

  const goNextFromAddress = () => {
    if (!ENFORCE_REQUIRED_FIELDS) {
      setUiError('')
      setStep(3)
      return
    }

    const trimmedHouse = form.houseNo.trim()
    const trimmedArea = form.areaStreet.trim()
    const trimmedPincode = form.pincode.trim()
    const trimmedCity = form.city.trim()
    setAttemptedAddressContinue(true)

    if (!trimmedHouse) {
      logClientError('House No./ Building is required.')
      return
    }
    if (!trimmedArea) {
      logClientError('Area/ Street is required.')
      return
    }
    if (!trimmedPincode) {
      logClientError('Pincode is required.')
      return
    }
    if (!PINCODE_REGEX.test(trimmedPincode)) {
      logClientError('Enter a valid 6-digit pincode.')
      return
    }
    if (!trimmedCity) {
      logClientError('City is required.')
      return
    }

    setUiError('')
    setStep(3)
  }

  const goNextFromSchedule = () => {
    if (!form.appointmentDate) {
      logClientError('Please select a preferred date.')
      return
    }
    if (!form.appointmentTime) {
      logClientError('Please select a preferred time slot.')
      return
    }
    setUiError('')
    setStep(4)
  }

  const goNextFromAddMember = () => {
    setUiError('')
    setStep(5)
  }

  const skipAdditionalMember = () => {
    setAdditionalMember(defaultAdditionalMemberForm)
    setAttemptedAdditionalContinue(false)
    setAttemptedAdditionalAddressContinue(false)
    setHasCreatedAdditionalUser(false)
    setHasOnboardedAdditional(false)
    setUiError('')
    setStep(8)
  }

  const goNextFromAdditionalMember = () => {
    if (!ENFORCE_REQUIRED_FIELDS) {
      setUiError('')
      setStep(6)
      return
    }

    const trimmedFirst = additionalMember.firstName.trim()
    const trimmedLast = additionalMember.lastName.trim()
    const trimmedPhone = additionalMember.phone.trim()
    const trimmedEmail = additionalMember.email.trim()
    const trimmedAge = additionalMember.age.trim()
    setAttemptedAdditionalContinue(true)

    if (!trimmedFirst) {
      logClientError('First name is required.')
      return
    }
    if (!NAME_REGEX.test(trimmedFirst)) {
      logClientError('Invalid input for first name.')
      return
    }
    if (!trimmedLast) {
      logClientError('Last name is required.')
      return
    }
    if (!NAME_REGEX.test(trimmedLast)) {
      logClientError('Invalid input for last name.')
      return
    }
    if (!trimmedPhone) {
      logClientError('Phone is required.')
      return
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      logClientError('Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.')
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
    if (!trimmedAge) {
      logClientError('Age is required.')
      return
    }
    if (!AGE_REGEX.test(trimmedAge)) {
      logClientError('Enter a valid age between 18 and 99.')
      return
    }
    if (!additionalMember.gender) {
      logClientError('Gender is required.')
      return
    }

    setUiError('')
    setStep(6)
  }

  const goNextFromAdditionalAddress = () => {
    if (!ENFORCE_REQUIRED_FIELDS) {
      setUiError('')
      setStep(7)
      return
    }

    const trimmedHouse = additionalMember.houseNo.trim()
    const trimmedArea = additionalMember.areaStreet.trim()
    const trimmedPincode = additionalMember.pincode.trim()
    const trimmedCity = additionalMember.city.trim()
    setAttemptedAdditionalAddressContinue(true)

    if (!trimmedHouse) {
      logClientError('House No./ Building is required.')
      return
    }
    if (!trimmedArea) {
      logClientError('Area/ Street is required.')
      return
    }
    if (!trimmedPincode) {
      logClientError('Pincode is required.')
      return
    }
    if (!PINCODE_REGEX.test(trimmedPincode)) {
      logClientError('Enter a valid 6-digit pincode.')
      return
    }
    if (!trimmedCity) {
      logClientError('City is required.')
      return
    }

    setUiError('')
    setStep(7)
  }

  const goNextFromAdditionalSchedule = () => {
    if (!additionalMember.appointmentDate) {
      logClientError('Please select a preferred date.')
      return
    }
    if (!additionalMember.appointmentTime) {
      logClientError('Please select a preferred time slot.')
      return
    }
    setUiError('')
    setStep(8)
  }

  const handlePincodeChange = async (value: string) => {
    const pincode = sanitizePincode(value)

    if (!PINCODE_REGEX.test(pincode)) {
      setForm((f) => ({
        ...f,
        pincode,
        ...(f.city || f.state ? { city: '', state: '' } : {}),
      }))
      if (uiError) setUiError('')
      return
    }

    setForm((f) => ({ ...f, pincode }))
    if (uiError) setUiError('')
    setIsLookingUpPincode(true)
    try {
      const location = await lookupPincode(pincode)
      if (location) {
        setForm((f) => ({
          ...f,
          pincode,
          city: location.city,
          state: location.state,
        }))
      }
    } catch {
      // Lookup is best-effort; user can still type city manually.
    } finally {
      setIsLookingUpPincode(false)
    }
  }

  const handleAdditionalPincodeChange = async (value: string) => {
    const pincode = sanitizePincode(value)

    if (!PINCODE_REGEX.test(pincode)) {
      setAdditionalMember((f) => ({
        ...f,
        pincode,
        useSameAddress: false,
        ...(f.city || f.state ? { city: '', state: '' } : {}),
      }))
      if (uiError) setUiError('')
      return
    }

    setAdditionalMember((f) => ({ ...f, pincode, useSameAddress: false }))
    if (uiError) setUiError('')
    setIsLookingUpAdditionalPincode(true)
    try {
      const location = await lookupPincode(pincode)
      if (location) {
        setAdditionalMember((f) => ({
          ...f,
          pincode,
          city: location.city,
          state: location.state,
          useSameAddress: false,
        }))
      }
    } catch {
      // Lookup is best-effort; user can still type city manually.
    } finally {
      setIsLookingUpAdditionalPincode(false)
    }
  }

  // const handleVerifyOtp = async (otp: string) => {
  //   if (isVerifyingOtp) return
  //
  //   setUiError('')
  //   setIsVerifyingOtp(true)
  //
  //   const openHealthAssessment = async () => {
  //     const accessToken = getAccessToken()
  //     const result = await loadAssessmentCategoriesForStep2(accessToken)
  //     setAssessmentInstanceId(result.assessmentInstanceId)
  //     setAssessmentCategories(result.categories)
  //     setCompletedCategoryIds(
  //       result.categories
  //         .filter((category) => isCategoryCompleted(category, []))
  //         .map((category) => Number(category.category_id)),
  //     )
  //     setStep(9)
  //   }
  //
  //   try {
  //     if (!otpVerified) {
  //       await verifyBookingOtp({ phone: form.phone.trim() }, otp)
  //       setOtpVerified(true)
  //     }
  //
  //     if (!hasOnboarded) {
  //       const apiEmployeeId = bookingDisplayId.replace(/\s/g, '') || generateEmployeeIdForApi()
  //       const onboardResult = await onboardUserForEngagement(buildOnboardPayload(form, apiEmployeeId))
  //       setHasOnboarded(true)
  //       setBookingDisplayId(apiEmployeeId)
  //
  //       if (onboardResult.alreadyEnrolled) {
  //         try {
  //           await openHealthAssessment()
  //         } catch (error) {
  //           logClientError(
  //             error instanceof Error ? error.message : 'Unable to load health assessment.',
  //           )
  //         }
  //         return
  //       }
  //     }
  //
  //     setStep(6)
  //   } catch (error) {
  //     logClientError(error instanceof Error ? error.message : 'Unable to verify OTP.')
  //   } finally {
  //     setIsVerifyingOtp(false)
  //   }
  // }
  //
  // const handleResendOtp = async () => {
  //   if (isResendingOtp || isVerifyingOtp) return
  //
  //   setUiError('')
  //   setIsResendingOtp(true)
  //
  //   try {
  //     await resendBookingOtp({ phone: form.phone.trim() })
  //   } catch (error) {
  //     logClientError(error instanceof Error ? error.message : 'Unable to resend OTP.')
  //   } finally {
  //     setIsResendingOtp(false)
  //   }
  // }

  const handleConfirmBooking = async () => {
    if (isSubmittingBooking) return

    const trimmedPhone = form.phone.trim()
    const trimmedEmail = form.email.trim()
    const trimmedAge = form.age.trim()
    const parsedAge = Number.parseInt(form.age, 10)
    const safeAge = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : NaN
    const hasAdditional = Boolean(
      additionalMember.firstName.trim() || additionalMember.lastName.trim(),
    )

    if (ENFORCE_REQUIRED_FIELDS) {
      if (!form.firstName.trim()) {
        logClientError('First name is required.')
        return
      }
      if (!NAME_REGEX.test(form.firstName.trim())) {
        logClientError('Invalid input for first name.')
        return
      }
      if (!form.lastName.trim()) {
        logClientError('Last name is required.')
        return
      }
      if (!NAME_REGEX.test(form.lastName.trim())) {
        logClientError('Invalid input for last name.')
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
      if (!form.gender) {
        logClientError('Gender is required.')
        return
      }
      if (!AGE_REGEX.test(trimmedAge) || !Number.isFinite(safeAge)) {
        logClientError('Enter a valid age between 18 and 99.')
        return
      }
      if (!form.appointmentDate) {
        logClientError('Please select a schedule date.')
        return
      }
      if (!form.houseNo.trim()) {
        logClientError('House No./ Building is required.')
        return
      }
      if (!form.areaStreet.trim()) {
        logClientError('Area/ Street is required.')
        return
      }
      if (!PINCODE_REGEX.test(form.pincode.trim())) {
        logClientError('Enter a valid 6-digit pincode.')
        return
      }
      if (!form.city.trim()) {
        logClientError('City is required.')
        return
      }
    }

    if (!trimmedPhone) {
      logClientError('Phone is required.')
      return
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      logClientError('Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.')
      return
    }

    if (!isFrontendOnly()) {
      if (!form.gender) {
        logClientError('Gender is required.')
        return
      }
      if (!Number.isFinite(safeAge)) {
        logClientError('Age is required.')
        return
      }
    }

    setUiError('')
    setIsSubmittingBooking(true)

    const submitMember = async (
      memberForm: FormData,
      flags: { created: boolean; onboarded: boolean },
      markCreated: () => void,
      markOnboarded: () => void,
      preferredEmployeeId?: string,
    ) => {
      const memberAge = bookingAge(memberForm)
      const memberEmail = EMAIL_REGEX.test(memberForm.email.trim())
        ? memberForm.email.trim()
        : null

      if (!flags.created) {
        await createEmployeeUser({
          age: memberAge,
          phone: memberForm.phone.trim(),
          first_name: memberForm.firstName.trim() || null,
          last_name: memberForm.lastName.trim() || null,
          email: memberEmail,
          gender: memberForm.gender || null,
          address: formatBookingAddress(memberForm) || 'NA',
          pin_code: memberForm.pincode.trim() || '000000',
          city: memberForm.city.trim() || 'NA',
          state: memberForm.state.trim() || 'Maharashtra',
          country: 'India',
          is_participant: true,
          status: 'active',
        })
        markCreated()
      }

      if (!flags.onboarded) {
        const apiEmployeeId =
          preferredEmployeeId?.replace(/\s/g, '') || generateEmployeeIdForApi()
        const onboardResult = await onboardUserForEngagement(
          buildOnboardPayload(memberForm, apiEmployeeId),
        )
        markOnboarded()
        return { apiEmployeeId, alreadyEnrolled: Boolean(onboardResult.alreadyEnrolled) }
      }

      return {
        apiEmployeeId: preferredEmployeeId?.replace(/\s/g, '') || '',
        alreadyEnrolled: false,
      }
    }

    try {
      const primaryResult = await submitMember(
        form,
        { created: hasCreatedUser, onboarded: hasOnboarded },
        () => setHasCreatedUser(true),
        () => setHasOnboarded(true),
        bookingDisplayId,
      )
      if (primaryResult.apiEmployeeId) {
        setBookingDisplayId(primaryResult.apiEmployeeId)
      }

      if (hasAdditional) {
        const additionalForm = additionalMemberToFormData(additionalMember, form)
        await submitMember(
          additionalForm,
          { created: hasCreatedAdditionalUser, onboarded: hasOnboardedAdditional },
          () => setHasCreatedAdditionalUser(true),
          () => setHasOnboardedAdditional(true),
        )
      }

      setStep(9)
    } catch (error) {
      logClientError(error instanceof Error ? error.message : 'Unable to confirm booking.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const mobileScreenTitle = 'Book Appointment'

  const showBack = step > 1 && step !== 9
  const hideGlobalContinue = step === 4 || step === 8 || step === 9
  const hideStepper = step >= 9
  const confirmStepperBorder = step === 4 || step === 5 || step === 6 || step === 7 || step === 8

  const handleStepContinue = () => {
    if (step === 1) goNextFromPersonal()
    else if (step === 2) goNextFromAddress()
    else if (step === 3) goNextFromSchedule()
    else if (step === 5) goNextFromAdditionalMember()
    else if (step === 6) goNextFromAdditionalAddress()
    else if (step === 7) goNextFromAdditionalSchedule()
  }

  const continueVariant = 'mobileBarCompact' as const

  return (
    <PageBackdrop fullBleed={step === 4}>
      <div className="flex h-full min-w-0 flex-col">
        {/* Header — Figma: p-20px */}
        <header className="grid shrink-0 grid-cols-[32px_1fr_32px] items-center p-5">
          {showBack ? (
            <button
              type="button"
              onClick={() =>
                setStep((s) => {
                  if (s === 9) return 8
                  return Math.max(1, s - 1)
                })
              }
              className="flex size-8 items-center justify-start text-white"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" strokeWidth={2} />
            </button>
          ) : (
            <span className="size-8" aria-hidden />
          )}
          <div className="flex items-center justify-center gap-2.5">
            <img
              src={superShyftLogo}
              alt="SuperShyft"
              width={44}
              height={44}
              decoding="async"
              className="h-11 w-11 shrink-0 object-contain"
              style={{ imageRendering: 'auto' }}
            />
            <h1 className="text-[20px] font-semibold leading-6 text-white">
              {mobileScreenTitle}
            </h1>
          </div>
          <span className="size-8" aria-hidden />
        </header>

        {hideStepper ? null : (
          <div
            className={
              confirmStepperBorder
                ? 'shrink-0 border-b border-[rgba(154,154,154,0.1)] px-5 pb-5'
                : 'shrink-0 px-5'
            }
          >
            <Stepper
              current={step === 5 ? 1 : step === 6 ? 2 : step === 7 ? 3 : step}
              maxReachable={step === 5 ? 1 : step === 6 ? 2 : step === 7 ? 3 : maxReachedStep}
              onStepClick={(target) => {
                if (step === 5 || step === 6 || step === 7) return
                setStep(target)
              }}
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
            step === 4
              ? 'min-h-0 flex-1 px-0 pb-0 pt-0'
              : step === 9
              ? 'flex min-h-0 min-w-0 flex-1 flex-col justify-between px-6 pb-6 pt-4'
              : 'px-6 pb-4 pt-8'
          }`}
        >
          {step === 4 ? (
            <AddMemberStep
              form={form}
              onContinue={goNextFromAddMember}
              onSkip={skipAdditionalMember}
            />
          ) : (
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                onPincodeChange={handlePincodeChange}
                isLookingUpPincode={isLookingUpPincode}
                showMissingRequired={ENFORCE_REQUIRED_FIELDS && attemptedAddressContinue}
              />
            )}
            {step === 3 && (
              <ScheduleStep form={form} update={update} labelRow={labelRow} />
            )}
            {step === 5 && (
              <AdditionalMemberPersonalStep
                primary={form}
                form={additionalMember}
                update={updateAdditional}
                labelRow={labelRow}
                showMissingRequired={ENFORCE_REQUIRED_FIELDS && attemptedAdditionalContinue}
              />
            )}
            {step === 6 && (
              <AdditionalMemberAddressStep
                primary={form}
                form={additionalMember}
                update={updateAdditional}
                onUseSameChange={applySameAddressAsPrimary}
                labelRow={labelRow}
                onPincodeChange={handleAdditionalPincodeChange}
                isLookingUpPincode={isLookingUpAdditionalPincode}
                showMissingRequired={ENFORCE_REQUIRED_FIELDS && attemptedAdditionalAddressContinue}
              />
            )}
            {step === 7 && (
              <AdditionalMemberScheduleStep
                primary={form}
                form={additionalMember}
                update={updateAdditional}
                labelRow={labelRow}
              />
            )}
            {step === 8 && (
              <ConfirmStep
                form={form}
                additionalMember={additionalMember}
                onEdit={(s) => {
                  setHasCreatedUser(false)
                  setHasOnboarded(false)
                  setHasCreatedAdditionalUser(false)
                  setHasOnboardedAdditional(false)
                  // setOtpVerified(false)
                  setStep(s)
                }}
                onProceed={handleConfirmBooking}
                isSubmitting={isSubmittingBooking}
              />
            )}
            {/* OTP step commented out — previously step 5 */}
            {step === 9 && (
              <BookingConfirmedStep form={form} additionalMember={additionalMember} />
            )}
          </div>
          )}

          {step === 9 ? (
            <ContinueButton
              variant="mobileBar"
              className="mt-6 !h-[52px] w-full shrink-0 border border-[#969696] shadow-[0_12px_20px_rgba(255,255,255,0.15)]"
              showChevron={false}
              onClick={() => {
                window.location.assign('https://app.supershyft.com/')
              }}
            >
              Install SuperShyft
            </ContinueButton>
          ) : !hideGlobalContinue ? (
            <div className="mt-3 shrink-0">
              <ContinueButton
                variant={continueVariant}
                onClick={handleStepContinue}
              >
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
  'booking-field-input h-10 w-full rounded-[8px] border border-transparent bg-white/5 px-4 text-[16px] font-normal outline-none focus:border-[#4b8d83]'

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
      : !PHONE_REGEX.test(form.phone.trim())
        ? 'invalid'
        : undefined
  const emailError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.email.trim()
      ? 'missing'
      : !EMAIL_REGEX.test(form.email.trim())
        ? 'invalid'
        : undefined
  const ageError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.age.trim()
      ? 'missing'
      : !AGE_REGEX.test(form.age.trim())
        ? 'invalid'
        : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        {labelRow(User, 'Full Name', undefined, Boolean(fullNameError), fullNameError)}
        <div className="flex gap-2">
          <input
            className={`${mobileFieldInput} min-w-0 flex-1`}
            placeholder="First Name"
            autoComplete="given-name"
            autoCapitalize="words"
            pattern="[A-Za-z]+([ .'-]+[A-Za-z]+)*"
            maxLength={40}
            value={form.firstName}
            onChange={(e) => update('firstName', sanitizeName(e.target.value))}
          />
          <input
            className={`${mobileFieldInput} min-w-0 flex-1`}
            placeholder="Last Name"
            autoComplete="family-name"
            autoCapitalize="words"
            pattern="[A-Za-z]+([ .'-]+[A-Za-z]+)*"
            maxLength={40}
            value={form.lastName}
            onChange={(e) => update('lastName', sanitizeName(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Phone, 'Phone', undefined, Boolean(phoneError), phoneError)}
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="Phone Number"
          pattern="[6-9][0-9]{9}"
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
          placeholder="Email"
          autoComplete="email"
          pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
          value={form.email}
          onChange={(e) => update('email', sanitizeEmail(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Calendar, 'Age', undefined, Boolean(ageError), ageError)}
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="Age"
          pattern="(?:1[89]|[2-9][0-9])"
          title="Age must be between 18 and 99"
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
            <Mars className="size-4 shrink-0" strokeWidth={2} />
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
            <Venus className="size-4 shrink-0" strokeWidth={2} />
            Female
          </button>
        </div>
      </div>
    </div>
  )
}

function AddressStep({
  form,
  update,
  labelRow,
  onPincodeChange,
  isLookingUpPincode,
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
  onPincodeChange: (value: string) => void
  isLookingUpPincode: boolean
  showMissingRequired?: boolean
}) {
  const showRequired = Boolean(showMissingRequired)
  const houseError: 'missing' | undefined = showRequired && !form.houseNo.trim() ? 'missing' : undefined
  const areaError: 'missing' | undefined = showRequired && !form.areaStreet.trim() ? 'missing' : undefined
  const pincodeError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.pincode.trim()
      ? 'missing'
      : !PINCODE_REGEX.test(form.pincode.trim())
        ? 'invalid'
        : undefined
  const cityError: 'missing' | undefined = showRequired && !form.city.trim() ? 'missing' : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        {labelRow(Home, 'House No./ Building', undefined, Boolean(houseError), houseError)}
        <input
          className={mobileFieldInput}
          placeholder="350 A, Avenue Street"
          autoComplete="address-line1"
          maxLength={120}
          value={form.houseNo}
          onChange={(e) => update('houseNo', sanitizeAddressLine(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(StreetSignIcon, 'Area/ Street', undefined, Boolean(areaError), areaError)}
        <input
          className={mobileFieldInput}
          placeholder="350 A, Avenue Street"
          autoComplete="address-line2"
          maxLength={120}
          value={form.areaStreet}
          onChange={(e) => update('areaStreet', sanitizeAddressLine(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Building2, 'Landmark')}
        <input
          className={mobileFieldInput}
          placeholder="opp. Pink Salt Cafe"
          maxLength={120}
          value={form.landmark}
          onChange={(e) => update('landmark', sanitizeAddressLine(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(LocationFillIcon, 'Pincode', undefined, Boolean(pincodeError), pincodeError)}
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="402 201"
          pattern="[0-9]{6}"
          maxLength={6}
          value={form.pincode}
          onChange={(e) => onPincodeChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(
          MapPin,
          'City',
          isLookingUpPincode ? (
            <span className="text-[11px] font-medium text-[#4b8d83]">Looking up…</span>
          ) : undefined,
          Boolean(cityError),
          cityError,
        )}
        <input
          className={mobileFieldInput}
          placeholder="Mumbai"
          autoComplete="address-level2"
          maxLength={80}
          value={form.city}
          onChange={(e) => update('city', sanitizeAddressLine(e.target.value))}
        />
      </div>
    </div>
  )
}

function AdditionalMemberPersonalStep({
  primary,
  form,
  update,
  labelRow,
  showMissingRequired,
}: {
  primary: FormData
  form: AdditionalMemberForm
  update: <K extends keyof AdditionalMemberForm>(key: K, value: AdditionalMemberForm[K]) => void
  labelRow: (
    Icon: IconType,
    label: string,
    extra?: React.ReactNode,
    showRequired?: boolean,
    errorType?: 'missing' | 'invalid',
  ) => React.ReactNode
  showMissingRequired?: boolean
}) {
  const [primaryExpanded, setPrimaryExpanded] = useState(false)
  const primaryName =
    [primary.firstName, primary.lastName].filter(Boolean).join(' ') || 'Member'
  const primaryGenderLabel = primary.gender
    ? primary.gender.charAt(0).toUpperCase() + primary.gender.slice(1)
    : '—'
  const PrimaryGenderIcon = primary.gender === 'female' ? Venus : Mars
  const showRequired = Boolean(showMissingRequired)
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
      : !PHONE_REGEX.test(form.phone.trim())
        ? 'invalid'
        : undefined
  const emailError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.email.trim()
      ? 'missing'
      : !EMAIL_REGEX.test(form.email.trim())
        ? 'invalid'
        : undefined
  const ageError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.age.trim()
      ? 'missing'
      : !AGE_REGEX.test(form.age.trim())
        ? 'invalid'
        : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full flex-col gap-1.5 rounded-[8px] border border-[rgba(144,223,158,0.2)] bg-[rgba(75,141,131,0.2)] p-3">
        <button
          type="button"
          onClick={() => setPrimaryExpanded((open) => !open)}
          className="flex w-full items-start gap-3 text-left"
          aria-expanded={primaryExpanded}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/5 text-[#90df9e]">
            <User className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-normal leading-none text-[#c4c4c4]">
              {primaryName}
            </p>
            <p className="mt-1 text-[8px] font-normal leading-none text-[#90df9e]">
              Personal Information Saved
            </p>
          </div>
          {primaryExpanded ? (
            <ChevronUp className="mt-0.5 size-[15px] shrink-0 text-[#90df9e]" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronDown className="mt-0.5 size-[15px] shrink-0 text-[#90df9e]" strokeWidth={2} aria-hidden />
          )}
        </button>

        {primaryExpanded ? (
          <>
            <div className="h-px w-full bg-[rgba(154,154,154,0.35)]" aria-hidden />
            <div className="flex w-full flex-col gap-3 pt-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-[#ccc]">
                <SummaryItem Icon={User} label={primaryName} dense />
                <SummaryItem Icon={PrimaryGenderIcon} label={primaryGenderLabel} dense />
                <SummaryItem Icon={Phone} label={primary.phone || '—'} dense />
                <SummaryItem
                  Icon={Calendar}
                  label={primary.age ? `${primary.age} Years` : '—'}
                  dense
                />
              </div>
              <SummaryItem Icon={Mail} label={primary.email || '—'} dense />
            </div>
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(User, 'Full Name', undefined, Boolean(fullNameError), fullNameError)}
        <div className="flex gap-2">
          <input
            className={`${mobileFieldInput} min-w-0 flex-1`}
            placeholder="First name"
            autoComplete="given-name"
            autoCapitalize="words"
            pattern="[A-Za-z]+([ .'-]+[A-Za-z]+)*"
            maxLength={40}
            value={form.firstName}
            onChange={(e) => update('firstName', sanitizeName(e.target.value))}
          />
          <input
            className={`${mobileFieldInput} min-w-0 flex-1`}
            placeholder="Last Name"
            autoComplete="family-name"
            autoCapitalize="words"
            pattern="[A-Za-z]+([ .'-]+[A-Za-z]+)*"
            maxLength={40}
            value={form.lastName}
            onChange={(e) => update('lastName', sanitizeName(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Phone, 'Phone', undefined, Boolean(phoneError), phoneError)}
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="+91 9999999999"
          pattern="[6-9][0-9]{9}"
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
          pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
          value={form.email}
          onChange={(e) => update('email', sanitizeEmail(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        {labelRow(Calendar, 'Age', undefined, Boolean(ageError), ageError)}
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="24"
          pattern="(?:1[89]|[2-9][0-9])"
          title="Age must be between 18 and 99"
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
            <Mars className="size-4 shrink-0" strokeWidth={2} />
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
            <Venus className="size-4 shrink-0" strokeWidth={2} />
            Female
          </button>
        </div>
      </div>
    </div>
  )
}

function AdditionalMemberAddressStep({
  primary,
  form,
  update,
  onUseSameChange,
  labelRow,
  onPincodeChange,
  isLookingUpPincode,
  showMissingRequired,
}: {
  primary: FormData
  form: AdditionalMemberForm
  update: <K extends keyof AdditionalMemberForm>(key: K, value: AdditionalMemberForm[K]) => void
  onUseSameChange: (checked: boolean) => void
  labelRow: (
    Icon: IconType,
    label: string,
    extra?: React.ReactNode,
    showRequired?: boolean,
    errorType?: 'missing' | 'invalid',
  ) => React.ReactNode
  onPincodeChange: (value: string) => void
  isLookingUpPincode: boolean
  showMissingRequired?: boolean
}) {
  const [primaryExpanded, setPrimaryExpanded] = useState(true)
  const primaryName =
    [primary.firstName, primary.lastName].filter(Boolean).join(' ') || 'Member'
  const showRequired = Boolean(showMissingRequired)
  const houseError: 'missing' | undefined = showRequired && !form.houseNo.trim() ? 'missing' : undefined
  const areaError: 'missing' | undefined = showRequired && !form.areaStreet.trim() ? 'missing' : undefined
  const pincodeError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : !form.pincode.trim()
      ? 'missing'
      : !PINCODE_REGEX.test(form.pincode.trim())
        ? 'invalid'
        : undefined
  const cityError: 'missing' | undefined = showRequired && !form.city.trim() ? 'missing' : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full flex-col gap-1.5 rounded-[8px] border border-[rgba(144,223,158,0.2)] bg-[rgba(75,141,131,0.2)] p-3">
        <button
          type="button"
          onClick={() => setPrimaryExpanded((open) => !open)}
          className="flex w-full items-start gap-3 text-left"
          aria-expanded={primaryExpanded}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/5 text-[#90df9e]">
            <User className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-normal leading-none text-[#c4c4c4]">
              {primaryName}
            </p>
            <p className="mt-1 text-[8px] font-normal leading-none text-[#90df9e]">
              Personal Information Saved
            </p>
          </div>
          {primaryExpanded ? (
            <ChevronUp className="mt-0.5 size-[15px] shrink-0 text-[#90df9e]" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronDown className="mt-0.5 size-[15px] shrink-0 text-[#90df9e]" strokeWidth={2} aria-hidden />
          )}
        </button>

        {primaryExpanded ? (
          <>
            <div className="h-px w-full bg-[rgba(154,154,154,0.35)]" aria-hidden />
            <div className="flex w-full flex-col gap-3 pt-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-[#ccc]">
                <SummaryItem Icon={Home} label={primary.houseNo || '—'} dense />
                <SummaryItem Icon={LocationFillIcon} label={primary.pincode || '—'} dense />
                <SummaryItem Icon={StreetSignIcon} label={primary.areaStreet || '—'} dense />
                <SummaryItem Icon={MapPin} label={primary.city || '—'} dense />
              </div>
              <SummaryItem Icon={Building2} label={primary.landmark || '—'} dense />
            </div>
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-semibold text-white">Address</h3>
          <button
            type="button"
            onClick={() => onUseSameChange(!form.useSameAddress)}
            className="flex shrink-0 items-center gap-1"
            aria-pressed={form.useSameAddress}
          >
            <span className="text-[12px] font-medium text-[#fafafa]">Use same</span>
            <span
              className={[
                'flex size-4 items-center justify-center rounded-[3px] border',
                form.useSameAddress
                  ? 'border-[#90df9e] bg-[#90df9e] text-[#0a1f1c]'
                  : 'border-[#9a9a9a] bg-transparent text-transparent',
              ].join(' ')}
              aria-hidden
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {labelRow(Home, 'House No./ Building', undefined, Boolean(houseError), houseError)}
          <input
            className={mobileFieldInput}
            placeholder="350 A"
            autoComplete="address-line1"
            maxLength={120}
            value={form.houseNo}
            onChange={(e) => update('houseNo', sanitizeAddressLine(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1">
          {labelRow(StreetSignIcon, 'Area/ Street', undefined, Boolean(areaError), areaError)}
          <input
            className={mobileFieldInput}
            placeholder="Avenue Street"
            autoComplete="address-line2"
            maxLength={120}
            value={form.areaStreet}
            onChange={(e) => update('areaStreet', sanitizeAddressLine(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1">
          {labelRow(Building2, 'Landmark')}
          <input
            className={mobileFieldInput}
            placeholder="opp. Pink Salt Cafe"
            maxLength={120}
            value={form.landmark}
            onChange={(e) => update('landmark', sanitizeAddressLine(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1">
          {labelRow(LocationFillIcon, 'Pincode', undefined, Boolean(pincodeError), pincodeError)}
          <input
            className={mobileFieldInput}
            inputMode="numeric"
            placeholder="402 201"
            pattern="[0-9]{6}"
            maxLength={6}
            value={form.pincode}
            onChange={(e) => onPincodeChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          {labelRow(
            MapPin,
            'City',
            isLookingUpPincode ? (
              <span className="text-[11px] font-medium text-[#4b8d83]">Looking up…</span>
            ) : undefined,
            Boolean(cityError),
            cityError,
          )}
          <input
            className={mobileFieldInput}
            placeholder="Mumbai"
            autoComplete="address-level2"
            maxLength={80}
            value={form.city}
            onChange={(e) => update('city', sanitizeAddressLine(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}

function formatScheduleBannerDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
}

function formatScheduleBannerTime(slot: string): string {
  if (!slot) return '—'
  const start = slot.split('-')[0]?.trim()
  if (!start) return slot
  const meridiem = slot.includes('PM') ? 'PM' : slot.includes('AM') ? 'AM' : ''
  const normalized = start.replace(/^0/, '')
  return meridiem ? `${normalized} ${meridiem}` : normalized
}

function PreferredDatePicker({
  value,
  onChange,
  labelRow,
}: {
  value: string
  onChange: (iso: string) => void
  labelRow: (
    Icon: IconType,
    label: string,
    extra?: React.ReactNode,
    showRequired?: boolean,
    errorType?: 'missing' | 'invalid',
  ) => React.ReactNode
}) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const hasDate = Boolean(parseIsoDate(value))
  const displayLabel = hasDate ? formatPreferredDateLabel(value) : 'Select date'

  return (
    <div className="flex flex-col gap-3">
      {labelRow(PreferredDateIcon, 'Preferred Date')}
      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-[8px] border border-[rgba(154,154,154,0.35)] bg-white/5 px-4 text-left transition hover:border-[rgba(154,154,154,0.55)]"
        aria-label={hasDate ? `Preferred date ${displayLabel}, change date` : 'Choose preferred date'}
      >
        <span
          className={[
            'truncate text-[14px] font-normal leading-none',
            hasDate ? 'text-white' : 'text-[rgba(255,255,255,0.6)]',
          ].join(' ')}
        >
          {displayLabel}
        </span>
        <ChevronRight className="size-4 shrink-0 text-white" strokeWidth={2} aria-hidden />
      </button>
      <PreferredDateCalendar
        open={calendarOpen}
        value={value}
        onClose={() => setCalendarOpen(false)}
        onConfirm={onChange}
      />
    </div>
  )
}

function AdditionalMemberScheduleStep({
  primary,
  form,
  update,
  labelRow,
}: {
  primary: FormData
  form: AdditionalMemberForm
  update: <K extends keyof AdditionalMemberForm>(key: K, value: AdditionalMemberForm[K]) => void
  labelRow: (
    Icon: IconType,
    label: string,
    extra?: React.ReactNode,
    showRequired?: boolean,
    errorType?: 'missing' | 'invalid',
  ) => React.ReactNode
}) {
  const [primaryExpanded, setPrimaryExpanded] = useState(true)
  const primaryName =
    [primary.firstName, primary.lastName].filter(Boolean).join(' ') || 'Member'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full flex-col gap-1.5 rounded-[8px] border border-[rgba(144,223,158,0.2)] bg-[rgba(75,141,131,0.2)] p-3">
        <button
          type="button"
          onClick={() => setPrimaryExpanded((open) => !open)}
          className="flex w-full items-start gap-3 text-left"
          aria-expanded={primaryExpanded}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/5 text-[#90df9e]">
            <User className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-normal leading-none text-[#c4c4c4]">
              {primaryName}
            </p>
            <p className="mt-1 text-[8px] font-normal leading-none text-[#90df9e]">
              Personal Information Saved
            </p>
          </div>
          {primaryExpanded ? (
            <ChevronUp className="mt-0.5 size-[15px] shrink-0 text-[#90df9e]" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronDown className="mt-0.5 size-[15px] shrink-0 text-[#90df9e]" strokeWidth={2} aria-hidden />
          )}
        </button>

        {primaryExpanded ? (
          <>
            <div className="h-px w-full bg-[rgba(154,154,154,0.35)]" aria-hidden />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1 text-[11px] text-[#ccc]">
              <SummaryItem
                Icon={Calendar}
                label={formatScheduleBannerDate(primary.appointmentDate)}
                dense
              />
              <SummaryItem
                Icon={Clock}
                label={formatScheduleBannerTime(primary.appointmentTime)}
                dense
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        <PreferredDatePicker
          value={form.appointmentDate}
          onChange={(iso) => update('appointmentDate', iso)}
          labelRow={labelRow}
        />

        <div className="flex flex-col gap-3 pb-2">
          <div className="flex flex-col gap-1">
            {labelRow(PreferredTimeIcon, 'Preferred Time Slot')}
            <p className="pl-7 text-[10px] font-light leading-normal text-[#ccc]">
              Collection window is of 1 hour
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 px-1">
            {TIME_SLOTS.map((slot) => {
              const selected = form.appointmentTime === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => update('appointmentTime', slot)}
                  className={[
                    'flex h-10 items-center justify-center rounded-full px-2.5 text-[14px] font-medium transition',
                    selected ? SELECTED_CHIP_BG : 'bg-white/5 text-[rgba(154,154,154,0.8)]',
                  ].join(' ')}
                >
                  {slot}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddMemberStep({
  form,
  onContinue,
  onSkip,
}: {
  form: FormData
  onContinue: () => void
  onSkip: () => void
}) {
  const memberName =
    [form.firstName, form.lastName].filter(Boolean).join(' ') || 'Member'

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col rounded-t-[24px] border-t border-[#9a9a9a] bg-[rgba(0,0,0,0.5)] px-6 pb-6 pt-5">
      <button
        type="button"
        onClick={onSkip}
        aria-label="Skip adding another member"
        className="absolute right-5 top-5 z-10 flex size-8 items-center justify-center rounded-full text-white transition hover:bg-white/10"
      >
        <X className="size-5" strokeWidth={2} />
      </button>

      <div className="mx-auto mb-10 h-0.5 w-[50px] shrink-0 rounded-full bg-[#9a9a9a]" aria-hidden />

      <div className="mx-auto flex min-h-0 w-full max-w-[360px] flex-1 flex-col items-center justify-between lg:max-w-[480px] xl:max-w-[520px]">
        <div className="flex w-full flex-col items-center">
          <div className="mb-1 flex size-[70px] items-center justify-center rounded-full border-2 border-[#4b8d83]">
            <img
              src={addMemberUsersIcon}
              alt=""
              width={32}
              height={32}
              className="size-8 object-contain"
            />
          </div>

          <div className="w-full px-5 py-5">
            <div className="flex w-full items-center justify-between rounded-[6px] border border-[rgba(144,223,158,0.2)] bg-[rgba(75,141,131,0.2)] p-3">
              <p className="text-[15px] font-medium leading-none text-white">{memberName}</p>
              <img
                src={memberCheckIcon}
                alt=""
                width={26}
                height={26}
                className="size-[26px] shrink-0 object-contain"
                aria-hidden
              />
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-1.5 px-1">
            <h2 className="text-center text-[20px] font-semibold leading-6 text-white">
              Add Another Member
            </h2>
            <p className="max-w-[260px] text-center text-[14px] leading-[21px] text-[#9a9a9a]">
              Book this health assessment for your family to avail the 1+1 Bio-AI offer.
            </p>
          </div>
        </div>

        <ContinueButton
          variant="mobileBar"
          className="mt-8 !h-[52px] w-full shrink-0 border border-[#969696] shadow-[0_12px_10px_rgba(255,255,255,0.15)]"
          onClick={onContinue}
        >
          Continue
        </ContinueButton>
      </div>
    </div>
  )
}

function ScheduleStep({
  form,
  update,
  labelRow,
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
}) {
  return (
    <div className="flex flex-col gap-6">
      <PreferredDatePicker
        value={form.appointmentDate}
        onChange={(iso) => update('appointmentDate', iso)}
        labelRow={labelRow}
      />

      <div className="flex flex-col gap-3 pb-2">
        <div className="flex flex-col gap-1">
          {labelRow(PreferredTimeIcon, 'Preferred Time Slot')}
          <p className="pl-7 text-[10px] font-light leading-normal text-[#ccc]">
            Collection window is of 1 hour
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 px-1">
          {TIME_SLOTS.map((slot) => {
            const selected = form.appointmentTime === slot
            return (
              <button
                key={slot}
                type="button"
                onClick={() => update('appointmentTime', slot)}
                className={[
                  'flex h-10 items-center justify-center rounded-full px-2.5 text-[14px] font-medium transition',
                  selected ? SELECTED_CHIP_BG : 'bg-white/5 text-[rgba(154,154,154,0.8)]',
                ].join(' ')}
              >
                {slot}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ConfirmStep({
  form,
  additionalMember,
  onEdit,
  onProceed,
  isSubmitting,
}: {
  form: FormData
  additionalMember: AdditionalMemberForm
  onEdit: (step: number) => void
  onProceed: () => void
  isSubmitting: boolean
}) {
  const primaryName = [form.firstName, form.lastName].filter(Boolean).join(' ') || '—'
  const additionalName =
    [additionalMember.firstName, additionalMember.lastName].filter(Boolean).join(' ') || '—'
  const hasAdditional = Boolean(
    additionalMember.firstName.trim() || additionalMember.lastName.trim(),
  )
  const primaryGenderLabel = form.gender
    ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1)
    : '—'
  const additionalGenderLabel = additionalMember.gender
    ? additionalMember.gender.charAt(0).toUpperCase() + additionalMember.gender.slice(1)
    : '—'
  const PrimaryGenderIcon = form.gender === 'female' ? Venus : Mars
  const AdditionalGenderIcon = additionalMember.gender === 'female' ? Venus : Mars
  const addressLine =
    [form.houseNo, form.areaStreet].map((p) => p.trim()).filter(Boolean).join(', ') || '—'
  const relationLabel =
    RELATION_OPTIONS.find((o) => o.toLowerCase() === form.relation) ?? form.relation

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[18px] font-semibold text-white">Confirm Details</h2>

      <section className="flex w-full flex-col gap-3.5 rounded-[8px] bg-white/5 p-3">
        <div className="border-b border-white/20 pb-1.5">
          <h3 className="text-[15px] font-semibold text-white">Personal Information</h3>
        </div>

        <div className="relative flex flex-col gap-3 pr-10">
          <button
            type="button"
            className="absolute right-0 top-0 text-[11px] font-normal text-[#4b8d83]"
            onClick={() => onEdit(1)}
          >
            Edit
          </button>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-[#ccc]">
            <SummaryItem Icon={User} label={primaryName} dense />
            <SummaryItem Icon={PrimaryGenderIcon} label={primaryGenderLabel} dense />
            <SummaryItem Icon={Phone} label={form.phone || '—'} dense />
            <SummaryItem Icon={Calendar} label={form.age ? `${form.age} Years` : '—'} dense />
          </div>
          <SummaryItem Icon={Mail} label={form.email || '—'} dense />
        </div>

        {hasAdditional ? (
          <>
            <div className="h-px w-full bg-white/20" aria-hidden />
            <div className="relative flex flex-col gap-3 pr-10">
              <button
                type="button"
                className="absolute right-0 top-0 text-[11px] font-normal text-[#4b8d83]"
                onClick={() => onEdit(5)}
              >
                Edit
              </button>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-[#ccc]">
                <SummaryItem Icon={User} label={additionalName} dense />
                <SummaryItem Icon={AdditionalGenderIcon} label={additionalGenderLabel} dense />
                <SummaryItem Icon={Phone} label={additionalMember.phone || '—'} dense />
                <SummaryItem
                  Icon={Calendar}
                  label={additionalMember.age ? `${additionalMember.age} Years` : '—'}
                  dense
                />
                <SummaryItem Icon={Mail} label={additionalMember.email || '—'} dense />
                <SummaryItem Icon={Users} label={relationLabel || '—'} capitalize dense />
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section className="flex w-full flex-col gap-3.5 rounded-[8px] bg-white/5 p-3">
        <div className="flex items-center justify-between border-b border-white/20 pb-1.5">
          <h3 className="text-[15px] font-semibold text-white">Address Details</h3>
          <button
            type="button"
            className="text-[11px] font-normal text-[#4b8d83]"
            onClick={() => onEdit(2)}
          >
            Edit
          </button>
        </div>
        <div className="flex flex-col gap-3 text-[11px] text-[#ccc]">
          <SummaryItem Icon={Home} label={addressLine} dense />
          <SummaryItem Icon={Building2} label={form.landmark.trim() || '—'} dense />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <SummaryItem Icon={MapPin} label={form.city.trim() || '—'} dense />
            <SummaryItem Icon={LocationFillIcon} label={form.pincode.trim() || '—'} dense />
          </div>
        </div>
      </section>

      <section className="flex w-full flex-col gap-3.5 rounded-[8px] bg-white/5 p-3">
        <div className="flex items-center justify-between border-b border-white/20 pb-1.5">
          <h3 className="text-[15px] font-semibold text-white">Sample Collection</h3>
          {!hasAdditional ? (
            <button
              type="button"
              className="text-[11px] font-normal text-[#4b8d83]"
              onClick={() => onEdit(3)}
            >
              Edit
            </button>
          ) : null}
        </div>

        {hasAdditional ? (
          <>
            <div className="relative flex flex-col gap-3 pr-10">
              <button
                type="button"
                className="absolute right-0 top-0 text-[11px] font-normal text-[#4b8d83]"
                onClick={() => onEdit(3)}
              >
                Edit
              </button>
              <SummaryItem Icon={User} label={primaryName} dense />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-[#ccc]">
                <SummaryItem Icon={Calendar} label={formatBookingDate(form.appointmentDate)} dense />
                <SummaryItem Icon={Clock} label={form.appointmentTime || '—'} dense />
              </div>
            </div>

            <div className="h-px w-full bg-white/20" aria-hidden />

            <div className="relative flex flex-col gap-3 pr-10">
              <button
                type="button"
                className="absolute right-0 top-0 text-[11px] font-normal text-[#4b8d83]"
                onClick={() => onEdit(7)}
              >
                Edit
              </button>
              <SummaryItem Icon={User} label={additionalName} dense />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-[#ccc]">
                <SummaryItem
                  Icon={Calendar}
                  label={formatBookingDate(additionalMember.appointmentDate)}
                  dense
                />
                <SummaryItem Icon={Clock} label={additionalMember.appointmentTime || '—'} dense />
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-[#ccc]">
            <SummaryItem Icon={Calendar} label={formatBookingDate(form.appointmentDate)} dense />
            <SummaryItem Icon={Clock} label={form.appointmentTime || '—'} dense />
          </div>
        )}
      </section>

      <ContinueButton
        className="mt-1 w-full max-w-none"
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

function formatConfirmedDateTime(iso: string, slot: string): string {
  const date = formatBookingDate(iso)
  const compact = slot
    .trim()
    .replace(/\s*-\s*/g, '-')
    .replace(/\b0(\d:)/g, '$1')
  return compact ? `${date}  |  ${compact}` : date
}

function formatConfirmedLocation(member: Pick<FormData, 'areaStreet' | 'city'>): string {
  return [member.areaStreet, member.city].map((part) => part.trim()).filter(Boolean).join(', ') || '—'
}

function BookingConfirmedStep({
  form,
  additionalMember,
}: {
  form: FormData
  additionalMember: AdditionalMemberForm
}) {
  const primaryName = [form.firstName, form.lastName].filter(Boolean).join(' ') || '—'
  const additionalName =
    [additionalMember.firstName, additionalMember.lastName].filter(Boolean).join(' ') || '—'
  const hasAdditional = Boolean(
    additionalMember.firstName.trim() || additionalMember.lastName.trim(),
  )

  return (
    <div className="flex min-h-full w-full flex-col items-center gap-6">
      <div className="flex w-full flex-col items-center gap-1.5">
        <img
          src={bookingSuccessGif}
          alt=""
          draggable={false}
          className="mx-auto size-[126px] object-contain"
        />
        <div className="flex w-full flex-col items-center pb-3 text-center">
          <h2 className="text-[18px] font-semibold tracking-[0.2px] text-white">
            Booking Confirmed!
          </h2>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-xl border border-[rgba(144,223,158,0.2)] bg-[rgba(75,141,131,0.1)] px-[17px] py-[25px]">
        <div className="flex flex-col gap-4">
          <SuccessDetailRow icon={<UserIcon />} label="Member Name" value={primaryName} />
          <SuccessDetailRow
            icon={<CalendarIcon />}
            label="Date & Time"
            value={formatConfirmedDateTime(form.appointmentDate, form.appointmentTime)}
          />
          <SuccessDetailRow
            icon={<LocationPinIcon />}
            label="Location"
            value={formatConfirmedLocation(form)}
          />
        </div>

        {hasAdditional ? (
          <>
            <div className="h-px w-full bg-white/20" aria-hidden />
            <div className="flex flex-col gap-4">
              <SuccessDetailRow icon={<UserIcon />} label="Member Name" value={additionalName} />
              <SuccessDetailRow
                icon={<CalendarIcon />}
                label="Date & Time"
                value={formatConfirmedDateTime(
                  additionalMember.appointmentDate,
                  additionalMember.appointmentTime,
                )}
              />
              <SuccessDetailRow
                icon={<LocationPinIcon />}
                label="Location"
                value={formatConfirmedLocation(additionalMember)}
              />
            </div>
          </>
        ) : null}
      </div>

      <p className="w-full text-center text-[12px] leading-[18px] text-white">
        Log in using your registered mobile number and complete your Health Assessment
      </p>
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

function LocationPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 10.833C11.3807 10.833 12.5 9.71371 12.5 8.33301C12.5 6.9523 11.3807 5.83301 10 5.83301C8.61929 5.83301 7.5 6.9523 7.5 8.33301C7.5 9.71371 8.61929 10.833 10 10.833Z"
        stroke="#4B8D83"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.333C13.3333 15 16.6667 12.0152 16.6667 8.33301C16.6667 4.65079 13.6819 1.66699 10 1.66699C6.3181 1.66699 3.33333 4.65079 3.33333 8.33301C3.33333 12.0152 6.66667 15 10 18.333Z"
        stroke="#4B8D83"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

