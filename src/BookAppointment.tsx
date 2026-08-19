import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ChevronDown,
  Mail,
  Mars,
  Phone,
  User,
  Venus,
} from 'lucide-react'
import { ContinueButton } from './components/ContinueButton'
import { formatShortBookingDate } from './lib/bookingDates'
import {
  onboardUserForEngagement,
  type OnboardUserForEngagementPayload,
} from './api/onboard'
import { resendBookingOtp, sendBookingOtp, verifyBookingOtp } from './api/otp'
import { createEmployeeUser } from './api/users'
import {
  isCategoryCompleted,
  loadAssessmentCategoriesForStep2,
  normalizeCategoryKey,
  submitCompletedAssessmentFlow,
  type AssessmentCategoryStatus,
} from './api/assessments'
import {
  getCategoryQuestionnaire,
  type QuestionnaireQuestion,
} from './api/questionnaire'
import { getAccessToken } from './lib/authStorage'
import { isFrontendOnly } from './lib/frontendOnly'
import { applyAnswersToQuestions, type AnswerValue } from './lib/questionnaireVisibility'
import {
  findQuestionnaireDraft,
  upsertQuestionnaireDraft,
  type CategoryQuestionnaireDraft,
} from './lib/questionnaireDrafts'
import { getMockQuestionnaireQuestions } from './data/mockApiQuestionnaires'
import { PageBackdrop } from './components/PageBackdrop'
import { Stepper } from './components'
import { defaultFormData, type FormData } from './types'
import backgroundAssessmentSvg from './assets/Background.svg'
import lastPageBackgroundSvg from './assets/lastpage BG.svg'
import nutritionEndBackgroundSvg from './assets/nutritionend.svg'
import nutritionLogBackgroundSvg from './assets/nutritionlogstart.svg'
import familyHistoryBackgroundSvg from './assets/family history.svg'
import lifestyleHabitsBackgroundSvg from './assets/lifestyle-habits/background.svg'
import { ApiQuestionnaireStep } from './components/ApiQuestionnaireStep'
import { HealthAssessmentStep } from './components/HealthAssessmentStep'
import {
  SectionCompleteHub,
  type SectionCompleteVariant,
} from './components/SectionCompleteHub'
import { AppointmentJourneyCompleteStep } from './components/AppointmentJourneyCompleteStep'
import { OtpVerifyStep } from './components/OtpVerifyStep'
import bookingSuccessGif from './assets/animation-gif.gif'

const RELATION_OPTIONS = [
  'Parent',
  'Sibling',
  'Spouse',
  'Child',
  'Grandparent',
  'Other',
] as const

const DEPARTMENT_OPTIONS = ['Sales', 'Marketing', 'Operations', 'Others'] as const

