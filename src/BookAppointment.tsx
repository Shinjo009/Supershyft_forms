import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Mail,
  Mars,
  Phone,
  User,
  Users,
  Venus,
} from 'lucide-react'
import { ContinueButton } from './components/ContinueButton'
import { onboardUserForEngagement, type OnboardUserPayload } from './api/onboard'
import { PageBackdrop } from './components/PageBackdrop'
import { SavedMemberCard } from './components/SavedMemberCard'
import { Stepper } from './components'
import { defaultFormData, type FormData } from './types'
import supershyftWhiteLogo from './assets/SuperShyft - white logo.svg'

const RELATION_OPTIONS = [
  'Parent',
  'Sibling',
  'Spouse',
  'Child',
  'Grandparent',
  'Other',
] as const
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_REGEX = /^[A-Za-z\s]+$/
const sanitizeName = (value: string) => value.replace(/[^A-Za-z\s]/g, '')
const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 10)
const sanitizeAge = (value: string) => value.replace(/\D/g, '').slice(0, 2)
const MALE_ENGAGEMENT_CODE = 'DMMU0526'
const FEMALE_ENGAGEMENT_CODE = 'DFMU0526'
const logClientError = (message: string) => console.error(`[BookAppointment] ${message}`)
const toApiTimeSlot = (slot: string) => {
  const normalized = slot.trim()
  if (!normalized) return '9:00'
  const firstPart = normalized.split('-')[0]?.trim() || normalized
  const hour = Number.parseInt(firstPart.split(':')[0] || '', 10)
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return '9:00'
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

const BloodGroupIcon: IconType = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10 14"
    aria-hidden
    fill="none"
  >
    <path
      d="M5 0L4.375 0.7C4.375 0.7 3.30833 1.90833 2.23333 3.475C1.15833 5.04167 0 6.91667 0 8.71667C0 10.0427 0.526784 11.3145 1.46447 12.2522C2.40215 13.1899 3.67392 13.7167 5 13.7167C6.32608 13.7167 7.59785 13.1899 8.53553 12.2522C9.47322 11.3145 10 10.0427 10 8.71667C10 6.91667 8.84167 5.04167 7.76667 3.475C6.69167 1.90833 5.625 0.7 5.625 0.7L5 0ZM5 2.60833C5.36667 3.04167 5.7 3.4 6.4 4.41667C7.40833 5.88333 8.33333 7.75 8.33333 8.71667C8.33333 10.5667 6.85 12.05 5 12.05C3.15 12.05 1.66667 10.5667 1.66667 8.71667C1.66667 7.75 2.59167 5.88333 3.6 4.41667C4.3 3.4 4.63333 3.04167 5 2.60833Z"
      fill="#9A9A9A"
    />
  </svg>
)

