import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Droplet,
  Mail,
  MapPin,
  Mars,
  Phone,
  User,
  Venus,
} from 'lucide-react'
import { ContinueButton } from './components/ContinueButton'
import {
  CITY_LOCATION,
  MUMBAI_BLOOD_COLLECTION,
  isBookingCity,
} from './lib/bookingDates'
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
import { isFrontendOnly } from './lib/frontendOnly'
import { applyAnswersToQuestions, type AnswerValue } from './lib/questionnaireVisibility'
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
import { Dropdown } from './components/ui/dropdown-01'
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
const sanitizeName = (value: string) => value.replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, ' ')
const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 10)
const sanitizeAge = (value: string) => value.replace(/\D/g, '').slice(0, 2)
const sanitizeEmail = (value: string) => value.replace(/\s/g, '')
const generateParticipantId = (phone: string) => `HRM${phone || String(Date.now()).slice(-10)}`
const BOOK_APPOINTMENT_ERROR_EVENT = 'book-appointment:error'
const logClientError = (message: string) => {
  console.error(`[BookAppointment] ${message}`)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BOOK_APPOINTMENT_ERROR_EVENT, { detail: message }))
  }
}

function formatAddressForApi(form: FormData): string {
  return form.city.trim()
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

export default function BookAppointment() {
  const [step, setStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [form, setForm] = useState<FormData>(() => ({
    ...defaultFormData,
    gender: 'male',
    city: 'Mumbai',
    state: CITY_LOCATION.Mumbai.state,
    pincode: CITY_LOCATION.Mumbai.pincode,
    appointmentDate: MUMBAI_BLOOD_COLLECTION.date,
    appointmentTime: MUMBAI_BLOOD_COLLECTION.timeSlot,
  }))
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
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    if (uiError) setUiError('')
    if (key === 'phone' || key === 'email') {
      setOtpVerified(false)
    }
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
    const trimmedPhone = form.phone.trim()
    const trimmedEmail = form.email.trim()
    const trimmedAge = form.age.trim()
    const trimmedFirstName = form.firstName.trim()
    const trimmedLastName = form.lastName.trim()
    setAttemptedPersonalContinue(true)

    if (ENFORCE_REQUIRED_FIELDS) {
      if (!trimmedFirstName) {
        logClientError('First name is required.')
        return
      }
      if (!NAME_REGEX.test(trimmedFirstName)) {
        logClientError('First name can only contain letters and spaces.')
        return
      }
      if (!trimmedLastName) {
        logClientError('Last name is required.')
        return
      }
      if (!NAME_REGEX.test(trimmedLastName)) {
        logClientError('Last name can only contain letters and spaces.')
        return
      }
      if (!trimmedPhone) {
        logClientError('Phone is required.')
        return
      }
      if (!PHONE_REGEX.test(trimmedPhone)) {
        logClientError('Enter a valid 10-digit mobile number.')
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
        logClientError('Age must be between 1 and 99.')
        return
      }
      if (!form.gender) {
        logClientError('Gender is required.')
        return
      }
      if (!isBookingCity(form.city)) {
        logClientError('Please select a city.')
        return
      }
      if (!form.bloodGroup.trim()) {
        logClientError('Please select a blood group.')
        return
      }
    }

    if (!trimmedPhone || !PHONE_REGEX.test(trimmedPhone)) {
      logClientError('Enter a valid 10-digit mobile number.')
      return
    }

    setUiError('')
    setStep(2)
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
      setStep(5)
    } catch (error) {
      logClientError(error instanceof Error ? error.message : 'Unable to verify OTP.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (isResendingOtp || isVerifyingOtp) return

    setUiError('')
    setIsResendingOtp(true)

    try {
      await resendBookingOtp({ phone: form.phone.trim() })
    } catch (error) {
      logClientError(error instanceof Error ? error.message : 'Unable to resend OTP.')
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleConfirmBooking = async () => {
    if (isSubmittingBooking) return

    const trimmedPhone = form.phone.trim()
    const trimmedEmail = form.email.trim()
    const trimmedAge = form.age.trim()
    const parsedAge = Number.parseInt(form.age, 10)
    const safeAge = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : NaN
    const participantId = form.employeeId.trim() || generateParticipantId(trimmedPhone)
    const cityMeta = isBookingCity(form.city) ? CITY_LOCATION[form.city] : null
    const apiAddress = formatAddressForApi(form)
    const apiPincode = form.pincode.trim() || cityMeta?.pincode || ''
    const apiCity = form.city.trim()
    const apiState = form.state.trim() || cityMeta?.state || ''

    if (ENFORCE_REQUIRED_FIELDS) {
      if (!form.firstName.trim() || !NAME_REGEX.test(form.firstName.trim())) {
        logClientError('Enter a valid first name.')
        return
      }
      if (!form.lastName.trim() || !NAME_REGEX.test(form.lastName.trim())) {
        logClientError('Enter a valid last name.')
        return
      }
      if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
        logClientError('Please enter a valid email address.')
        return
      }
      if (!trimmedPhone || !PHONE_REGEX.test(trimmedPhone)) {
        logClientError('Enter a valid 10-digit mobile number.')
        return
      }
      if (!form.gender) {
        logClientError('Gender is required.')
        return
      }
      if (!AGE_REGEX.test(trimmedAge) || !Number.isFinite(safeAge)) {
        logClientError('Age must be between 1 and 99.')
        return
      }
      if (!isBookingCity(apiCity)) {
        logClientError('Please select a city.')
        return
      }
      if (!form.bloodGroup.trim()) {
        logClientError('Please select a blood group.')
        return
      }
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
        state: apiState || 'Maharashtra',
        country: 'India',
        blood_collection_date: form.appointmentDate || null,
        blood_collection_time_slot: form.appointmentTime || null,
        blood_collection_cabin: null,
        participants_employee_id: participantId,
        participant_blood_group: form.bloodGroup.trim(),
        consultations: {
          eye: false,
          doctor: false,
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
        pin_code: form.pincode.trim() || cityMeta?.pincode || '000000',
        city: form.city.trim() || 'NA',
        state: form.state.trim() || cityMeta?.state || 'Maharashtra',
        country: 'India',
        is_participant: true,
        status: 'active',
      })
      const onboardResult = await onboardUserForEngagement(payload)
      const nextPreviewAvailable = Boolean(onboardResult.previewAvailable)
      const nextAssessmentInstanceId = onboardResult.assessmentInstanceId ?? null
      setPreviewAvailable(nextPreviewAvailable)
      setPreferredAssessmentInstanceId(nextAssessmentInstanceId)
      if (otpVerified) {
        setStep(5)
        return
      }
      try {
        await sendBookingOtp({ phone: trimmedPhone })
      } catch (otpError) {
        logClientError(otpError instanceof Error ? otpError.message : 'Unable to send OTP.')
      }
      setStep(3)
    } catch (error) {
      logClientError(error instanceof Error ? error.message : 'Unable to confirm booking.')
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

  const openCategoryQuestions = (categoryId: number, questions: QuestionnaireQuestion[]) => {
    const merged = mergeQuestionnaireQuestions(questionsByCategoryId[categoryId], questions)
    const withDrafts = applyAnswersToQuestions(merged, answersByCategoryId[categoryId])
    setQuestionsByCategoryId((prev) => ({ ...prev, [categoryId]: withDrafts }))
    setCategoryQuestions(withDrafts)
  }

  const handleContinueToAssessment = async (overrides?: {
    previewAvailable?: boolean
    preferredAssessmentInstanceId?: number | null
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
      setAssessmentInstanceId(result.assessmentInstanceId)
      setAssessmentCategories(categories)
      setCompletedCategoryIds(
        usePreview
          ? []
          : categories
              .filter((category) => isCategoryCompleted(category, []))
              .map((category) => Number(category.category_id)),
      )
      console.info('[assessment] step 2 categories loaded', {
        assessmentInstanceId: result.assessmentInstanceId,
        previewAvailable: usePreview,
        categories: categories.map((c) => c.category_key),
      })
      setStep(6)
    } catch (error) {
      logClientError(
        error instanceof Error ? error.message : 'Unable to load health assessment categories.',
      )
    } finally {
      setIsLoadingAssessmentCategories(false)
    }
  }

  const handleLoadCategory = async (
    category: AssessmentCategoryStatus,
    options?: { returnStep?: number },
  ) => {
    if (isLoadingQuestionnaire) return

    const categoryId = Number(category.category_id || 0)
    if (!assessmentInstanceId || categoryId <= 0) {
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
        assessmentInstanceId,
        categoryId,
        { includeAllQuestions: previewAvailable },
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
        assessmentInstanceId,
        categoryId,
        categoryKey: category.category_key,
        questionCount: questions.length,
        questionAll: previewAvailable,
      })
    } catch (error) {
      if (cachedQuestions?.length) {
        beginCategory(cachedQuestions)
        return
      }
      logClientError(
        error instanceof Error ? error.message : 'Unable to load questionnaire questions.',
      )
      if (options?.returnStep) setStep(options.returnStep)
    } finally {
      setIsLoadingQuestionnaire(false)
      setLoadingCategoryId(null)
    }
  }

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
      setStep(13)
    }
  }

  const mobileScreenTitle = 'Book Appointment for Bio-AI health camp.'

  const showBack = step > 1 && step !== 3 && step !== 5 && step !== 13
  const hideGlobalContinue = step === 2 || step === 3 || step >= 5
  const hideStepper = step >= 4
  const hideMainHeader = step === 6 || step === 7 || step === 8 || step === 9 || step === 10 || step === 12
  const confirmStepperBorder = step === 2

  const handleStepContinue = () => {
    if (step === 1) goNextFromPersonal()
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
      wide={step <= 3}
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
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="flex size-8 items-center justify-start text-white"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" strokeWidth={2} />
            </button>
          ) : (
            <span className="size-8" aria-hidden />
          )}
          <h1 className="flex min-w-0 items-center justify-center gap-2 overflow-visible text-center text-[15px] font-semibold leading-5 text-white lg:gap-4 lg:text-[20px] lg:leading-6">
            <img
              src={superShyftLogo}
              alt=""
              className="h-10 w-10 shrink-0 object-contain"
              aria-hidden
            />
            <span className="min-w-0">{mobileScreenTitle}</span>
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
              current={step}
              maxReachable={maxReachedStep}
              onStepClick={step === 3 ? undefined : (target) => setStep(target)}
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
            {step === 1 && (
              <PersonalStep
                form={form}
                update={update}
                labelRow={labelRow}
                showMissingRequired={ENFORCE_REQUIRED_FIELDS && attemptedPersonalContinue}
              />
            )}
            {step === 2 && (
              <ConfirmStep
                form={form}
                onEdit={(s) => setStep(s)}
                onProceed={handleConfirmBooking}
                isSubmitting={isSubmittingBooking}
              />
            )}
            {step === 3 && (
              <OtpVerifyStep
                key={form.phone}
                phone={form.phone}
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
              {step === 1 ? (
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

  const applyCity = (city: string) => {
    if (city === 'Pune') return
    update('city', city)
    if (isBookingCity(city)) {
      update('state', CITY_LOCATION[city].state)
      update('pincode', CITY_LOCATION[city].pincode)
    } else {
      update('state', '')
      update('pincode', '')
    }
    if (city === 'Mumbai') {
      update('appointmentDate', MUMBAI_BLOOD_COLLECTION.date)
      update('appointmentTime', MUMBAI_BLOOD_COLLECTION.timeSlot)
      return
    }
    update('appointmentDate', '')
    update('appointmentTime', '')
    update('appointmentCabin', '')
    update('appointmentCabinName', '')
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-6">
      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(User, 'Full Name', undefined, Boolean(fullNameError), fullNameError)}
        <div className="flex gap-2">
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
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Phone, 'Phone', undefined, Boolean(phoneError), phoneError)}
        <input
          className={mobileFieldInput}
          inputMode="tel"
          placeholder="Phone"
          maxLength={10}
          pattern="^[6-9]\d{9}$"
          title="10-digit mobile number starting with 6-9"
          value={form.phone}
          onChange={(e) => update('phone', sanitizePhone(e.target.value))}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Mail, 'Email', undefined, Boolean(emailError), emailError)}
        <input
          className={mobileFieldInput}
          type="email"
          inputMode="email"
          placeholder="Email"
          autoComplete="email"
          pattern="^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
          title="Enter a valid email address"
          value={form.email}
          onChange={(e) => update('email', sanitizeEmail(e.target.value))}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Calendar, 'Age', undefined, Boolean(ageError), ageError)}
        <input
          className={mobileFieldInput}
          inputMode="numeric"
          placeholder="Age"
          maxLength={2}
          pattern="^(?:[1-9]|[1-9]\d)$"
          title="Age must be between 1 and 99"
          value={form.age}
          onChange={(e) => update('age', sanitizeAge(e.target.value))}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(User, 'Gender', undefined, isMissingGender)}
        <div className="flex h-10 gap-6 overflow-visible">
          <button
            type="button"
            onClick={() => {
              if (form.gender === 'male') return
              update('gender', 'male')
            }}
            className={[
              'flex flex-1 origin-center items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] leading-4 transition duration-200 hover:z-[1] hover:scale-[1.03]',
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
            onClick={() => {
              if (form.gender === 'female') return
              update('gender', 'female')
            }}
            className={[
              'flex flex-1 origin-center items-center justify-center gap-2.5 rounded-full px-2.5 py-1 text-[15px] leading-4 transition duration-200 hover:z-[1] hover:scale-[1.03]',
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

      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(MapPin, 'City', undefined, isMissing(form.city))}
        <Dropdown
          value={form.city}
          placeholder="Select city"
          options={[{ value: 'Mumbai' }, { value: 'Pune', disabled: true }]}
          onChange={applyCity}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        {labelRow(Droplet, 'Blood Group', undefined, isMissing(form.bloodGroup))}
        <Dropdown
          value={form.bloodGroup}
          placeholder="Select blood group"
          options={BLOOD_GROUPS}
          onChange={(value) => update('bloodGroup', value)}
        />
      </div>
      </div>

      <p className="font-sans text-[11px] font-normal leading-normal text-[#9A9A9A] lg:hidden">
        Disclaimer: By voluntarily providing your information, you consent to its use solely for
        the Bio AI Health Checkup and related results. Your data will be kept confidential and
        handled securely.
      </p>
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
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[18px] font-semibold text-white">Confirm details</h2>

      <section className="rounded-[8px] bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
          <h3 className="text-[15px] font-semibold text-white">Personal Information</h3>
          <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(1)}>
            Edit
          </button>
        </div>
        <MemberSummary member={form} showRelation={false} dense />
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
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return slot || '—'
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
        <SummaryItem Icon={MapPin} label={member.city || '—'} dense={dense} />
        {member.city === 'Mumbai' && member.appointmentDate ? (
          <div className="col-span-2">
            <SummaryItem
              Icon={Clock}
              label={`${formatCollectionDate(member.appointmentDate)}, ${formatCollectionTime(member.appointmentTime)}`}
              dense={dense}
            />
          </div>
        ) : null}
        <div className="col-span-2">
          <SummaryItem Icon={Droplet} label={member.bloodGroup ? `Blood group: ${member.bloodGroup}` : '—'} dense={dense} />
        </div>
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
