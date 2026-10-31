import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Droplet,
  Globe,
  Hash,
  Home,
  Mail,
  MapPin,
  Mars,
  Phone,
  Stethoscope,
  User,
  UserPlus,
  Venus,
} from 'lucide-react'
import { ContinueButton } from './components/ContinueButton'
import {
  loadCampOnboarding,
  campCitiesFromEngagements,
  engagementForCity,
  isOnboardingFieldRequired,
  isOnboardingFieldVisible,
  shouldShowCampCityDropdown,
  showAddressSection,
  getBookingPages,
  getConsultationOffers,
  areConsultationsRequired,
  BOOKING_PAGE_LABELS,
  type BookingPage,
  type CampOnboarding,
  type ConsultationKind,
  type ConsultationOffer,
} from './api/campOnboarding'
import {
  displaySlotToHHmm,
  getAllBookableDates,
  loadEngagementSchedule,
  type EngagementSchedule,
} from './api/engagements'
import {
  onboardUserForEngagement,
  type OnboardUserForEngagementPayload,
} from './api/onboard'
import { createEmployeeUser } from './api/users'
import { resendBookingOtp, sendBookingOtp, verifyBookingOtp } from './api/otp'
import {
  isAnthropometryCategory,
  isCategoryCompleted,
  loadAssessmentCategoriesForStep2,
  normalizeCategoryKey,
  submitCompletedAssessmentFlow,
  type AssessmentCategoryStatus,
} from './api/assessments'
import {
  getCategoryQuestionnaire,
  submitQuestionnaireResponses,
  type QuestionnaireQuestion,
} from './api/questionnaire'
import { getAccessToken } from './lib/authStorage'
import {
  clearBookingDraft,
  readBookingDraft,
  writeBookingDraft,
} from './lib/bookingResume'
import {
  clearAssessmentResume,
  firstUnansweredNavigableIndex,
  hasSavedAnswers,
  readAssessmentResume,
  writeAssessmentResume,
} from './lib/assessmentResume'
import { toUserFacingError } from './lib/userFacingError'
import { isFrontendOnly } from './lib/frontendOnly'
import {
  applyAnswersToQuestions,
  seedAnswersFromQuestions,
  type AnswerValue,
} from './lib/questionnaireVisibility'
import { getMockQuestionnaireQuestions } from './data/mockApiQuestionnaires'
/** Validate booking fields with the input regexes before continuing. */
const ENFORCE_REQUIRED_FIELDS = true
import { ANTHRO_PAGE_BACKGROUND, PageBackdrop, type BackdropTone } from './components/PageBackdrop'
import { Stepper } from './components'
import { defaultFormData, type FormData } from './types'
import { ApiQuestionnaireStep } from './components/ApiQuestionnaireStep'
import { AnthropometryStep } from './components/anthropometry/AnthropometryStep'
import {
  buildAnthropometryResponses,
  type AnthropometryFollowupValues,
  type AnthropometryPrimaryValues,
} from './components/anthropometry/anthropometryConfig'
import { HealthAssessmentStep } from './components/HealthAssessmentStep'
import {
  SectionCompleteHub,
  type SectionCompleteVariant,
} from './components/SectionCompleteHub'
import { AppointmentJourneyCompleteStep } from './components/AppointmentJourneyCompleteStep'
import { OtpVerifyStep } from './components/OtpVerifyStep'
import { ScheduleStep } from './components/ScheduleStep'
import { Dropdown } from './components/ui/dropdown-01'
import { lookupPincode } from './lib/pincodeLookup'
import backgroundAssessmentSvg from './assets/Background.svg'
import lastPageBackgroundSvg from './assets/lastpage BG.svg'
import nutritionEndBackgroundSvg from './assets/nutritionend.svg'
import nutritionLogBackgroundSvg from './assets/nutritionlogstart.svg'
import familyHistoryBackgroundSvg from './assets/family history.svg'
import lifestyleHabitsBackgroundSvg from './assets/lifestyle-habits/background.svg'
import superShyftLogo from './assets/SuperShyft - Logo [Final]-03 7 (1).svg'
import bookingSuccessGif from './assets/animation-gif.gif'

function mergeQuestionnaireQuestions(
  previous: QuestionnaireQuestion[] | undefined,
  incoming: QuestionnaireQuestion[],
): QuestionnaireQuestion[] {
  if (!previous?.length) return incoming

  const incomingById = new Map(incoming.map((question) => [question.question_id, question]))
  const seen = new Set<number>()
  const merged: QuestionnaireQuestion[] = []

  for (const question of previous) {
    const incomingQuestion = incomingById.get(question.question_id)
    if (!incomingQuestion) {
      merged.push(question)
    } else {
      const answer = incomingQuestion.answer ?? question.answer
      merged.push(answer === undefined ? incomingQuestion : { ...incomingQuestion, answer })
    }
    seen.add(question.question_id)
  }
  for (const question of incoming) {
    if (seen.has(question.question_id)) continue
    merged.push(question)
    seen.add(question.question_id)
  }
  return merged
}

const RELATION_OPTIONS = [
  'Parent',
  'Sibling',
  'Spouse',
  'Child',
  'Grandparent',
  'Other',
] as const

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/
const PHONE_REGEX = /^[6-9]\d{9}$/
const AGE_REGEX = /^(?:[1-9]|[1-9]\d)$/
const PINCODE_REGEX = /^\d{6}$/
const sanitizeName = (value: string) => value.replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, ' ')
const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 10)
const sanitizeAge = (value: string) => value.replace(/\D/g, '').slice(0, 2)
const sanitizeEmail = (value: string) => value.replace(/\s/g, '')
const sanitizePincode = (value: string) => value.replace(/\D/g, '').slice(0, 6)
const generateParticipantId = (phone: string) => `HRM${phone || String(Date.now()).slice(-10)}`
const BOOK_APPOINTMENT_ERROR_EVENT = 'book-appointment:error'
const logClientError = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : fallback
  console.error(`[BookAppointment] ${raw}`)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(BOOK_APPOINTMENT_ERROR_EVENT, { detail: toUserFacingError(error, fallback) }),
    )
  }
}

function formatAddressForApi(form: FormData): string {
  const combined = [form.street.trim(), form.landmark.trim()].filter(Boolean).join(', ')
  return combined || form.city.trim()
}

function yesNoToBool(value: FormData['doctorConsultation']): boolean {
  return value === 'yes'
}

function consultationAnswer(form: FormData, key: ConsultationKind): FormData['doctorConsultation'] {
  if (key === 'doctor') return form.doctorConsultation
  if (key === 'nutritionist') return form.nutritionistConsultation
  return form.eyeConsultation
}

function setConsultationAnswer(
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void,
  key: ConsultationKind,
  value: FormData['doctorConsultation'],
) {
  if (key === 'doctor') update('doctorConsultation', value)
  else if (key === 'nutritionist') update('nutritionistConsultation', value)
  else update('eyeConsultation', value)
}

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>

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