const ENFORCE_REQUIRED_FIELDS = true
const NAME_REGEX = /^[A-Za-z]+(?:[ .'-]+[A-Za-z]+)*$/
const PHONE_REGEX = /^[6-9]\d{9}$/
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const AGE_REGEX = /^(?:[1-9]|[1-9]\d)$/
const sanitizeName = (value: string) => value.replace(/[^A-Za-z .'-]/g, '').replace(/\s+/g, ' ')
const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 10)
const sanitizeAge = (value: string) => value.replace(/\D/g, '').slice(0, 2)
const sanitizeEmail = (value: string) => value.replace(/\s/g, '')
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

function resolveCategoryId(category: AssessmentCategoryStatus): number {
  for (const value of [category.category_id, category.id]) {
    const id = Number(value)
    if (Number.isFinite(id) && id > 0) return id
  }
  return 0
}

function categoryDraftKeys(category: AssessmentCategoryStatus): string[] {
  const keys = [
    String(category.category_id || ''),
    String(category.id || ''),
    normalizeCategoryKey(category.category_key),
  ]
  return [...new Set(keys.filter((key) => key && key !== '0' && key !== 'nan'))]
}

function withDraftAnswers(
  questions: QuestionnaireQuestion[],
  draft?: CategoryQuestionnaireDraft,
): QuestionnaireQuestion[] {
  if (!draft || Object.keys(draft.answers).length === 0) return questions
  return applyAnswersToQuestions(questions, draft.answers)
}

function bookingAge(form: FormData, fallback = 25): number {
  const parsed = Number.parseInt(form.age, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function buildOnboardPayload(
  form: FormData,
  employeeId: string,
): OnboardUserForEngagementPayload {
  return {
    age: bookingAge(form),
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    gender: form.gender || 'male',
    address: 'NA',
    pincode: '000000',
    city: 'NA',
    state: 'Maharashtra',
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
  const [bookingDisplayId, setBookingDisplayId] = useState('')
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [isLoadingAssessmentCategories, setIsLoadingAssessmentCategories] = useState(false)
  const [assessmentInstanceId, setAssessmentInstanceId] = useState<number | null>(null)
  const [assessmentCategories, setAssessmentCategories] = useState<AssessmentCategoryStatus[]>([])
  const [completedCategoryIds, setCompletedCategoryIds] = useState<number[]>([])
  const [activeCategory, setActiveCategory] = useState<AssessmentCategoryStatus | null>(null)
  const [categoryQuestions, setCategoryQuestions] = useState<QuestionnaireQuestion[]>([])
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, CategoryQuestionnaireDraft>>(
    {},
  )
  const categoryDraftsRef = useRef(categoryDrafts)
  categoryDraftsRef.current = categoryDrafts
  const [isLoadingQuestionnaire, setIsLoadingQuestionnaire] = useState(false)
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null)
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false)
  const [hubVariant, setHubVariant] = useState<SectionCompleteVariant>('family')
  const [questionnaireReturnStep, setQuestionnaireReturnStep] = useState(6)
  const [uiError, setUiError] = useState('')
  const [attemptedPersonalContinue, setAttemptedPersonalContinue] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [hasCreatedUser, setHasCreatedUser] = useState(false)
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)

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
      logClientError('Enter a valid age between 1 and 99.')
      return
    }
    if (!form.gender) {
      logClientError('Gender is required.')
      return
    }
    if (!form.department) {
      logClientError('Department is required.')
      return
    }

    setUiError('')
    setStep(2)
  }

  const handleVerifyOtp = async (otp: string) => {
    if (isVerifyingOtp) return

    setUiError('')
    setIsVerifyingOtp(true)

    const openHealthAssessment = async () => {
      const accessToken = getAccessToken()
      const result = await loadAssessmentCategoriesForStep2(accessToken)
      setAssessmentInstanceId(result.assessmentInstanceId)
      setAssessmentCategories(result.categories)
      setCompletedCategoryIds(
        result.categories
          .filter((category) => isCategoryCompleted(category, []))
          .map((category) => Number(category.category_id)),
      )
      setStep(6)
    }

    try {
      if (!otpVerified) {
        await verifyBookingOtp({ phone: form.phone.trim() }, otp)
        setOtpVerified(true)
      }

      if (!hasOnboarded) {
        const apiEmployeeId = bookingDisplayId.replace(/\s/g, '') || generateEmployeeIdForApi()
        const onboardResult = await onboardUserForEngagement(buildOnboardPayload(form, apiEmployeeId))
        setHasOnboarded(true)
        setBookingDisplayId(apiEmployeeId)

        if (onboardResult.alreadyEnrolled) {
          try {
            await openHealthAssessment()
          } catch (error) {
            logClientError(
              error instanceof Error ? error.message : 'Unable to load health assessment.',
            )
          }
          return
        }
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
      if (!form.department) {
        logClientError('Department is required.')
        return
      }
      if (!AGE_REGEX.test(trimmedAge) || !Number.isFinite(safeAge)) {
        logClientError('Enter a valid age between 1 and 99.')
        return
      }
      if (!form.appointmentDate) {
        logClientError('Please select a schedule date.')
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

    try {
      const confirmAge = Number.isFinite(safeAge) ? safeAge : 25
      const email = EMAIL_REGEX.test(trimmedEmail) ? trimmedEmail : null

      if (!hasCreatedUser) {
        await createEmployeeUser({
          age: confirmAge,
          phone: trimmedPhone,
          first_name: form.firstName.trim() || null,
          last_name: form.lastName.trim() || null,
          email,
          gender: form.gender || null,
          address: 'NA',
          pin_code: '000000',
          city: 'NA',
          state: 'Maharashtra',
          country: 'India',
          is_participant: true,
          status: 'active',
        })
        setHasCreatedUser(true)
      }

      await sendBookingOtp({ phone: trimmedPhone })
      setStep(3)
    } catch (error) {
      logClientError(error instanceof Error ? error.message : 'Unable to send OTP.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const hubStepForVariant = (variant: SectionCompleteVariant) => {
    if (variant === 'lifestyle') return 10
    if (variant === 'nutrition') return 12
    return 8
  }

  const variantForCategory = (category: AssessmentCategoryStatus): SectionCompleteVariant => {
    const key = normalizeCategoryKey(category.category_key)
    if (key.includes('lifestyle')) return 'lifestyle'
    if (key.includes('nutrition')) return 'nutrition'
    return 'family'
  }

  const handleContinueToAssessment = async () => {
    if (isLoadingAssessmentCategories) return

    setUiError('')
    setIsLoadingAssessmentCategories(true)

    try {
      const accessToken = getAccessToken()
      const result = await loadAssessmentCategoriesForStep2(accessToken)
      setAssessmentInstanceId(result.assessmentInstanceId)
      setAssessmentCategories(result.categories)
      setCompletedCategoryIds(
        result.categories
          .filter((category) => isCategoryCompleted(category, []))
          .map((category) => Number(category.category_id)),
      )
      console.info('[assessment] step 2 categories loaded', {
        assessmentInstanceId: result.assessmentInstanceId,
        categories: result.categories.map((c) => c.category_key),
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

  const persistCategoryDraft = (
    category: AssessmentCategoryStatus,
    questions: QuestionnaireQuestion[],
    answers: Record<number, AnswerValue>,
  ) => {
    const keys = categoryDraftKeys(category)
    const draft: CategoryQuestionnaireDraft = {
      questions: applyAnswersToQuestions(questions, answers),
      answers,
    }
    setCategoryDrafts((prev) => {
      const next = { ...prev }
      for (const key of keys) next[key] = draft
      return next
    })
    if (assessmentInstanceId) {
      upsertQuestionnaireDraft(assessmentInstanceId, keys, draft)
    }
  }

  const handleLoadCategory = async (
    category: AssessmentCategoryStatus,
    options?: { returnStep?: number },
  ) => {
    if (isLoadingQuestionnaire) return

    const categoryId = resolveCategoryId(category)
    if (!assessmentInstanceId || categoryId <= 0) {
      logClientError('Assessment category is missing. Go back and continue to Step 2 again.')
      return
    }

    setUiError('')
    setIsLoadingQuestionnaire(true)
    setLoadingCategoryId(categoryId)
    setQuestionnaireReturnStep(options?.returnStep ?? hubStepForVariant(hubVariant))

    const draftKeys = categoryDraftKeys(category)
    const draft = findQuestionnaireDraft(
      assessmentInstanceId,
      categoryDraftsRef.current,
      draftKeys,
    )

    const openWithQuestions = (
      questions: QuestionnaireQuestion[],
      source = draft,
    ) => {
      const merged = withDraftAnswers(questions, source)
      setActiveCategory(category)
      setCategoryQuestions(merged)
      persistCategoryDraft(category, merged, source?.answers ?? {})
      setUiError('')
      setStep(7)
    }

    try {
      if (draft?.questions.length) {
        openWithQuestions(draft.questions, draft)
        return
      }

      if (isFrontendOnly()) {
        const questions = getMockQuestionnaireQuestions(category.category_key)
        if (questions.length === 0) {
          throw new Error('No mock questions available for this category yet.')
        }
        openWithQuestions(questions)
        return
      }

      const accessToken = getAccessToken()
      const idsToTry = [...new Set(
        [categoryId, Number(category.category_id), Number(category.id)].filter(
          (id) => Number.isFinite(id) && id > 0,
        ),
      )]

      let questions: QuestionnaireQuestion[] = []
      for (const id of idsToTry) {
        try {
          const questionnaire = await getCategoryQuestionnaire(
            accessToken,
            assessmentInstanceId,
            id,
          )
          questions = Array.isArray(questionnaire.questions) ? questionnaire.questions : []
          if (questions.length > 0) break
        } catch (error) {
          console.warn(
            '[assessment] questionnaire fetch failed',
            { categoryId: id, message: error instanceof Error ? error.message : error },
          )
        }
      }

      if (questions.length === 0) {
        questions = getMockQuestionnaireQuestions(category.category_key)
      }

      if (questions.length === 0) {
        throw new Error('No questions returned for this category.')
      }

      openWithQuestions(questions)
    } catch (error) {
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

  const handleCategoryQuestionnaireComplete = (
    answers: Record<number, AnswerValue> = {},
  ) => {
    if (!activeCategory) {
      setStep(questionnaireReturnStep || 8)
      return
    }

    const categoryId = resolveCategoryId(activeCategory)
    const wasAlreadyCompleted = isCategoryCompleted(activeCategory, completedCategoryIds)
    const existing = findQuestionnaireDraft(
      assessmentInstanceId,
      categoryDraftsRef.current,
      categoryDraftKeys(activeCategory),
    )
    const mergedAnswers = { ...existing?.answers, ...answers }
    const sourceQuestions = existing?.questions?.length
      ? existing.questions
      : categoryQuestions
    persistCategoryDraft(activeCategory, sourceQuestions, mergedAnswers)
    setCompletedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev : [...prev, categoryId],
    )

    // Re-editing a previous section should return to the hub the user came from
    // (e.g. nutrition complete → family → finish → nutrition complete).
    if (wasAlreadyCompleted) {
      setStep(questionnaireReturnStep)
      return
    }

    const variant = variantForCategory(activeCategory)
    setHubVariant(variant)
    setStep(hubStepForVariant(variant))
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

  const mobileScreenTitle = 'Book Appointment'

  const showBack = step > 1 && step !== 5 && step !== 13
  const hideGlobalContinue = step === 2 || step === 3 || step === 5 || step === 6 || step === 7 || step === 8 || step === 10 || step === 12 || step === 13
  const hideStepper = step >= 5
  const hideMainHeader = step === 6 || step === 7 || step === 8 || step === 10 || step === 12
  const confirmStepperBorder = step === 2

  const handleStepContinue = () => {
    goNextFromPersonal()
  }

  const continueVariant = 'mobileBarCompact' as const

  const activeCategoryKey = normalizeCategoryKey(activeCategory?.category_key || '')
  const questionnaireBackground =
    activeCategoryKey.includes('lifestyle')
      ? lifestyleHabitsBackgroundSvg
      : activeCategoryKey.includes('nutrition')
        ? nutritionLogBackgroundSvg
        : familyHistoryBackgroundSvg

  return (
    <PageBackdrop
      mobileBackgroundSrc={
        step === 13
          ? lastPageBackgroundSvg
          : step === 6 || step === 8
            ? backgroundAssessmentSvg
            : step === 10
              ? nutritionEndBackgroundSvg
              : step === 12
                ? nutritionLogBackgroundSvg
                : step === 7
                  ? questionnaireBackground
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
              onClick={() =>
                setStep((s) => {
                  if (s === 5) return 2
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
          <h1 className="text-center text-[20px] font-semibold leading-6 text-white">
            {mobileScreenTitle}
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
              : step === 6 || step === 7 || step === 8 || step === 10 || step === 12 || step === 13
                ? 'px-0 pb-0 pt-0'
                : 'px-6 pb-4 pt-8'
          }`}
        >
          <div
            className={
              step === 7
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
              <ConfirmStep
                form={form}
                onEdit={(s) => {
                  setHasCreatedUser(false)
                  setHasOnboarded(false)
                  setOtpVerified(false)
                  setStep(s)
                }}
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
                onChangeNumber={() => {
                  setHasCreatedUser(false)
                  setHasOnboarded(false)
                  setOtpVerified(false)
                  setStep(1)
                }}
              />
            )}
            {step === 5 && (
              <BookingConfirmedStep form={form} />
            )}
            {step === 6 && (
              <HealthAssessmentStep
                categories={assessmentCategories}
                isStarting={isLoadingQuestionnaire}
                onStartAssessment={handleStartAssessment}
              />
            )}
            {step === 7 && activeCategory && categoryQuestions.length > 0 ? (
              <ApiQuestionnaireStep
                key={`${resolveCategoryId(activeCategory)}-${normalizeCategoryKey(activeCategory.category_key)}`}
                title={activeCategory.display_name || 'Assessment'}
                questions={categoryQuestions}
                assessmentInstanceId={assessmentInstanceId ?? 1}
                categoryId={resolveCategoryId(activeCategory)}
                theme={
                  normalizeCategoryKey(activeCategory.category_key).includes('lifestyle')
                    ? 'lifestyle'
                    : normalizeCategoryKey(activeCategory.category_key).includes('nutrition')
                      ? 'nutrition'
                      : 'family'
                }
                onBack={() => setStep(questionnaireReturnStep)}
                onComplete={handleCategoryQuestionnaireComplete}
                onAnswersChange={(answers) => {
                  const existing = findQuestionnaireDraft(
                    assessmentInstanceId,
                    categoryDraftsRef.current,
                    categoryDraftKeys(activeCategory),
                  )
                  persistCategoryDraft(
                    activeCategory,
                    existing?.questions?.length ? existing.questions : categoryQuestions,
                    { ...existing?.answers, ...answers },
                  )
                }}
              />
            ) : null}
            {(step === 8 || step === 10 || step === 12) && (
              <SectionCompleteHub
                variant={step === 8 ? 'family' : step === 10 ? 'lifestyle' : 'nutrition'}
                categories={assessmentCategories}
                completedCategoryIds={completedCategoryIds}
                isLoadingCategoryId={loadingCategoryId}
                isContinuing={isSubmittingAssessment}
                onSelectCategory={(category) =>
                  handleLoadCategory(category, { returnStep: step })
                }
                onContinue={step === 12 ? handleSubmitCompletedAssessment : undefined}
              />
            )}
            {step === 13 && (
              <AppointmentJourneyCompleteStep bookingId={bookingDisplayId} />
            )}
          </div>

          {step === 5 ? (
            <ContinueButton
              variant="mobileBar"
              className="mt-6 !h-[52px] w-full shrink-0 border border-[#969696] shadow-[0_12px_20px_rgba(255,255,255,0.15)]"
              disabled={isLoadingAssessmentCategories}
              onClick={handleContinueToAssessment}
            >
              {isLoadingAssessmentCategories ? 'Loading...' : 'Continue to Step 2'}
            </ContinueButton>
          ) : !hideGlobalContinue ? (
            <div className="mt-3 shrink-0">
              <ContinueButton
                variant={continueVariant}
                disabled={isLoadingQuestionnaire}
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
  const isMissingDepartment = showRequired && !form.department
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
          pattern="[1-9][0-9]?"
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

      <div className="flex flex-col gap-1">
        {labelRow(Briefcase, 'Department', undefined, isMissingDepartment)}
        <div className="relative">
          <select
            className={`${mobileFieldInput} appearance-none pr-10 ${form.department ? '' : '!text-[#9a9a9a]'}`}
            value={form.department}
            onChange={(e) => update('department', e.target.value as FormData['department'])}
          >
            <option value="" disabled>
              Department
            </option>
            {DEPARTMENT_OPTIONS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9a9a9a]"
            strokeWidth={1.75}
          />
        </div>
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

      <section className="rounded-[8px] bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
          <h3 className="text-[15px] font-semibold text-white">Sample Collection</h3>
        </div>
        <div className="text-[11px] font-light text-[#ccc]">
          <SummaryItem Icon={Calendar} label={formatBookingDate(form.appointmentDate)} dense />
        </div>
      </section>

      <ContinueButton
        className="mt-3 w-full max-w-none"
        showChevron={false}
        variant="mobileBarCompact"
        disabled={isSubmitting}
        onClick={onProceed}
      >
        {isSubmitting ? 'Sending OTP...' : 'Continue & Send OTP'}
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
        <SummaryItem Icon={Briefcase} label={member.department || '—'} dense={dense} />
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
          <h2 className="text-[18px] font-semibold tracking-[0.2px] text-white">
            Slot Confirmed!
          </h2>
          <p className="text-[12px] leading-4 text-[#9a9a9a]">
            Complete the health assessment to confirm your booking.
          </p>
        </div>
      </div>

      <div className="w-full rounded-xl border border-white/10 bg-white/5 px-[17px] py-5 backdrop-blur-[12px]">
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col items-start gap-1">
            <p className="text-[16px] font-semibold leading-5 tracking-[-0.96px] text-white">
              Step 1
            </p>
            <p className="text-[11px] leading-[14px] text-[#90df9e]">Completed</p>
          </div>
          <div className="flex flex-col items-start gap-1">
            <p className="text-[16px] font-semibold leading-5 tracking-[-0.96px] text-white">
              Step 2
            </p>
            <p className="text-[11px] font-light leading-[14px] text-[#9a9a9a]">Pending</p>
          </div>
        </div>
        <div className="relative mt-4 h-2 w-full rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 w-[29%] rounded-full bg-[#dac15a]" />
          <div className="absolute left-[29%] top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#dac15a] bg-white shadow-[0_0_15px_#dac15a]" />
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 rounded-xl border border-[rgba(144,223,158,0.2)] bg-[rgba(75,141,131,0.1)] p-[13px]">
        <SuccessDetailRow icon={<CalendarIcon />} label="Date" value={bookingDate} />
        <SuccessDetailRow icon={<UserIcon />} label="Member name" value={memberName} />
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