const DepartmentIcon: IconType = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 15 15"
    aria-hidden
    fill="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.0008 2.5007C10.0011 3.01791 9.84096 3.52247 9.54246 3.94485C9.24396 4.36723 8.8218 4.68663 8.33417 4.85904V6.66737H10.8342C11.4972 6.66737 12.1331 6.93076 12.6019 7.3996C13.0708 7.86844 13.3342 8.50433 13.3342 9.16737V10.1424C13.8904 10.339 14.3593 10.7259 14.6578 11.2347C14.9564 11.7435 15.0654 12.3416 14.9657 12.923C14.866 13.5045 14.5639 14.032 14.1128 14.4123C13.6618 14.7925 13.0908 15.0011 12.5008 15.0011C11.9109 15.0011 11.3399 14.7925 10.8889 14.4123C10.4378 14.032 10.1357 13.5045 10.036 12.923C9.93627 12.3416 10.0453 11.7435 10.3439 11.2347C10.6424 10.7259 11.1113 10.339 11.6675 10.1424V9.16737C11.6675 8.94635 11.5797 8.73439 11.4234 8.57811C11.2671 8.42183 11.0552 8.33404 10.8342 8.33404H4.1675C3.94649 8.33404 3.73453 8.42183 3.57825 8.57811C3.42197 8.73439 3.33417 8.94635 3.33417 9.16737V10.1424C3.89042 10.339 4.35925 10.7259 4.6578 11.2347C4.95636 11.7435 5.06541 12.3416 4.96568 12.923C4.86595 13.5045 4.56386 14.032 4.11281 14.4123C3.66177 14.7925 3.0908 15.0011 2.50084 15.0011C1.91088 15.0011 1.33991 14.7925 0.888862 14.4123C0.437813 14.032 0.135725 13.5045 0.0359959 12.923C-0.0637335 12.3416 0.045317 11.7435 0.343872 11.2347C0.642427 10.7259 1.11126 10.339 1.66751 10.1424V9.16737C1.66751 8.50433 1.9309 7.86844 2.39974 7.3996C2.86858 6.93076 3.50446 6.66737 4.1675 6.66737H6.6675V4.85904C6.23513 4.7064 5.85304 4.43782 5.56301 4.08267C5.27298 3.72753 5.08617 3.29948 5.02301 2.84532C4.95985 2.39116 5.02277 1.92838 5.20488 1.50757C5.38699 1.08676 5.6813 0.72412 6.05561 0.459291C6.42993 0.194462 6.86985 0.037641 7.32728 0.00597255C7.78472 -0.0256959 8.24205 0.0690073 8.64929 0.279729C9.05653 0.49045 9.398 0.809078 9.63636 1.20078C9.87473 1.59248 10.0008 2.04217 10.0008 2.5007ZM7.50084 1.66737C7.27982 1.66737 7.06786 1.75517 6.91158 1.91145C6.7553 2.06773 6.6675 2.27969 6.6675 2.5007C6.6675 2.72172 6.7553 2.93368 6.91158 3.08996C7.06786 3.24624 7.27982 3.33404 7.50084 3.33404C7.72185 3.33404 7.93381 3.24624 8.09009 3.08996C8.24637 2.93368 8.33417 2.72172 8.33417 2.5007C8.33417 2.27969 8.24637 2.06773 8.09009 1.91145C7.93381 1.75517 7.72185 1.66737 7.50084 1.66737ZM2.50084 11.6674C2.27982 11.6674 2.06786 11.7552 1.91158 11.9114C1.7553 12.0677 1.66751 12.2797 1.66751 12.5007C1.66751 12.7217 1.7553 12.9337 1.91158 13.09C2.06786 13.2462 2.27982 13.334 2.50084 13.334C2.72185 13.334 2.93381 13.2462 3.09009 13.09C3.24637 12.9337 3.33417 12.7217 3.33417 12.5007C3.33417 12.2797 3.24637 12.0677 3.09009 11.9114C2.93381 11.7552 2.72185 11.6674 2.50084 11.6674ZM12.5008 11.6674C12.2798 11.6674 12.0679 11.7552 11.9116 11.9114C11.7553 12.0677 11.6675 12.2797 11.6675 12.5007C11.6675 12.7217 11.7553 12.9337 11.9116 13.09C12.0679 13.2462 12.2798 13.334 12.5008 13.334C12.7219 13.334 12.9338 13.2462 13.0901 13.09C13.2464 12.9337 13.3342 12.7217 13.3342 12.5007C13.3342 12.2797 13.2464 12.0677 13.0901 11.9114C12.9338 11.7552 12.7219 11.6674 12.5008 11.6674Z"
      fill="#9A9A9A"
    />
  </svg>
)

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

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/50" aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
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
  const [attemptedPersonalContinue, setAttemptedPersonalContinue] = useState(false)
  const [attemptedScheduleContinue, setAttemptedScheduleContinue] = useState(false)

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }, [])

  useEffect(() => {
    setMaxReachedStep((prev) => Math.max(prev, step))
  }, [step])

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
    if (!form.department.trim()) {
      logClientError('Department is required.')
      return
    }
    if (!form.employeeId.trim()) {
      logClientError('Employee ID is required.')
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
    if (!form.bloodGroup.trim()) {
      logClientError('Blood group is required.')
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
    if (!form.personalizedDoctorConsultation) {
      logClientError('Please select an option for doctor consultation.')
      return
    }

    setStep(3)
  }

  const allMembers = useMemo(() => [...savedMembers, form], [savedMembers, form])

  const handleConfirmBooking = async () => {
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

    setIsSubmittingBooking(true)

    try {
      const wantsDoctorConsultation = form.personalizedDoctorConsultation === 'yes'

      const payload: OnboardUserPayload = {
        age: safeAge,
        first_name: form.firstName,
        last_name: form.lastName,
        email: trimmedEmail,
        phone: trimmedPhone,
        gender: form.gender,
        blood_collection_date: form.appointmentDate,
        blood_collection_time_slot: toApiTimeSlot(form.appointmentTime),
        participants_employee_id: form.employeeId.trim(),
        participant_department: form.department.trim(),
        participant_blood_group: form.bloodGroup.trim(),
        want_doctor_consultation: wantsDoctorConsultation,
      }

      const engagementCode = form.gender === 'female' ? FEMALE_ENGAGEMENT_CODE : MALE_ENGAGEMENT_CODE
      await onboardUserForEngagement(engagementCode, payload)
      setStep(4)
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
  const showBack = step === 4 ? false : isLg ? step > 1 : step > 1
  const stretchStepBody = !isLg || step === 3 || step === 4
  const hideGlobalContinue = mobilePersonal || step === 4 || step === 1
  const mobileHeader = isMobile
  const hideStepper = step === 4
  const showHeaderTitle = step !== 4

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
            <img src={supershyftWhiteLogo} alt="SuperShyft" className="h-16 w-16 object-contain" />
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
                  <div className="min-w-0 text-center">
                    <h1 className="whitespace-nowrap text-[17px] font-semibold leading-tight tracking-tight text-white">
                      {desktopWelcomeTitle}
                    </h1>
                    <p className="mt-1 text-[12px] leading-normal text-[#cfcfcf]">
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

          <div
            className={`flex min-h-0 flex-col ${stretchStepBody ? 'flex-1' : 'flex-none'} ${
              mobilePersonal
                ? ''
                : isMobile
                  ? step === 4
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
              <ScheduleStep
                form={form}
                update={update}
                isMobile={isMobile}
                showMissingRequired={attemptedScheduleContinue}
              />
            )}
            {step === 3 && (
              <ConfirmStep
                form={form}
                members={allMembers}
                onEdit={(s) => setStep(s)}
                onProceed={handleConfirmBooking}
                isSubmitting={isSubmittingBooking}
              />
            )}
            {step === 4 && (
              <BookingConfirmedStep
                form={form}
                members={allMembers}
                isMobile={isMobile}
              />
            )}
          </div>

          {mobilePersonal && step === 1 && null}

          {/* Footer CTA — mobile: full-width bar pinned to bottom with 30px safe-area; desktop: right-aligned pill */}
          {!hideGlobalContinue && (
            isMobile ? (
              step < 3 ? (
                <div className="mt-auto shrink-0 px-6 pt-4 pb-[30px]">
                  <ContinueButton
                    variant="mobileBar"
                    onClick={() => {
                      if (step === 1) goNextFromPersonal()
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
                  step < 3 ? 'mt-6 flex' : 'mt-auto flex pt-8',
                  'justify-end',
                ].join(' ')}
              >
                {step < 3 && (
                  <ContinueButton
                    onClick={() => {
                      if (step === 1) goNextFromPersonal()
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
            {labelRow(BloodGroupIcon, 'Blood Group', undefined, true, isMissing(form.bloodGroup))}
            <div className="relative">
              <select
                className={`${mobileFieldInput14} appearance-none pr-10 ${form.bloodGroup ? 'text-white' : 'text-white/40'}`}
                value={form.bloodGroup}
                onChange={(e) => update('bloodGroup', e.target.value)}
              >
                <option value="" disabled className="bg-[#101a1a] text-[#d0d0d0]">
                  Blood Group
                </option>
                {BLOOD_GROUP_OPTIONS.map((group) => (
                  <option key={group} value={group} className="bg-[#101a1a] text-white">
                    {group}
                  </option>
                ))}
              </select>
              <SelectChevron />
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
            {labelRow(DepartmentIcon, 'Department', undefined, true, isMissing(form.department))}
            <input
              className={mobileFieldInput14}
              placeholder="Department"
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
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
            {labelRow(Mail, 'Company Email ID', undefined, true, Boolean(emailError), emailError)}
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
            {labelRow(DepartmentIcon, 'Department', undefined, true, isMissing(form.department))}
            <input
              className={mobileFieldInput14}
              placeholder="Department"
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
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

          <div className="flex flex-col gap-1">
            {labelRow(BloodGroupIcon, 'Blood Group', undefined, true, isMissing(form.bloodGroup))}
            <div className="relative">
              <select
                className={`${mobileFieldInput14} appearance-none pr-10 ${form.bloodGroup ? 'text-white' : 'text-white/40'}`}
                value={form.bloodGroup}
                onChange={(e) => update('bloodGroup', e.target.value)}
              >
                <option value="" disabled className="bg-[#101a1a] text-[#d0d0d0]">
                  Blood Group
                </option>
                {BLOOD_GROUP_OPTIONS.map((group) => (
                  <option key={group} value={group} className="bg-[#101a1a] text-white">
                    {group}
                  </option>
                ))}
              </select>
              <SelectChevron />
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
            {labelRow(DepartmentIcon, 'Department', undefined, false, isMissing(form.department))}
            <input
              className={inputClass()}
              placeholder="Department"
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
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
            {labelRow(BloodGroupIcon, 'Blood Group', undefined, false, isMissing(form.bloodGroup))}
            <div className="relative">
              <select
                className={`${inputClass()} appearance-none pr-10 ${form.bloodGroup ? 'text-white' : 'text-white/40'}`}
                value={form.bloodGroup}
                onChange={(e) => update('bloodGroup', e.target.value)}
              >
                <option value="" disabled className="bg-[#101a1a] text-[#d0d0d0]">
                  Blood Group
                </option>
                {BLOOD_GROUP_OPTIONS.map((group) => (
                  <option key={group} value={group} className="bg-[#101a1a] text-white">
                    {group}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
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
          {labelRow(Mail, 'Company Email Id', undefined, false, Boolean(emailError), emailError)}
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
          {labelRow(DepartmentIcon, 'Department', undefined, false, isMissing(form.department))}
          <input
            className={inputClass()}
            placeholder="Department"
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
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
          {labelRow(BloodGroupIcon, 'Blood Group', undefined, false, isMissing(form.bloodGroup))}
          <div className="relative">
            <select
              className={`${inputClass()} appearance-none pr-10 ${form.bloodGroup ? 'text-white' : 'text-white/40'}`}
              value={form.bloodGroup}
              onChange={(e) => update('bloodGroup', e.target.value)}
            >
              <option value="" disabled className="bg-[#101a1a] text-[#d0d0d0]">
                Blood Group
              </option>
              {BLOOD_GROUP_OPTIONS.map((group) => (
                <option key={group} value={group} className="bg-[#101a1a] text-white">
                  {group}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
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
  const schedulePreview = formatSchedulePreview(form.appointmentDate, form.appointmentTime)
  return (
    <>
      <h2 className="mb-6 text-2xl font-medium text-white lg:mb-8">Details Preview</h2>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <section className="flex-1 rounded-lg bg-white/5 p-5">
          <div className="mb-5 flex items-center justify-between border-b border-white/20 pb-2">
            <h3 className="text-[15px] font-semibold text-white">Personal Information</h3>
            <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(1)}>
              Edit
            </button>
          </div>
          {members.map((m, i) => (
            <div key={i}>
              {i > 0 && (
                <div
                  className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[#4b8d83]/60 to-transparent"
                  aria-hidden
                />
              )}
              <MemberSummary
                member={m}
                showRelation={i > 0}
              />
            </div>
          ))}
        </section>

        <section className="flex flex-1 flex-col gap-6">
          <div className="rounded-lg bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/20 pb-2">
              <h3 className="text-[15px] font-semibold text-white">Schedule Date</h3>
              <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(2)}>
                Edit
              </button>
            </div>
            <ul className="space-y-4 text-sm text-[#ccc]">
              <li className="flex gap-2">
                <Calendar className="mt-0.5 size-5 shrink-0 opacity-70" />
                {schedulePreview}
              </li>
            </ul>
          </div>
          <ContinueButton
            className="w-full max-w-none"
            showChevron={false}
            disabled={isSubmitting}
            onClick={onProceed}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
          </ContinueButton>
        </section>
      </div>
    </>
  )
}

function MemberSummary({
  member,
  showRelation,
}: {
  member: FormData
  showRelation: boolean
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
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 text-sm text-[#cccccc]">
        {showRelation ? (
          <>
            <SummaryItem Icon={User} label={name} />
            <SummaryItem Icon={User} label={relationLabel || '—'} capitalize />
          </>
        ) : (
          <div className="col-span-2">
            <SummaryItem Icon={User} label={name} />
          </div>
        )}
        <SummaryItem Icon={Calendar} label={member.age ? `${member.age} Years` : '—'} />
        <SummaryItem Icon={GenderIcon} label={genderLabel} />
        <div className="col-span-2">
          <SummaryItem Icon={Phone} label={member.phone || '—'} />
        </div>
        <div className="col-span-2">
          <SummaryItem Icon={Mail} label={member.email || '—'} />
        </div>
      </div>
    </div>
  )
}

function SummaryItem({
  Icon,
  label,
  capitalize,
}: {
  Icon: typeof User
  label: string
  capitalize?: boolean
}) {
  return (
    <div className="flex items-start gap-2 leading-snug">
      <Icon className="mt-0.5 size-[18px] shrink-0 opacity-70" strokeWidth={1.75} />
      <span className={['truncate', capitalize ? 'capitalize' : ''].join(' ')}>{label}</span>
    </div>
  )
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

type UpcomingDate = { iso: string; day: string; date: number }

function getOrdinalDay(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`
  const last = day % 10
  if (last === 1) return `${day}st`
  if (last === 2) return `${day}nd`
  if (last === 3) return `${day}rd`
  return `${day}th`
}

function getMayDates(): UpcomingDate[] {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = new Date().getFullYear()
  return [5, 6].map((dayOfMonth) => {
    const d = new Date(year, 4, dayOfMonth)
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
  const timeSlots = ['9:00AM - 10:00AM', '10:00AM - 11:00AM', '11:00AM - 12:00PM']

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
              ? 'grid w-full grid-cols-2 gap-3 self-stretch'
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
                    ? 'flex h-[78px] w-full flex-col items-center justify-center gap-1 rounded-[8px] border transition'
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
                    'font-sans text-[15px] font-semibold leading-none',
                    selected ? 'text-white' : 'text-[#cccccc]/80',
                  ].join(' ')}
                >
                  {`${getOrdinalDay(d.date)} May`}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className={`flex flex-col items-start self-stretch ${isMobile ? 'gap-3' : 'gap-6'}`}>
        <div className="flex items-center gap-2">
          <PreferredTimeSlotIcon />
          <h2 className={sectionLabelClass}>
            Preferred Time Slot
            {showMissingRequired && !form.appointmentTime ? (
              <span className="text-[#ff6b6b]"> * Field is required</span>
            ) : null}
          </h2>
        </div>
        <div className={isMobile ? 'grid w-full grid-cols-2 gap-3' : 'grid w-full grid-cols-3 gap-4'}>
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
                    ? 'flex h-10 w-full items-center justify-center rounded-[8px] border text-sm transition'
                    : 'flex h-[44px] w-full items-center justify-center rounded-[6px] border text-sm transition',
                  selected ? selectedDateClass : idleDateClass,
                ].join(' ')}
              >
                <span className={selected ? 'text-white' : 'text-[#cccccc]/80'}>{slot}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className={`flex flex-col items-start self-stretch ${isMobile ? 'gap-3' : 'gap-6'}`}>
        <h2 className={sectionLabelClass}>
          Would you like to have personalised Doctor consultations?
          {showMissingRequired && !form.personalizedDoctorConsultation ? (
            <span className="text-[#ff6b6b]"> * Field is required</span>
          ) : null}
        </h2>
        <div className={isMobile ? 'flex h-10 w-full gap-6' : 'flex w-full gap-3'}>
          <button
            type="button"
            onClick={() => update('personalizedDoctorConsultation', 'yes')}
            className={[
              isMobile
                ? 'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs leading-4 transition'
                : 'flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[6px] text-sm text-[#9a9a9a]',
              form.personalizedDoctorConsultation === 'yes'
                ? 'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] text-white'
                : isMobile
                  ? 'bg-white/5 text-[#999]'
                  : 'bg-[linear-gradient(90deg,rgba(37,52,53,0.72)_0%,rgba(13,21,23,0.64)_100%)]',
            ].join(' ')}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => update('personalizedDoctorConsultation', 'no')}
            className={[
              isMobile
                ? 'flex flex-1 items-center justify-center gap-2 rounded-full px-2.5 py-1 text-xs leading-4 transition'
                : 'flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[6px] text-sm',
              form.personalizedDoctorConsultation === 'no'
                ? 'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] text-white'
                : isMobile
                  ? 'bg-white/5 text-[#999]'
                  : 'bg-[linear-gradient(90deg,rgba(37,52,53,0.72)_0%,rgba(13,21,23,0.64)_100%)] text-[#9a9a9a]',
            ].join(' ')}
          >
            No
          </button>
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

function formatSchedulePreview(iso: string, slot: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  const safeSlot = slot || '—'
  if (Number.isNaN(d.getTime())) return `${iso} | ${safeSlot}`
  return `${getOrdinalDay(d.getDate())} ${MONTH_LABELS[d.getMonth()]} | ${safeSlot}`
}

function BookingConfirmedStep({
  form,
  members,
  isMobile,
}: {
  form: FormData
  members: FormData[]
  isMobile: boolean
}) {
  const memberNames = members
    .map((m) => [m.firstName, m.lastName].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ')
  const bookingDate = formatBookingDate(form.appointmentDate)
  const bookingDateTime = `${bookingDate} | ${form.appointmentTime || '—'}`

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center self-stretch">
        <div className="flex w-full flex-col items-center gap-6 pt-[60px]">
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

          <div className="flex w-full flex-col items-center gap-5 self-stretch rounded-[8px] border border-[#90DF9E]/20 bg-[#4B8D83]/10 p-6">
            <div className="flex w-full flex-col items-start gap-3.5">
              <InfoRow icon={<UserIcon />} label="Name" value={memberNames || '—'} isMobile />
              <InfoRow icon={<CalendarIcon />} label="Date & Time" value={bookingDateTime} isMobile />
            </div>
          </div>
        </div>

        <div className="mt-auto flex w-full flex-col items-center gap-3 pb-[50px] pt-6">
          <a
            href="https://app.supershyft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[36px] border border-[#969696] bg-gradient-to-r from-[#296359] to-[#41AB99] px-6 py-2.5 text-center text-[16px] font-bold text-white shadow-[0_12px_20px_0_rgba(255,255,255,0.15)] transition hover:brightness-110"
          >
            Continue to Our App
          </a>
          <p className="text-center font-sans text-[13px] font-medium leading-normal text-[#999]">
            Log in to complete your questionnaire and access your detailed helath insights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center self-stretch">
      <div className="flex flex-col items-center gap-6 pb-10">
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

        <div className="flex w-[517px] max-w-full flex-col items-center gap-[30px] rounded-[8px] border border-[#90DF9E]/20 bg-[#4B8D83]/10 p-6">
          <div className="flex flex-col items-start gap-5 self-stretch">
            <InfoRow icon={<UserIcon />} label="Name" value={memberNames || '—'} />
            <InfoRow icon={<CalendarIcon />} label="Date & Time" value={bookingDateTime} />
          </div>
        </div>
      </div>

      <a
        href="https://app.supershyft.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-[10px] flex h-[49px] w-[231.53px] items-center justify-center gap-2 rounded-[36px] border border-[#969696] bg-gradient-to-r from-[#296359] to-[#41AB99] px-6 py-2.5 text-center text-[15px] font-bold text-white shadow-[0_12px_20px_0_rgba(255,255,255,0.15)] transition hover:brightness-110"
      >
        Continue to Our App
      </a>
      <p className="mt-3 text-center text-[15px] font-medium leading-[22.5px] text-[#999]">
        Log in to complete your questionnaire and access your detailed helath insights.
      </p>
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
            ? 'pl-[30px] font-sans text-[10px] font-normal leading-normal text-[#9A9A9A]'
            : 'pl-8 text-[12px] font-normal leading-none text-[#9A9A9A]',
        ].join(' ')}
      >
        {label}
      </span>
      <div className={isMobile ? 'mt-1 flex items-center gap-3' : 'mt-1 flex items-center gap-3'}>
        <span
          className={isMobile ? 'flex size-[18px] shrink-0 items-center justify-center' : 'flex size-5 shrink-0 items-center justify-center'}
          aria-hidden
        >
          {icon}
        </span>
        <span
          className={isMobile ? 'min-w-0 font-sans text-[15px] font-medium leading-normal text-[#CCC]' : 'min-w-0 truncate text-[20px] font-medium leading-none text-[#CCC]'}
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