export default function BookAppointment({ campCode }: { campCode: string }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(() => ({
    ...defaultFormData,
    gender: 'male',
    country: 'India',
  }))
  const [bookingPage, setBookingPage] = useState<BookingPage>('personal')
  const [maxReachedBookingIndex, setMaxReachedBookingIndex] = useState(0)
  const [campOnboarding, setCampOnboarding] = useState<CampOnboarding | null>(null)
  const [isLoadingCamp, setIsLoadingCamp] = useState(true)
  const [campLoadError, setCampLoadError] = useState('')
  const [schedule, setSchedule] = useState<EngagementSchedule | null>(null)
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false)
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [isLoadingAssessmentCategories, setIsLoadingAssessmentCategories] = useState(false)
  const [assessmentInstanceId, setAssessmentInstanceId] = useState<number | null>(null)
  const [preferredAssessmentInstanceId, setPreferredAssessmentInstanceId] = useState<number | null>(
    null,
  )
  const [previewAvailable, setPreviewAvailable] = useState(false)
  const [assessmentCategories, setAssessmentCategories] = useState<AssessmentCategoryStatus[]>([])
  const [completedCategoryIds, setCompletedCategoryIds] = useState<number[]>([])
  const [activeCategory, setActiveCategory] = useState<AssessmentCategoryStatus | null>(null)
  const [categoryQuestions, setCategoryQuestions] = useState<QuestionnaireQuestion[]>([])
  const [questionsByCategoryId, setQuestionsByCategoryId] = useState<
    Record<number, QuestionnaireQuestion[]>
  >({})
  const [answersByCategoryId, setAnswersByCategoryId] = useState<
    Record<number, Record<number, AnswerValue>>
  >({})
  const [progressByCategoryId, setProgressByCategoryId] = useState<Record<number, number>>({})
  const [isLoadingQuestionnaire, setIsLoadingQuestionnaire] = useState(false)
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null)
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false)
  const [hubVariant, setHubVariant] = useState<SectionCompleteVariant>('family')
  const [questionnaireReturnStep, setQuestionnaireReturnStep] = useState(6)
  const [highestHubStep, setHighestHubStep] = useState(6)
  const [uiError, setUiError] = useState('')
  const [attemptedPersonalContinue, setAttemptedPersonalContinue] = useState(false)
  const [attemptedAddressContinue, setAttemptedAddressContinue] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpDestinationEmail, setOtpDestinationEmail] = useState('')
  const [isHydratingResume, setIsHydratingResume] = useState(true)
  const [isAssessmentResumeOtp, setIsAssessmentResumeOtp] = useState(false)
  const persistBookingRef = useRef(true)
  const didHydrateResumeRef = useRef(false)

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    if (uiError) setUiError('')
    if (key === 'phone' || key === 'email') {
      setOtpVerified(false)
      setOtpDestinationEmail('')
    }
    setForm((f) => ({ ...f, [key]: value }))
  }, [uiError])

  const fields = campOnboarding?.fields ?? {}
  const campCities = campCitiesFromEngagements(campOnboarding?.engagements ?? [])
  const showCityDropdown = shouldShowCampCityDropdown(campOnboarding?.engagements ?? [])
  const selectedEngagement = engagementForCity(campOnboarding?.engagements ?? [], form.city)
  const fieldVisible = (key: string) => isOnboardingFieldVisible(fields, key)
  const fieldRequired = (key: string) => isOnboardingFieldRequired(fields, key)
  const includeAddress = showAddressSection(fields)
  const bookingPages = getBookingPages(includeAddress)
  const bookingIndex = Math.max(
    0,
    bookingPages.indexOf(bookingPage === 'otp' ? 'preview' : bookingPage),
  )
  const isInBooking = step < 5
  const consultationOffers = getConsultationOffers(fields)
  const consultationsRequired = areConsultationsRequired(fields)

  useEffect(() => {
    setMaxReachedBookingIndex((prev) => Math.max(prev, bookingIndex))
  }, [bookingIndex])

  useEffect(() => {
    if (bookingPage === 'address' && !includeAddress) setBookingPage('schedule')
  }, [bookingPage, includeAddress])

  useEffect(() => {
    didHydrateResumeRef.current = false
    persistBookingRef.current = true
    setIsHydratingResume(true)
    setIsAssessmentResumeOtp(false)
  }, [campCode])

  useEffect(() => {
    if (isHydratingResume || isLoadingCamp || campLoadError) return
    if (campOnboarding && campOnboarding.campCode !== campCode) return
    if (!persistBookingRef.current || isAssessmentResumeOtp) return
    if (step >= 5) return
    writeBookingDraft(campCode, {
      form,
      bookingPage,
      maxReachedBookingIndex,
    })
  }, [
    campCode,
    form,
    bookingPage,
    maxReachedBookingIndex,
    step,
    isHydratingResume,
    isLoadingCamp,
    campLoadError,
    isAssessmentResumeOtp,
    campOnboarding,
  ])

  useEffect(() => {
    let cancelled = false
    setIsLoadingCamp(true)
    setCampLoadError('')
    void loadCampOnboarding(campCode)
      .then((data) => {
        if (cancelled) return
        setCampOnboarding(data)
        const cities = campCitiesFromEngagements(data.engagements)
        if (cities.length === 1) {
          setForm((current) => ({ ...current, city: current.city || cities[0] }))
        }
      })
      .catch((error) => {
        if (cancelled) return
        setCampOnboarding(null)
        setCampLoadError(toUserFacingError(error, 'This camp link is not available.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCamp(false)
      })
    return () => {
      cancelled = true
    }
  }, [campCode])

  useEffect(() => {
    if (!selectedEngagement) {
      setSchedule(null)
      return
    }
    let cancelled = false
    setIsLoadingSchedule(true)
    void loadEngagementSchedule(selectedEngagement.code, selectedEngagement.city)
      .then((data) => {
        if (!cancelled) setSchedule(data)
      })
      .catch((error) => {
        if (cancelled) return
        setSchedule(null)
        logClientError(error, 'Unable to load the collection schedule.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSchedule(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedEngagement?.code, selectedEngagement?.city])

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

  const personalValidationError = (): string | null => {
    const requireField = (key: string) => ENFORCE_REQUIRED_FIELDS && fieldRequired(key)
    const trimmedPhone = form.phone.trim()
    const trimmedEmail = form.email.trim()
    const trimmedAge = form.age.trim()
    const trimmedFirstName = form.firstName.trim()
    const trimmedLastName = form.lastName.trim()

    if (fieldVisible('first_name')) {
      if (requireField('first_name') && !trimmedFirstName) return 'First name is required.'
      if (trimmedFirstName && !NAME_REGEX.test(trimmedFirstName)) {
        return 'First name can only contain letters and spaces.'
      }
    }
    if (fieldVisible('last_name')) {
      if (requireField('last_name') && !trimmedLastName) return 'Last name is required.'
      if (trimmedLastName && !NAME_REGEX.test(trimmedLastName)) {
        return 'Last name can only contain letters and spaces.'
      }
    }
    if (fieldVisible('phone') || trimmedPhone) {
      if (requireField('phone') && !trimmedPhone) return 'Phone is required.'
      if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
        return 'Enter a valid 10-digit mobile number.'
      }
    }
    if (fieldVisible('email')) {
      if (requireField('email') && !trimmedEmail) return 'Email is required.'
      if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
        return 'Please enter a valid email address.'
      }
    }
    if (fieldVisible('age')) {
      if (requireField('age') && !trimmedAge) return 'Age is required.'
      if (trimmedAge && !AGE_REGEX.test(trimmedAge)) return 'Age must be between 1 and 99.'
    }
    if (fieldVisible('gender') && requireField('gender') && !form.gender) {
      return 'Gender is required.'
    }
    if ((showCityDropdown || fieldVisible('city')) && !form.city.trim()) {
      return 'Please select a city.'
    }
    if (!selectedEngagement) return 'Please select a city.'
    if (fieldVisible('participant_blood_group') && requireField('participant_blood_group') && !form.bloodGroup.trim()) {
      return 'Please select a blood group.'
    }
    if (fieldVisible('participants_employee_id') && requireField('participants_employee_id') && !form.employeeId.trim()) {
      return 'Employee ID is required.'
    }
    if (fieldVisible('participant_department') && requireField('participant_department') && !form.department.trim()) {
      return 'Department is required.'
    }
    if (consultationsRequired) {
      for (const offer of consultationOffers) {
        if (!consultationAnswer(form, offer.key)) {
          return `Please choose ${offer.label.toLowerCase()}.`
        }
      }
    }
    if (!includeAddress) return addressFieldValidationError()
    return null
  }

  const addressFieldValidationError = (): string | null => {
    const requireField = (key: string) => ENFORCE_REQUIRED_FIELDS && fieldRequired(key)
    if (fieldVisible('address') && requireField('address') && !form.street.trim()) {
      return 'Address is required.'
    }
    if (fieldVisible('pincode')) {
      if (requireField('pincode') && !form.pincode.trim()) return 'Pincode is required.'
      if (form.pincode.trim() && !PINCODE_REGEX.test(form.pincode.trim())) {
        return 'Enter a valid 6-digit pincode.'
      }
    }
    if (fieldVisible('state') && requireField('state') && !form.state.trim()) {
      return 'State is required.'
    }
    if (fieldVisible('country') && requireField('country') && !form.country.trim()) {
      return 'Country is required.'
    }
    return null
  }

  const addressValidationError = (): string | null => {
    if (!includeAddress) return null
    return addressFieldValidationError()
  }

  const goToBookingPage = (page: BookingPage) => {
    setBookingPage(page)
  }

  const goNextFromPersonal = () => {
    setAttemptedPersonalContinue(true)
    const error = personalValidationError()
    if (error) {
      logClientError(error)
      return
    }
    setUiError('')
    goToBookingPage(includeAddress ? 'address' : 'schedule')
  }

  const goNextFromAddress = () => {
    setAttemptedAddressContinue(true)
    const error = addressValidationError()
    if (error) {
      logClientError(error)
      return
    }
    setUiError('')
    goToBookingPage('schedule')
  }

  const goNextFromSchedule = () => {
    const dates = getAllBookableDates(schedule)
    if (dates.length > 0 && (!form.appointmentDate || !form.appointmentTime)) {
      logClientError('Please select a collection date and time.')
      return
    }
    if (!selectedEngagement) {
      logClientError('Please select a city.')
      return
    }
    setUiError('')
    goToBookingPage('preview')
  }

  const handleVerifyOtp = async (otp: string) => {
    if (isVerifyingOtp) return

    setUiError('')
    setIsVerifyingOtp(true)

    try {
      if (!otpVerified) {
        await verifyBookingOtp({ phone: form.phone.trim() }, otp)
        setOtpVerified(true)
      }
      if (isAssessmentResumeOtp) {
        persistBookingRef.current = false
        clearBookingDraft(campCode)
        setIsAssessmentResumeOtp(false)
        const resume = readAssessmentResume(campCode)
        await handleContinueToAssessment({
          resume: true,
          preferredAssessmentInstanceId: resume?.assessmentInstanceId,
          previewAvailable: resume?.previewAvailable,
        })
        return
      }
      setStep(5)
    } catch (error) {
      logClientError(error, 'Unable to verify OTP.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (isResendingOtp || isVerifyingOtp) return

    setUiError('')
    setIsResendingOtp(true)

    try {
      const resent = await resendBookingOtp({ phone: form.phone.trim() })
      if (resent.email) setOtpDestinationEmail(resent.email)
    } catch (error) {
      logClientError(error, 'Unable to resend OTP.')
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleConfirmBooking = async () => {
    if (isSubmittingBooking) return

    const personalError = personalValidationError()
    if (personalError) {
      logClientError(personalError)
      return
    }
    const addressError = addressValidationError()
    if (addressError) {
      logClientError(addressError)
      return
    }
    if (!selectedEngagement) {
      logClientError('Please select a city.')
      return
    }

    const trimmedPhone = form.phone.trim()
    const trimmedEmail = form.email.trim()
    const parsedAge = Number.parseInt(form.age, 10)
    const safeAge = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : NaN
    const participantId = form.employeeId.trim() || generateParticipantId(trimmedPhone)
    const apiAddress = formatAddressForApi(form)
    const apiPincode = form.pincode.trim()
    const apiCity = selectedEngagement.city
    const apiState = form.state.trim()
    const apiCountry = form.country.trim() || 'India'
    const offered = new Set(consultationOffers.map((offer) => offer.key))
    const wantsDoctor = offered.has('doctor') ? yesNoToBool(form.doctorConsultation) : false
    const wantsNutritionist = offered.has('nutritionist')
      ? yesNoToBool(form.nutritionistConsultation)
      : false
    const wantsEye = offered.has('eye') ? yesNoToBool(form.eyeConsultation) : false

    if (!isFrontendOnly()) {
      if (fieldVisible('gender') && !form.gender) {
        logClientError('Gender is required.')
        return
      }
      if (fieldVisible('age') && !Number.isFinite(safeAge)) {
        logClientError('Age is required.')
        return
      }
    }

    setUiError('')
    setIsSubmittingBooking(true)

    try {
      const confirmGender = form.gender || 'male'
      const confirmAge = Number.isFinite(safeAge) ? safeAge : 25

      const payload: OnboardUserForEngagementPayload = {
        age: confirmAge,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: trimmedEmail,
        phone: trimmedPhone,
        gender: confirmGender,
        address: apiAddress,
        pincode: apiPincode,
        city: apiCity,
        state: apiState,
        country: apiCountry,
        referred_by: form.referredBy.trim() || null,
        blood_collection_date: form.appointmentDate || null,
        blood_collection_time_slot: form.appointmentTime
          ? displaySlotToHHmm(form.appointmentTime)
          : null,
        blood_collection_cabin: form.appointmentCabin || null,
        participants_employee_id: participantId,
        participant_department: form.department.trim() || null,
        participant_blood_group: form.bloodGroup.trim(),
        want_doctor_consultation: wantsDoctor,
        want_nutritionist_consultation: wantsNutritionist,
        consultations: {
          eye: wantsEye,
          doctor: wantsDoctor,
          nutritionist: wantsNutritionist,
        },
      }

      await createEmployeeUser({
        age: confirmAge,
        phone: trimmedPhone,
        first_name: form.firstName.trim() || null,
        last_name: form.lastName.trim() || null,
        email: EMAIL_REGEX.test(trimmedEmail) ? trimmedEmail : null,
        gender: form.gender || null,
        address: formatAddressForApi(form) || 'NA',
        pin_code: form.pincode.trim() || '000000',
        city: apiCity || 'NA',
        state: apiState || 'NA',
        country: apiCountry,
        referred_by: form.referredBy.trim() || null,
        is_participant: true,
        status: 'active',
      })
      const onboardResult = await onboardUserForEngagement(payload, selectedEngagement.code)
      const nextPreviewAvailable = Boolean(onboardResult.previewAvailable)
      const nextAssessmentInstanceId = onboardResult.assessmentInstanceId ?? null
      setPreviewAvailable(nextPreviewAvailable)
      setPreferredAssessmentInstanceId(nextAssessmentInstanceId)
      persistBookingRef.current = false
      clearBookingDraft(campCode)
      writeAssessmentResume(campCode, {
        phone: trimmedPhone,
        email: trimmedEmail,
        assessmentInstanceId: nextAssessmentInstanceId,
        previewAvailable: nextPreviewAvailable,
      })
      if (otpVerified || !trimmedPhone) {
        setStep(5)
        return
      }
      try {
        const sent = await sendBookingOtp({ phone: trimmedPhone })
        if (sent.email) setOtpDestinationEmail(sent.email)
      } catch (otpError) {
        logClientError(otpError, 'Unable to send OTP.')
      }
      goToBookingPage('otp')
    } catch (error) {
      logClientError(error, 'Unable to confirm booking.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const hubStepForVariant = (variant: SectionCompleteVariant) => {
    if (variant === 'anthropometry') return 9
    if (variant === 'lifestyle') return 10
    if (variant === 'nutrition') return 12
    return 8
  }

  const variantForCategory = (category: AssessmentCategoryStatus): SectionCompleteVariant => {
    const key = normalizeCategoryKey(category.category_key)
    if (key.includes('anthro')) return 'anthropometry'
    if (key.includes('lifestyle')) return 'lifestyle'
    if (key.includes('nutrition')) return 'nutrition'
    return 'family'
  }

  const persistCategoryDraft = (
    categoryId: number,
    answers: Record<number, AnswerValue>,
    index?: number,
  ) => {
    if (categoryId <= 0) return
    setAnswersByCategoryId((prev) => ({ ...prev, [categoryId]: answers }))
    if (typeof index === 'number' && Number.isFinite(index)) {
      setProgressByCategoryId((prev) => ({ ...prev, [categoryId]: Math.max(0, index) }))
    }
    setQuestionsByCategoryId((prev) => {
      const existing = prev[categoryId]
      if (!existing) return prev
      return { ...prev, [categoryId]: applyAnswersToQuestions(existing, answers) }
    })
  }

  const openCategoryQuestions = (
    categoryId: number,
    questions: QuestionnaireQuestion[],
    draftAnswers?: Record<number, AnswerValue>,
  ) => {
    const merged = mergeQuestionnaireQuestions(questionsByCategoryId[categoryId], questions)
    const withDrafts = applyAnswersToQuestions(
      merged,
      draftAnswers ?? answersByCategoryId[categoryId],
    )
    setQuestionsByCategoryId((prev) => ({ ...prev, [categoryId]: withDrafts }))
    setCategoryQuestions(withDrafts)
  }

  const handleLoadCategory = async (
    category: AssessmentCategoryStatus,
    options?: {
      returnStep?: number
      resumeToUnanswered?: boolean
      unstartedGoesToHub?: boolean
      assessmentInstanceId?: number
      previewAvailable?: boolean
    },
  ) => {
    if (isLoadingQuestionnaire) return

    const categoryId = Number(category.category_id || 0)
    const instanceId = options?.assessmentInstanceId ?? assessmentInstanceId
    const usePreview = options?.previewAvailable ?? previewAvailable
    if (!instanceId || categoryId <= 0) {
      logClientError('Assessment category is missing. Go back and continue to Step 2 again.')
      return
    }

    setUiError('')
    setIsLoadingQuestionnaire(true)
    setLoadingCategoryId(categoryId)
    const returnStep = options?.returnStep ?? hubStepForVariant(hubVariant)
    setQuestionnaireReturnStep(returnStep)
    if (returnStep === 8 || returnStep === 9 || returnStep === 10 || returnStep === 12) {
      setHighestHubStep((prev) => Math.max(prev, returnStep))
    }

    const cachedQuestions = questionsByCategoryId[categoryId]
    const beginCategory = (questions: QuestionnaireQuestion[]) => {
      if (options?.resumeToUnanswered) {
        const seeded = seedAnswersFromQuestions(questions)
        const startIndex = firstUnansweredNavigableIndex(questions)
        setAnswersByCategoryId((prev) => ({ ...prev, [categoryId]: seeded }))
        setProgressByCategoryId((prev) => ({ ...prev, [categoryId]: startIndex }))
        if (options.unstartedGoesToHub && !hasSavedAnswers(questions)) {
          openCategoryQuestions(categoryId, questions, seeded)
          setStep(6)
          return
        }
        setActiveCategory(category)
        openCategoryQuestions(categoryId, questions, seeded)
        setStep(7)
        return
      }
      setActiveCategory(category)
      openCategoryQuestions(categoryId, questions)
      setStep(7)
    }

    try {
      // Frontend-only: use API-shaped mock questions so we can redesign layouts one-by-one.
      if (isFrontendOnly()) {
        const questions = getMockQuestionnaireQuestions(category.category_key)
        if (questions.length === 0 && !isAnthropometryCategory(category.category_key)) {
          throw new Error('No mock questions available for this category yet.')
        }
        beginCategory(questions)
        console.info('[frontend-only] opening API-shaped questionnaire', {
          categoryId,
          categoryKey: category.category_key,
          questionCount: questions.length,
        })
        return
      }

      const accessToken = getAccessToken()
      const questionnaire = await getCategoryQuestionnaire(
        accessToken,
        instanceId,
        categoryId,
        { includeAllQuestions: usePreview },
      )
      const questions = questionnaire.questions
      if (!Array.isArray(questions) || questions.length === 0) {
        if (isAnthropometryCategory(category.category_key)) {
          beginCategory([])
          return
        }
        if (cachedQuestions?.length) {
          beginCategory(cachedQuestions)
          return
        }
        throw new Error('No questions returned for this category.')
      }

      beginCategory(questions)
      console.info('[assessment] category questionnaire loaded', {
        assessmentInstanceId: instanceId,
        categoryId,
        categoryKey: category.category_key,
        questionCount: questions.length,
        questionAll: usePreview,
      })
    } catch (error) {
      if (cachedQuestions?.length) {
        beginCategory(cachedQuestions)
        return
      }
      logClientError(error, 'Unable to load questionnaire questions.')
      if (options?.returnStep) setStep(options.returnStep)
    } finally {
      setIsLoadingQuestionnaire(false)
      setLoadingCategoryId(null)
    }
  }

  const handleContinueToAssessment = async (overrides?: {
    previewAvailable?: boolean
    preferredAssessmentInstanceId?: number | null
    resume?: boolean
  }) => {
    if (isLoadingAssessmentCategories) return

    const usePreview = overrides?.previewAvailable ?? previewAvailable
    const preferredId =
      overrides?.preferredAssessmentInstanceId ?? preferredAssessmentInstanceId

    setUiError('')
    setIsLoadingAssessmentCategories(true)

    try {
      const accessToken = getAccessToken()
      const result = await loadAssessmentCategoriesForStep2(accessToken, preferredId)
      const categories = usePreview
        ? result.categories.map((category) => ({ ...category, status: 'pending' }))
        : result.categories
      const completedIds = usePreview
        ? []
        : categories
            .filter((category) => isCategoryCompleted(category, []))
            .map((category) => Number(category.category_id))
      setAssessmentInstanceId(result.assessmentInstanceId)
      setAssessmentCategories(categories)
      setCompletedCategoryIds(completedIds)
      console.info('[assessment] step 2 categories loaded', {
        assessmentInstanceId: result.assessmentInstanceId,
        previewAvailable: usePreview,
        resume: Boolean(overrides?.resume),
        categories: categories.map((c) => c.category_key),
      })

      if (!overrides?.resume) {
        setStep(6)
        return
      }

      const remaining = categories.filter(
        (category) => !isCategoryCompleted(category, completedIds),
      )
      if (categories.length > 0 && remaining.length === 0) {
        setStep(13)
        return
      }
      if (!remaining[0]) {
        setStep(6)
        return
      }

      await handleLoadCategory(remaining[0], {
        returnStep: 6,
        resumeToUnanswered: true,
        unstartedGoesToHub: completedIds.length === 0,
        assessmentInstanceId: result.assessmentInstanceId,
        previewAvailable: usePreview,
      })
    } catch (error) {
      if (overrides?.resume) persistBookingRef.current = true
      logClientError(error, 'Unable to load health assessment categories.')
    } finally {
      setIsLoadingAssessmentCategories(false)
    }
  }

  useEffect(() => {
    if (isLoadingCamp || !campOnboarding) return
    if (campOnboarding.campCode !== campCode) return
    if (campLoadError) {
      setIsHydratingResume(false)
      return
    }
    if (didHydrateResumeRef.current) return
    didHydrateResumeRef.current = true

    const draft = readBookingDraft(campCode)
    if (draft) {
      setForm({
        ...defaultFormData,
        ...draft.form,
        gender: draft.form.gender || 'male',
        country: draft.form.country || 'India',
      })
      setBookingPage(draft.bookingPage)
      setMaxReachedBookingIndex(draft.maxReachedBookingIndex)
      if (draft.bookingPage === 'otp' && draft.form.phone.trim()) {
        void sendBookingOtp({ phone: draft.form.phone.trim() })
          .then((sent) => {
            if (sent.email) setOtpDestinationEmail(sent.email)
          })
          .catch((error) => {
            logClientError(error, 'Unable to send OTP.')
          })
      }
      setIsHydratingResume(false)
      return
    }

    const token = getAccessToken()
    const resume = readAssessmentResume(campCode)
    if (!token && !resume?.phone) {
      setIsHydratingResume(false)
      return
    }

    persistBookingRef.current = false
    clearBookingDraft(campCode)

    if (!token && resume?.phone) {
      setForm((current) => ({
        ...current,
        phone: resume.phone,
        email: current.email || resume.email,
      }))
      setOtpDestinationEmail(resume.email)
      setIsAssessmentResumeOtp(true)
      goToBookingPage('otp')
      void sendBookingOtp({ phone: resume.phone })
        .then((sent) => {
          if (sent.email) setOtpDestinationEmail(sent.email)
        })
        .catch((error) => {
          logClientError(error, 'Unable to send OTP.')
        })
        .finally(() => {
          setIsHydratingResume(false)
        })
      return
    }

    void handleContinueToAssessment({
      resume: true,
      preferredAssessmentInstanceId: resume?.assessmentInstanceId,
      previewAvailable: resume?.previewAvailable,
    }).finally(() => {
      setIsHydratingResume(false)
    })
  }, [campCode, campLoadError, campOnboarding, isLoadingCamp])

  const handleStartAssessment = async () => {
    const nextCategory =
      assessmentCategories.find((category) => !isCategoryCompleted(category, completedCategoryIds)) ||
      assessmentCategories[0]

    if (!nextCategory) {
      logClientError('Assessment category is missing. Go back and continue to Step 2 again.')
      return
    }

    await handleLoadCategory(nextCategory, { returnStep: 6 })
  }

  const handleCategoryQuestionnaireComplete = (answers?: Record<number, AnswerValue>) => {
    if (!activeCategory) {
      setStep(Math.max(highestHubStep, 8))
      return
    }

    const categoryId = Number(activeCategory.category_id)
    persistCategoryDraft(categoryId, answers ?? answersByCategoryId[categoryId] ?? {}, 0)
    setCompletedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev : [...prev, categoryId],
    )

    const variant = variantForCategory(activeCategory)
    const completedHubStep = hubStepForVariant(variant)
    setHighestHubStep((prev) => Math.max(prev, questionnaireReturnStep, completedHubStep))
    setHubVariant(variant)
    setStep(completedHubStep)
  }

  const handleAnthropometryComplete = async (payload: {
    primary: AnthropometryPrimaryValues
    followup: AnthropometryFollowupValues
  }) => {
    if (!activeCategory) {
      setHubVariant('anthropometry')
      setStep(9)
      return
    }

    const categoryId = Number(activeCategory.category_id)
    const responses = buildAnthropometryResponses(
      categoryQuestions,
      payload.primary,
      payload.followup,
    )

    if (assessmentInstanceId && responses.length > 0) {
      try {
        const accessToken = getAccessToken()
        await submitQuestionnaireResponses(
          accessToken,
          assessmentInstanceId,
          categoryId,
          responses,
        )
      } catch (error) {
        console.warn(
          '[assessment] anthropometry submit reported an error; continuing anyway',
          error instanceof Error ? error.message : error,
        )
      }
    }

    setCompletedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev : [...prev, categoryId],
    )
    setHighestHubStep((prev) => Math.max(prev, questionnaireReturnStep, 9))
    setHubVariant('anthropometry')
    setStep(9)
  }

  const handleSubmitCompletedAssessment = async () => {
    if (isSubmittingAssessment) return
    if (!assessmentInstanceId) {
      clearAssessmentResume(campCode)
      setStep(13)
      return
    }

    setUiError('')
    setIsSubmittingAssessment(true)

    try {
      const accessToken = getAccessToken()
      const result = await submitCompletedAssessmentFlow(accessToken, assessmentInstanceId)
      console.info('[assessment] submit completed', {
        assessmentInstanceId,
        ...result,
      })
    } catch (error) {
      // Backend often receives the submit successfully even when the browser reports
      // a network/CORS "Failed to fetch" — continue without blocking the user.
      console.warn(
        '[assessment] submit reported an error; continuing anyway',
        error instanceof Error ? error.message : error,
      )
    } finally {
      setIsSubmittingAssessment(false)
      setUiError('')
      clearAssessmentResume(campCode)
      setStep(13)
    }
  }

  const organizationName = campOnboarding?.organizationName.trim() || ''

  const showBack =
    (isInBooking && bookingPage !== 'personal' && bookingPage !== 'otp') ||
    (step > 1 && step !== 5 && step !== 13 && !isInBooking)
  const hideGlobalContinue =
    isLoadingCamp ||
    isHydratingResume ||
    Boolean(campLoadError) ||
    !isInBooking ||
    bookingPage === 'preview' ||
    bookingPage === 'otp'
  const hideStepper = step >= 5 || bookingPage === 'otp' || isHydratingResume
  const hideMainHeader = step === 6 || step === 7 || step === 8 || step === 9 || step === 10 || step === 12
  const confirmStepperBorder = isInBooking && bookingPage === 'preview'
  const stepperSteps = bookingPages.map((page) => BOOKING_PAGE_LABELS[page])

  const handleStepContinue = () => {
    if (bookingPage === 'personal') goNextFromPersonal()
    if (bookingPage === 'address') goNextFromAddress()
    if (bookingPage === 'schedule') goNextFromSchedule()
  }

  const handleBookingBack = () => {
    const previous = bookingPages[bookingIndex - 1]
    if (previous) goToBookingPage(previous)
  }

  const continueVariant = 'mobileBarCompact'

  const isQuestionnaireFlow = step >= 6
  const activeCategoryKey = normalizeCategoryKey(activeCategory?.category_key || '')
  const isAnthroActive = isAnthropometryCategory(activeCategoryKey)
  const questionnaireBackground = activeCategoryKey.includes('lifestyle')
    ? lifestyleHabitsBackgroundSvg
    : activeCategoryKey.includes('nutrition')
      ? nutritionLogBackgroundSvg
      : familyHistoryBackgroundSvg
  const isAnthroSection = step === 6 || (step === 7 && isAnthroActive)
  const questionnaireWallpaper = isQuestionnaireFlow && !isAnthroSection
    ? step === 13
      ? lastPageBackgroundSvg
      : step === 6 || step === 8 || step === 9
        ? backgroundAssessmentSvg
        : step === 10
          ? nutritionEndBackgroundSvg
          : step === 12
            ? nutritionLogBackgroundSvg
            : step === 7
              ? questionnaireBackground
              : backgroundAssessmentSvg
    : undefined

  const questionnaireTone: BackdropTone = (() => {
    if (!isQuestionnaireFlow) return 'booking'
    if (isAnthroSection) return 'anthro'
    if (step === 13) return 'finale'
    if (step === 10) return 'lifestyle'
    if (step === 12) return 'nutrition'
    if (step === 9) return 'anthro'
    if (step === 8 || step === 6) return 'family'
    if (step === 7) {
      if (isAnthroActive) return 'anthro'
      if (activeCategoryKey.includes('lifestyle')) return 'lifestyle'
      if (activeCategoryKey.includes('nutrition')) return 'nutrition'
      return 'family'
    }
    return 'family'
  })()

  return (
    <PageBackdrop
      wide={step <= 4}
      wallpaperSrc={questionnaireWallpaper}
      cssWallpaper={isAnthroSection ? ANTHRO_PAGE_BACKGROUND : undefined}
      tone={questionnaireTone}
    >
      <div className="flex h-full min-w-0 flex-col">
        {/* Header — Figma: p-20px */}
        {hideMainHeader ? null : (
        <header className="grid shrink-0 grid-cols-[32px_1fr_32px] items-center p-5">
          {showBack ? (
            <button
              type="button"
              onClick={() => {
                if (isInBooking) handleBookingBack()
                else setStep((s) => Math.max(1, s - 1))
              }}
              className="flex size-8 items-center justify-start text-white"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" strokeWidth={2} />
            </button>
          ) : (
            <span className="size-8" aria-hidden />
          )}
          <h1 className="flex min-w-0 items-center justify-center gap-2 overflow-visible text-center text-[15px] font-semibold leading-5 text-white lg:gap-3 lg:text-[20px] lg:leading-6">
            {organizationName ? (
              <>
                <span className="min-w-0 truncate">{organizationName}</span>
                <span className="shrink-0 text-[15px] font-medium text-[#9a9a9a] lg:text-[18px]" aria-hidden>
                  ×
                </span>
              </>
            ) : null}
            <img
              src={superShyftLogo}
              alt="SuperShyft"
              className="h-10 w-10 shrink-0 object-contain"
            />
          </h1>
          <span className="size-8" aria-hidden />
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
              steps={stepperSteps}
              current={bookingIndex + 1}
              maxReachable={maxReachedBookingIndex + 1}
              onStepClick={(target) => {
                const page = bookingPages[target - 1]
                if (page) goToBookingPage(page)
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
            step === 5
              ? 'flex min-h-0 min-w-0 flex-1 flex-col justify-between px-6 pb-6 pt-4'
              : step === 6 || step === 7 || step === 8 || step === 9 || step === 10 || step === 12 || step === 13
                ? 'px-0 pb-0 pt-0'
                : 'px-6 pb-4 pt-8'
          }`}
        >
          <div
            className={
              step === 6 || step === 7
                ? 'min-h-0 min-w-0 flex-1 overflow-hidden'
                : step === 5 || step === 8 || step === 9 || step === 10 || step === 12
                  ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                  : 'min-h-0 min-w-0 flex-1 overflow-x-visible overflow-y-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            }
          >
            {isLoadingCamp || isHydratingResume ? (
              <p className="pt-8 text-center text-[14px] text-[#9a9a9a]">
                {isHydratingResume && !isLoadingCamp
                  ? 'Loading your progress...'
                  : 'Loading camp details...'}
              </p>
            ) : campLoadError ? (
              <div className="flex flex-col items-center gap-2 pt-8 text-center">
                <p className="text-[18px] font-semibold text-white">This camp link is not available.</p>
                <p className="max-w-[280px] text-[13px] leading-5 text-[#9a9a9a]">{campLoadError}</p>
              </div>
            ) : null}
            {isInBooking && bookingPage === 'personal' && !isLoadingCamp && !isHydratingResume && !campLoadError && (
              <PersonalStep
                form={form}
                update={update}
                labelRow={labelRow}
                showMissingRequired={ENFORCE_REQUIRED_FIELDS && attemptedPersonalContinue}
                fields={fields}
                campCities={campCities}
                showCityDropdown={showCityDropdown}
                hideAddressFields={includeAddress}
                consultationOffers={consultationOffers}
                consultationsRequired={consultationsRequired}
                onCityChange={(city) => {
                  update('city', city)
                  update('appointmentDate', '')
                  update('appointmentTime', '')
                  update('appointmentCabin', '')
                  update('appointmentCabinName', '')
                }}
              />
            )}
            {isInBooking && bookingPage === 'address' && !isLoadingCamp && !isHydratingResume && !campLoadError && (
              <AddressStep
                form={form}
                update={update}
                labelRow={labelRow}
                showMissingRequired={ENFORCE_REQUIRED_FIELDS && attemptedAddressContinue}
                fields={fields}
              />
            )}
            {isInBooking && bookingPage === 'schedule' && !isLoadingCamp && !isHydratingResume && !campLoadError && (
              <ScheduleStep
                city={selectedEngagement?.city || form.city}
                schedule={schedule}
                isLoading={isLoadingSchedule}
                appointmentDate={form.appointmentDate}
                appointmentTime={form.appointmentTime}
                appointmentCabin={form.appointmentCabinName || form.appointmentCabin}
                onDateChange={(iso) => {
                  update('appointmentDate', iso)
                  update('appointmentTime', '')
                  update('appointmentCabin', '')
                  update('appointmentCabinName', '')
                }}
                onCabinChange={(name, key) => {
                  update('appointmentCabinName', name)
                  update('appointmentCabin', key)
                }}
                onTimeChange={(slot) => update('appointmentTime', slot)}
              />
            )}
            {isInBooking && bookingPage === 'preview' && !isHydratingResume && (
              <ConfirmStep
                form={form}
                onEdit={(page) => goToBookingPage(page)}
                onProceed={handleConfirmBooking}
                isSubmitting={isSubmittingBooking}
                showFields={fields}
                showAddress={includeAddress}
                consultationOffers={consultationOffers}
              />
            )}
            {isInBooking && bookingPage === 'otp' && !isHydratingResume && (
              <OtpVerifyStep
                key={form.phone}
                phone={form.phone}
                email={otpDestinationEmail}
                isVerifying={isVerifyingOtp}
                isResending={isResendingOtp}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
              />
            )}
            {step === 5 && <BookingConfirmedStep form={form} />}
            {step === 6 && (
              <HealthAssessmentStep
                categories={assessmentCategories}
                isStarting={isLoadingQuestionnaire}
                onStartAssessment={handleStartAssessment}
              />
            )}
            {step === 7 && activeCategory && isAnthroActive ? (
              <AnthropometryStep
                key={Number(activeCategory.category_id)}
                questions={categoryQuestions}
                assessmentInstanceId={assessmentInstanceId ?? 1}
                categoryId={Number(activeCategory.category_id)}
                onBack={() => setStep(Math.max(highestHubStep, questionnaireReturnStep))}
                onComplete={handleAnthropometryComplete}
              />
            ) : null}
            {step === 7 && activeCategory && !isAnthroActive && categoryQuestions.length > 0 ? (
              <ApiQuestionnaireStep
                key={Number(activeCategory.category_id)}
                title={activeCategory.display_name || 'Assessment'}
                questions={categoryQuestions}
                assessmentInstanceId={assessmentInstanceId ?? 1}
                categoryId={Number(activeCategory.category_id)}
                theme={
                  normalizeCategoryKey(activeCategory.category_key).includes('lifestyle')
                    ? 'lifestyle'
                    : normalizeCategoryKey(activeCategory.category_key).includes('nutrition')
                      ? 'nutrition'
                      : 'family'
                }
                initialAnswers={answersByCategoryId[Number(activeCategory.category_id)]}
                initialIndex={progressByCategoryId[Number(activeCategory.category_id)] ?? 0}
                onDraftChange={(answers, index) =>
                  persistCategoryDraft(Number(activeCategory.category_id), answers, index)
                }
                onBack={() => setStep(Math.max(highestHubStep, questionnaireReturnStep))}
                onComplete={handleCategoryQuestionnaireComplete}
              />
            ) : null}
            {(step === 8 || step === 9 || step === 10 || step === 12) && (
              <SectionCompleteHub
                variant={hubVariant}
                categories={assessmentCategories}
                completedCategoryIds={completedCategoryIds}
                isLoadingCategoryId={loadingCategoryId}
                isContinuing={isSubmittingAssessment}
                onSelectCategory={(category) =>
                  handleLoadCategory(category, { returnStep: step })
                }
                onContinue={handleSubmitCompletedAssessment}
              />
            )}
            {step === 13 && (
              <AppointmentJourneyCompleteStep />
            )}
          </div>

          {step === 5 ? (
            <ContinueButton
              variant="mobileBar"
              className="mt-6 !h-[52px] w-full shrink-0 border border-[#969696] shadow-[0_12px_20px_rgba(255,255,255,0.15)]"
              disabled={isLoadingAssessmentCategories}
              onClick={() => {
                void handleContinueToAssessment()
              }}
            >
              {isLoadingAssessmentCategories
                ? 'Loading...'
                : previewAvailable
                  ? 'Review & Edit Step 2'
                  : 'Continue to Step 2'}
            </ContinueButton>
          ) : !hideGlobalContinue ? (
            <div className="mt-3 shrink-0">
              {bookingPage === 'personal' ? (
                <p className="mb-[25px] hidden font-sans text-[11px] font-normal leading-normal text-[#9A9A9A] lg:block">
                  Disclaimer: By voluntarily providing your information, you consent to its use
                  solely for the Bio AI Health Checkup and related results. Your data will be kept
                  confidential and handled securely.
                </p>
              ) : null}
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
  'booking-field-input h-10 w-full rounded-[8px] border border-transparent bg-white/5 px-4 text-[16px] font-normal outline-none focus:border-[#4b8d83]'

function choiceButtonClass(selected: boolean) {
  return [
    'flex flex-1 origin-center items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] leading-4 transition duration-200 hover:z-[1] hover:scale-[1.03]',
    selected
      ? 'bg-[radial-gradient(ellipse_at_center,_#11795f_0%,_#1c493d_100%)] text-white'
      : 'bg-white/5 text-[#999]',
  ].join(' ')
}

function PersonalStep({
  form,
  update,
  labelRow,
  showMissingRequired,
  fields,
  campCities,
  showCityDropdown,
  hideAddressFields,
  consultationOffers,
  consultationsRequired,
  onCityChange,
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
  fields: CampOnboarding['fields']
  campCities: string[]
  showCityDropdown: boolean
  hideAddressFields: boolean
  consultationOffers: ConsultationOffer[]
  consultationsRequired: boolean
  onCityChange: (city: string) => void
}) {
  const showRequired = Boolean(showMissingRequired)
  const visible = (key: string) => isOnboardingFieldVisible(fields, key)
  const required = (key: string) => showRequired && isOnboardingFieldRequired(fields, key)
  const isMissing = (key: string, value: string) => required(key) && !value.trim()
  const showName = visible('first_name') || visible('last_name')
  const showCity = showCityDropdown || (visible('city') && !hideAddressFields)
  const fullNameError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : (visible('first_name') && !form.firstName.trim()) || (visible('last_name') && !form.lastName.trim())
      ? 'missing'
      : (form.firstName.trim() && !NAME_REGEX.test(form.firstName.trim())) ||
          (form.lastName.trim() && !NAME_REGEX.test(form.lastName.trim()))
        ? 'invalid'
        : undefined
  const phoneError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : required('phone') && !form.phone.trim()
      ? 'missing'
      : form.phone.trim() && !PHONE_REGEX.test(form.phone.trim())
        ? 'invalid'
        : undefined
  const emailError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : required('email') && !form.email.trim()
      ? 'missing'
      : form.email.trim() && !EMAIL_REGEX.test(form.email.trim())
        ? 'invalid'
        : undefined
  const ageError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : required('age') && !form.age.trim()
      ? 'missing'
      : form.age.trim() && !AGE_REGEX.test(form.age.trim())
        ? 'invalid'
        : undefined
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-6">
      {showName ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(User, 'Full Name', undefined, Boolean(fullNameError), fullNameError)}
        <div className="flex gap-2">
          {visible('first_name') ? (
          <input
            className={`${mobileFieldInput} min-w-0 flex-1`}
            placeholder="First name"
            autoComplete="given-name"
            inputMode="text"
            pattern="^[A-Za-z]+(?: [A-Za-z]+)*$"
            title="Letters and spaces only"
            value={form.firstName}
            onChange={(e) => update('firstName', sanitizeName(e.target.value))}
          />
          ) : null}
          {visible('last_name') ? (
          <input
            className={`${mobileFieldInput} min-w-0 flex-1`}
            placeholder="Last name"
            autoComplete="family-name"
            inputMode="text"
            pattern="^[A-Za-z]+(?: [A-Za-z]+)*$"
            title="Letters and spaces only"
            value={form.lastName}
            onChange={(e) => update('lastName', sanitizeName(e.target.value))}
          />
          ) : null}
        </div>
      </div>
      ) : null}

      {visible('phone') ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Phone, 'Phone (Whatsapp)', undefined, Boolean(phoneError), phoneError)}
        <input
          className={mobileFieldInput}
          inputMode="tel"
          placeholder="Phone (Whatsapp)"
          maxLength={10}
          pattern="^[6-9]\\d{9}$"
          title="10-digit mobile number starting with 6-9"
          value={form.phone}
          onChange={(e) => update('phone', sanitizePhone(e.target.value))}
        />
      </div>
      ) : null}

      {visible('email') ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Mail, 'Email', undefined, Boolean(emailError), emailError)}
        <input
          className={mobileFieldInput}
          type="email"
          inputMode="email"
          placeholder="Email"
          autoComplete="email"
          pattern="^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
          title="Enter a valid email address"
          value={form.email}
          onChange={(e) => update('email', sanitizeEmail(e.target.value))}
        />
      </div>
      ) : null}

      {visible('age') ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Calendar, 'Age', undefined, Boolean(ageError), ageError)}
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="Age"
          maxLength={2}
          pattern="^(?:[1-9]|[1-9]\\d)$"
          title="Age must be between 1 and 99"
          value={form.age}
          onChange={(e) => update('age', sanitizeAge(e.target.value))}
        />
      </div>
      ) : null}

      {visible('gender') ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(User, 'Gender', undefined, required('gender') && !form.gender)}
        <div className="flex h-10 gap-6 overflow-visible">
          <button
            type="button"
            onClick={() => {
              if (form.gender === 'male') return
              update('gender', 'male')
            }}
            className={choiceButtonClass(form.gender === 'male')}
          >
            <Mars className="size-4 shrink-0" strokeWidth={2} />
            Male
          </button>
          <button
            type="button"
            onClick={() => {
              if (form.gender === 'female') return
              update('gender', 'female')
            }}
            className={choiceButtonClass(form.gender === 'female')}
          >
            <Venus className="size-4 shrink-0" strokeWidth={2} />
            Female
          </button>
        </div>
      </div>
      ) : null}

      {showCity ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(MapPin, 'City', undefined, isMissing('city', form.city) || (showRequired && showCityDropdown && !form.city.trim()))}
        {showCityDropdown || campCities.length > 0 ? (
          <Dropdown
            value={form.city}
            placeholder="Select city"
            options={campCities}
            onChange={onCityChange}
          />
        ) : (
          <input
            className={mobileFieldInput}
            placeholder="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
          />
        )}
      </div>
      ) : null}

      {!hideAddressFields ? (
        <AddressFields
          form={form}
          update={update}
          labelRow={labelRow}
          showMissingRequired={showMissingRequired}
          fields={fields}
        />
      ) : null}

      {visible('participant_blood_group') ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Droplet, 'Blood Group', undefined, isMissing('participant_blood_group', form.bloodGroup))}
        <Dropdown
          value={form.bloodGroup}
          placeholder="Select blood group"
          options={BLOOD_GROUPS}
          onChange={(value) => update('bloodGroup', value)}
        />
      </div>
      ) : null}

      {visible('participants_employee_id') ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Hash, 'Employee ID', undefined, isMissing('participants_employee_id', form.employeeId))}
        <input
          className={mobileFieldInput}
          placeholder="Employee ID"
          value={form.employeeId}
          onChange={(e) => update('employeeId', e.target.value)}
        />
      </div>
      ) : null}

      {visible('participant_department') ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Building2, 'Department', undefined, isMissing('participant_department', form.department))}
        <input
          className={mobileFieldInput}
          placeholder="Department"
          value={form.department}
          onChange={(e) => update('department', e.target.value)}
        />
      </div>
      ) : null}

      {visible('referred_by') ? (
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(UserPlus, 'Referred by', undefined, isMissing('referred_by', form.referredBy))}
        <input
          className={mobileFieldInput}
          placeholder="Referred by"
          value={form.referredBy}
          onChange={(e) => update('referredBy', e.target.value)}
        />
      </div>
      ) : null}

      {consultationOffers.map((offer) => {
        const value = consultationAnswer(form, offer.key)
        return (
          <div key={offer.key} className="flex min-w-0 flex-col gap-1">
            {labelRow(Stethoscope, offer.label, undefined, showRequired && consultationsRequired && !value)}
            <div className="flex h-10 gap-6 overflow-visible">
              <button type="button" className={choiceButtonClass(value === 'yes')} onClick={() => setConsultationAnswer(update, offer.key, 'yes')}>
                Yes
              </button>
              <button type="button" className={choiceButtonClass(value === 'no')} onClick={() => setConsultationAnswer(update, offer.key, 'no')}>
                No
              </button>
            </div>
          </div>
        )
      })}
      </div>

      <p className="font-sans text-[11px] font-normal leading-normal text-[#9A9A9A] lg:hidden">
        Disclaimer: By voluntarily providing your information, you consent to its use solely for
        the Bio AI Health Checkup and related results. Your data will be kept confidential and
        handled securely.
      </p>
    </div>
  )
}

function AddressStep({
  form,
  update,
  labelRow,
  showMissingRequired,
  fields,
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
  fields: CampOnboarding['fields']
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-6">
        <AddressFields
          form={form}
          update={update}
          labelRow={labelRow}
          showMissingRequired={showMissingRequired}
          fields={fields}
        />
      </div>
    </div>
  )
}

function AddressFields({
  form,
  update,
  labelRow,
  showMissingRequired,
  fields,
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
  fields: CampOnboarding['fields']
}) {
  const showRequired = Boolean(showMissingRequired)
  const visible = (key: string) => isOnboardingFieldVisible(fields, key)
  const required = (key: string) => showRequired && isOnboardingFieldRequired(fields, key)
  const isMissing = (key: string, value: string) => required(key) && !value.trim()
  const pincodeError: 'missing' | 'invalid' | undefined = !showRequired
    ? undefined
    : required('pincode') && !form.pincode.trim()
      ? 'missing'
      : form.pincode.trim() && !PINCODE_REGEX.test(form.pincode.trim())
        ? 'invalid'
        : undefined

  const applyPincode = (value: string) => {
    const next = sanitizePincode(value)
    update('pincode', next)
    if (!PINCODE_REGEX.test(next)) return
    void lookupPincode(next)
      .then((location) => {
        if (!location) return
        if (!form.state.trim()) update('state', location.state)
      })
      .catch(() => undefined)
  }

  return (
    <>
      {visible('address') ? (
        <>
          <div className="flex min-w-0 flex-col gap-1">
            {labelRow(Home, 'Address line 1', undefined, isMissing('address', form.street))}
            <input
              className={mobileFieldInput}
              placeholder="Address line 1"
              autoComplete="address-line1"
              value={form.street}
              onChange={(e) => update('street', e.target.value)}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            {labelRow(Home, 'Address line 2')}
            <input
              className={mobileFieldInput}
              placeholder="Address line 2"
              autoComplete="address-line2"
              value={form.landmark}
              onChange={(e) => update('landmark', e.target.value)}
            />
          </div>
        </>
      ) : null}

      {visible('pincode') ? (
        <div className="flex min-w-0 flex-col gap-1">
          {labelRow(MapPin, 'Pincode', undefined, Boolean(pincodeError), pincodeError)}
          <input
            className={mobileFieldInput}
            inputMode="numeric"
            placeholder="Pincode"
            maxLength={6}
            value={form.pincode}
            onChange={(e) => applyPincode(e.target.value)}
          />
        </div>
      ) : null}

      {visible('state') ? (
        <div className="flex min-w-0 flex-col gap-1">
          {labelRow(MapPin, 'State', undefined, isMissing('state', form.state))}
          <input
            className={mobileFieldInput}
            placeholder="State"
            value={form.state}
            onChange={(e) => update('state', e.target.value)}
          />
        </div>
      ) : null}

      {visible('country') ? (
        <div className="flex min-w-0 flex-col gap-1">
          {labelRow(Globe, 'Country', undefined, isMissing('country', form.country))}
          <input
            className={mobileFieldInput}
            placeholder="Country"
            value={form.country}
            onChange={(e) => update('country', e.target.value)}
          />
        </div>
      ) : null}
    </>
  )
}

function ConfirmStep({
  form,
  onEdit,
  onProceed,
  isSubmitting,
  showFields,
  showAddress,
  consultationOffers,
}: {
  form: FormData
  onEdit: (page: BookingPage) => void
  onProceed: () => void
  isSubmitting: boolean
  showFields: CampOnboarding['fields']
  showAddress: boolean
  consultationOffers: ConsultationOffer[]
}) {
  const visible = (key: string) => isOnboardingFieldVisible(showFields, key)
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[18px] font-semibold text-white">Confirm details</h2>

      <section className="rounded-[8px] bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
          <h3 className="text-[15px] font-semibold text-white">Personal Information</h3>
          <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit('personal')}>
            Edit
          </button>
        </div>
        <MemberSummary
          member={form}
          showRelation={false}
          dense
          showFields={showFields}
          hideAddress={showAddress}
          consultationOffers={consultationOffers}
        />
      </section>

      {showAddress ? (
        <section className="rounded-[8px] bg-white/5 p-3">
          <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
            <h3 className="text-[15px] font-semibold text-white">Address</h3>
            <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit('address')}>
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-[11px] text-[#cccccc]">
            {visible('address') ? (
              <>
                <div className="col-span-2">
                  <SummaryItem Icon={Home} label={form.street || '—'} dense />
                </div>
                {form.landmark.trim() ? (
                  <div className="col-span-2">
                    <SummaryItem Icon={Home} label={form.landmark} dense />
                  </div>
                ) : null}
              </>
            ) : null}
            {visible('pincode') ? <SummaryItem Icon={MapPin} label={form.pincode || '—'} dense /> : null}
            {visible('state') ? <SummaryItem Icon={MapPin} label={form.state || '—'} dense /> : null}
            {visible('country') ? <SummaryItem Icon={Globe} label={form.country || '—'} dense /> : null}
          </div>
        </section>
      ) : null}

      {form.appointmentDate || form.appointmentTime ? (
        <section className="rounded-[8px] bg-white/5 p-3">
          <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
            <h3 className="text-[15px] font-semibold text-white">Schedule</h3>
            <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit('schedule')}>
              Edit
            </button>
          </div>
          <SummaryItem
            Icon={Clock}
            label={
              form.appointmentDate
                ? `${formatCollectionDate(form.appointmentDate)}, ${formatCollectionTime(form.appointmentTime)}`
                : '—'
            }
            dense
          />
        </section>
      ) : null}

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

const COLLECTION_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const COLLECTION_MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

function formatCollectionDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return `${COLLECTION_DAY_LABELS[date.getDay()]}, ${date.getDate()} ${COLLECTION_MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`
}

function formatCollectionTime(slot: string): string {
  const trimmed = slot.trim()
  if (!trimmed) return '—'
  if (/am|pm/i.test(trimmed)) return trimmed
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return trimmed
  let hour = Number.parseInt(match[1], 10)
  const minute = match[2]
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) hour = 12
  else if (hour > 12) hour -= 12
  return `${hour}:${minute} ${meridiem}`
}

function MemberSummary({
  member,
  showRelation,
  dense = false,
  showFields,
  hideAddress = false,
  consultationOffers = [],
}: {
  member: FormData
  showRelation: boolean
  dense?: boolean
  showFields?: CampOnboarding['fields']
  hideAddress?: boolean
  consultationOffers?: ConsultationOffer[]
}) {
  const visible = (key: string) => !showFields || isOnboardingFieldVisible(showFields, key)
  const name = [member.firstName, member.lastName].filter(Boolean).join(' ') || '—'
  const GenderIcon = member.gender === 'female' ? Venus : Mars
  const genderLabel = member.gender
    ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1)
    : '—'
  const relationLabel =
    RELATION_OPTIONS.find((o) => o.toLowerCase() === member.relation) ?? member.relation
  const yesNoLabel = (value: FormData['doctorConsultation']) =>
    value === 'yes' ? 'Yes' : value === 'no' ? 'No' : '—'

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
        {visible('phone') ? <SummaryItem Icon={Phone} label={member.phone || '—'} dense={dense} /> : null}
        {visible('gender') ? <SummaryItem Icon={GenderIcon} label={genderLabel} dense={dense} /> : null}
        {visible('age') ? (
          <SummaryItem Icon={Calendar} label={member.age ? `${member.age} Years` : '—'} dense={dense} />
        ) : null}
        <SummaryItem Icon={MapPin} label={member.city || '—'} dense={dense} />
        {visible('participant_blood_group') ? (
          <div className="col-span-2">
            <SummaryItem Icon={Droplet} label={member.bloodGroup ? `Blood group: ${member.bloodGroup}` : '—'} dense={dense} />
          </div>
        ) : null}
        {visible('email') ? (
          <div className="col-span-2">
            <SummaryItem Icon={Mail} label={member.email || '—'} dense={dense} />
          </div>
        ) : null}
        {visible('participants_employee_id') && member.employeeId ? (
          <SummaryItem Icon={Hash} label={member.employeeId} dense={dense} />
        ) : null}
        {visible('participant_department') && member.department ? (
          <SummaryItem Icon={Building2} label={member.department} dense={dense} />
        ) : null}
        {!hideAddress && visible('address') && member.street ? (
          <div className="col-span-2">
            <SummaryItem Icon={Home} label={member.street} dense={dense} />
          </div>
        ) : null}
        {consultationOffers.map((offer) => (
          <div key={offer.key} className="col-span-2">
            <SummaryItem
              Icon={Stethoscope}
              label={`${offer.label}: ${yesNoLabel(consultationAnswer(member, offer.key))}`}
              dense={dense}
            />
          </div>
        ))}
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

function BookingConfirmedStep({ form }: { form: FormData }) {
  const memberName = [form.firstName, form.lastName].filter(Boolean).join(' ') || '—'
  const bookingDateTime = form.appointmentDate
    ? `${formatCollectionDate(form.appointmentDate)}  |  ${formatCollectionTime(form.appointmentTime)}`
    : '—'
  const locationLabel =
    [form.city.trim(), form.appointmentCabinName.trim() || form.appointmentCabin.trim()]
      .filter(Boolean)
      .join(' · ') || '—'

  return (
    <div className="flex min-h-full w-full flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center gap-3">
        <img
          src={bookingSuccessGif}
          alt=""
          draggable={false}
          className="mx-auto h-[148px] w-[148px] object-contain"
        />
        <div className="flex w-full flex-col items-center gap-1 pb-1 text-center">
          <h2 className="text-[18px] font-semibold tracking-[0.2px] text-white">Slot Confirmed!</h2>
          <p className="text-[12px] leading-4 text-[#9a9a9a]">
            Complete the health assessment to confirm your booking.
          </p>
        </div>
      </div>

      <div className="w-full rounded-xl border border-white/10 bg-white/5 px-[17px] py-5 backdrop-blur-[12px]">
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col items-start gap-1">
            <p className="text-[16px] font-semibold leading-5 tracking-[-0.96px] text-white">Step 1</p>
            <p className="text-[11px] leading-[14px] text-[#90df9e]">Completed</p>
          </div>
          <div className="flex flex-col items-start gap-1">
            <p className="text-[16px] font-semibold leading-5 tracking-[-0.96px] text-white">Step 2</p>
            <p className="text-[11px] font-light leading-[14px] text-[#9a9a9a]">Pending</p>
          </div>
        </div>
        <div className="relative mt-4 h-2 w-full rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 w-[29%] rounded-full bg-[#dac15a]" />
          <div className="absolute left-[29%] top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#dac15a] bg-white shadow-[0_0_15px_#dac15a]" />
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 rounded-xl border border-[rgba(144,223,158,0.2)] bg-[rgba(75,141,131,0.1)] p-[13px]">
        <SuccessDetailRow icon={<CalendarIcon />} label="Date & Time" value={bookingDateTime} />
        <SuccessDetailRow icon={<UserIcon />} label="Member name" value={memberName} />
        <SuccessDetailRow icon={<LocationIcon />} label="Location" value={locationLabel} />
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
