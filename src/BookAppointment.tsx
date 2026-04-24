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

const RELATION_OPTIONS = [
  'Parent',
  'Sibling',
  'Spouse',
  'Child',
  'Grandparent',
  'Other',
] as const

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
    'w-full rounded-[8px] bg-white/5 px-4 text-base text-white outline-none ring-1 ring-white/5 placeholder:text-[#9a9a9a] focus:ring-[#4b8d83]/70 lg:text-sm',
    short ? 'h-10' : 'h-[44px]',
  ].join(' ')
}

/** Figma mobile: 20px icon, 8px gap, Lato Medium 14px #999. Desktop: ~14px icon, 13px label #9a9a9a */
function labelRow(
  Icon: typeof User,
  label: string,
  extra?: React.ReactNode,
  mobile?: boolean,
) {
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
  const [bookingId, setBookingId] = useState<string>('')
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }, [])

  useEffect(() => {
    setMaxReachedStep((prev) => Math.max(prev, step))
  }, [step])

  const primaryMember = savedMembers[0]

  const goNextFromPersonal = () => {
    setStep(2)
  }

  const goNextFromSchedule = () => {
    setStep(3)
  }

  const allMembers = useMemo(() => [...savedMembers, form], [savedMembers, form])

  const handleConfirmBooking = async () => {
    if (isSubmittingBooking) return

    const parsedAge = Number.parseInt(form.age, 10)
    const safeAge = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : NaN

    if (!form.firstName.trim()) {
      setSubmitError('First name is required.')
      return
    }
    if (!form.lastName.trim()) {
      setSubmitError('Last name is required.')
      return
    }
    if (!form.email.trim()) {
      setSubmitError('Email is required.')
      return
    }
    if (!form.phone.trim()) {
      setSubmitError('Phone is required.')
      return
    }
    if (!form.gender) {
      setSubmitError('Gender is required.')
      return
    }
    if (!Number.isFinite(safeAge)) {
      setSubmitError('Please enter a valid age.')
      return
    }
    if (!form.appointmentDate) {
      setSubmitError('Please select a schedule date.')
      return
    }

    setSubmitError(null)
    setIsSubmittingBooking(true)

    try {
      const inferredDobYear = new Date().getFullYear() - safeAge
      const inferredDob = `${inferredDobYear}-01-01`

      const payload: OnboardUserPayload = {
        age: safeAge,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        dob: inferredDob,
        address: [form.street, form.landmark].filter(Boolean).join(', ') || 'NA',
        pincode: form.pincode || 'NA',
        city: form.city || 'NA',
        state: 'NA',
        country: 'India',
        referred_by: '',
        blood_collection_date: form.appointmentDate,
        blood_collection_time_slot: '9:00',
      }

      const engagementCode = import.meta.env.VITE_ENGAGEMENT_CODE || ''
      const responseMessage = await onboardUserForEngagement(engagementCode, payload)

      setBookingId((prev) => prev || responseMessage || generateBookingId())
      setStep(4)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to confirm booking.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const headerTitle = 'Book Appointment'

  const glassPanel =
    'rounded-[18px] border border-white/12 bg-black/18 shadow-[0_26px_70px_rgba(0,0,0,0.35)] backdrop-blur-[2px]'
  /** Mobile step 1: full-bleed on backdrop — no framed card/border (matches Figma). */
  const mobileStep1Layout = 'flex w-full min-h-0 flex-1 flex-col overflow-hidden'

  const isMobile = !isLg
  const mobilePersonal = isMobile && step === 1
  const showBack = step === 4 ? false : isLg ? step > 1 : step > 1
  const stretchStepBody = !isLg || step === 3 || step === 4
  const hideGlobalContinue = mobilePersonal || step === 4
  const mobileHeader = isMobile
  const hideStepper = step === 4

  return (
    <PageBackdrop>
      <div
        className={`mx-auto flex flex-col lg:max-w-none lg:min-h-svh lg:px-10 lg:py-14 ${
          mobilePersonal
            ? 'h-dvh max-h-dvh min-h-0 overflow-hidden px-0 py-0'
            : isMobile
              ? 'min-h-svh px-0 py-0'
              : 'min-h-svh max-w-[980px] px-4 py-6 pb-24'
        }`}
      >
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
                : 'mb-6 flex items-center gap-3 lg:mb-6 lg:gap-4'
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
                <h1 className="text-center font-sans text-[20px] font-semibold leading-normal text-white">
                  {headerTitle}
                </h1>
                <span aria-hidden />
              </>
            ) : (
              <>
                {showBack ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    className="shrink-0 rounded-lg p-1 text-white hover:bg-white/10"
                    aria-label="Back"
                  >
                    <ArrowLeft className="size-5 lg:size-6" />
                  </button>
                ) : (
                  <span className="w-6 shrink-0" aria-hidden />
                )}
                <h1 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight text-white lg:text-[24px] lg:leading-none lg:tracking-[-0.5px]">
                  {headerTitle}
                </h1>
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
                ? 'min-h-0 overflow-hidden'
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
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
                    <PersonalStep
                      form={form}
                      update={update}
                      isLg={isLg}
                      inputClass={inputClass}
                      labelRow={labelRow}
                      onContinue={goNextFromPersonal}
                      showMobileContinue={false}
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
                    showMobileContinue={false}
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
              <ScheduleStep form={form} update={update} isMobile={isMobile} />
            )}
            {step === 3 && (
              <ConfirmStep
                form={form}
                members={allMembers}
                onEdit={(s) => setStep(s)}
                onProceed={handleConfirmBooking}
                isSubmitting={isSubmittingBooking}
                errorMessage={submitError}
              />
            )}
            {step === 4 && (
              <BookingConfirmedStep
                bookingId={bookingId}
                form={form}
                members={allMembers}
                isMobile={isMobile}
              />
            )}
          </div>

          {mobilePersonal && step === 1 && (
            <div className="shrink-0 px-6 pt-2 pb-[30px]">
              <ContinueButton variant="mobileBar" onClick={goNextFromPersonal}>
                Continue
              </ContinueButton>
            </div>
          )}

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
  'h-10 w-full rounded-lg border-0 bg-white/5 px-4 text-white outline-none ring-1 ring-transparent placeholder:text-[#9a9a9a] focus:ring-[#4b8d83]'
const mobileFieldInput14 = `${mobileFieldInput} text-base`

function PersonalStep({
  form,
  update,
  isLg,
  inputClass,
  labelRow,
  onContinue,
  showMobileContinue,
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
    Icon: typeof User,
    label: string,
    extra?: React.ReactNode,
    mobile?: boolean,
  ) => React.ReactNode
  onContinue: () => void
  showMobileContinue: boolean
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
            {labelRow(User, 'Full Name', undefined, true)}
            <div className="flex gap-2">
              <input
                className={`${mobileFieldInput14} min-w-0 flex-1`}
                placeholder="First name"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
              />
              <input
                className={`${mobileFieldInput14} min-w-0 flex-1`}
                placeholder="Last Name"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(User, 'Gender', undefined, true)}
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
            {labelRow(Users, 'Relation', undefined, true)}
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
            {labelRow(Calendar, 'Age', undefined, true)}
            <input
              className={mobileFieldInput14}
              inputMode="numeric"
              placeholder="Age"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
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
            )}
            <input
              className={mobileFieldInput14}
              inputMode="tel"
              placeholder="+91 999999999"
              disabled={form.useSamePhone}
              value={phoneValue}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(
              Mail,
              'Email',
              <UseSameToggle checked={form.useSameEmail} onChange={toggleUseSameEmail} />,
              true,
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
        </div>
      </div>
    )
  }

  if (!isLg) {
    return (
      <div className="flex min-h-0 flex-col gap-5 pb-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            {labelRow(User, 'Full Name', undefined, true)}
            <div className="flex gap-2">
              <input
                className={`${mobileFieldInput14} min-w-0 flex-1`}
                placeholder="First name"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
              />
              <input
                className={`${mobileFieldInput14} min-w-0 flex-1`}
                placeholder="Last Name"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(Phone, 'Phone', undefined, true)}
            <input
              className={mobileFieldInput14}
              inputMode="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(Mail, 'Email', undefined, true)}
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
            {labelRow(Calendar, 'Age', undefined, true)}
            <input
              className={mobileFieldInput14}
              inputMode="numeric"
              placeholder="Age"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(User, 'Gender', undefined, true)}
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
          <div className="mt-6 pb-4 pt-2">
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
            {labelRow(User, 'Full Name')}
            <input
              className={inputClass()}
              placeholder="Full Name"
              value={[form.firstName, form.lastName].filter(Boolean).join(' ')}
              onChange={(e) => {
                const parts = e.target.value.split(' ')
                update('firstName', parts[0] ?? '')
                update('lastName', parts.slice(1).join(' '))
              }}
            />
          </div>

          <div>
            {labelRow(
              Phone,
              'Phone',
              <UseSameToggle
                checked={form.useSamePhone}
                onChange={toggleUseSamePhone}
              />,
            )}
            <input
              className={inputClass()}
              placeholder="+91 999999999"
              inputMode="tel"
              disabled={form.useSamePhone}
              value={phoneValue}
              onChange={(e) => update('phone', e.target.value)}
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
            {labelRow(Calendar, 'Age')}
            <input
              className={inputClass()}
              placeholder="Age"
              inputMode="numeric"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
            />
          </div>

          <div>
            {labelRow(Users, 'Relation')}
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

          <div>
            {labelRow(User, 'Gender')}
            {genderButtons}
          </div>
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
          {labelRow(User, 'Full Name')}
          <input
            className={inputClass()}
            placeholder="Full Name"
            value={[form.firstName, form.lastName].filter(Boolean).join(' ')}
            onChange={(e) => {
              const parts = e.target.value.split(' ')
              update('firstName', parts[0] ?? '')
              update('lastName', parts.slice(1).join(' '))
            }}
          />
        </div>

        <div>
          {labelRow(User, 'Gender')}
          {genderButtons}
        </div>

        <div>
          {labelRow(Mail, 'Email')}
          <input
            className={inputClass()}
            placeholder="Email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>

        <div>
          {labelRow(Calendar, 'Age')}
          <input
            className={inputClass()}
            placeholder="Age"
            value={form.age}
            onChange={(e) => update('age', e.target.value)}
          />
        </div>

        <div>
          {labelRow(Phone, 'Phone')}
          <input
            className={inputClass()}
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
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
  errorMessage,
}: {
  form: FormData
  members: FormData[]
  onEdit: (step: number) => void
  onProceed: () => void
  isSubmitting: boolean
  errorMessage: string | null
}) {
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
                {form.appointmentDate}
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
          {errorMessage && <p className="text-sm text-[#ff9e9e]">{errorMessage}</p>}
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

function getMayDates(): UpcomingDate[] {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = new Date().getFullYear()
  return [4, 5].map((dayOfMonth) => {
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

function ScheduleStep({
  form,
  update,
  isMobile,
}: {
  form: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  isMobile: boolean
}) {
  const dates = useMemo(() => getMayDates(), [])

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
            <h2 className={sectionLabelClass}>Preferred Date</h2>
          </div>
        ) : (
          <h2 className={sectionLabelClass}>Preferred Date</h2>
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
        <p className={isMobile ? 'text-[12px] text-[#ccc]' : 'text-[15px] font-light leading-none text-[#999]'}>
          Timing: 9am to 1pm
        </p>
      </section>

    </div>
  )
}

function generateBookingId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
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

function BookingConfirmedStep({
  bookingId,
  form,
  members,
  isMobile,
}: {
  bookingId: string
  form: FormData
  members: FormData[]
  isMobile: boolean
}) {
  const memberNames = members
    .map((m) => [m.firstName, m.lastName].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ')
  const bookingDate = formatBookingDate(form.appointmentDate)

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
            <div className="flex flex-col items-center self-stretch">
              <span className="text-center font-sans text-[14px] font-normal leading-[24px] text-[#9A9A9A]">
                Booking ID
              </span>
              <span className="font-sans text-[20px] font-bold leading-[28px] text-white">
                {bookingId || '—'}
              </span>
            </div>

            <div className="flex w-full flex-col items-start gap-3.5">
              <InfoRow icon={<CalendarIcon />} label="Date" value={bookingDate} isMobile />
              <InfoRow icon={<UserIcon />} label="Member Name" value={memberNames || '—'} isMobile />
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
            Download the App
          </a>
          <p className="text-center font-sans text-[13px] font-medium leading-normal text-[#999]">
            OR
          </p>
          <p className="text-center font-sans text-[13px] font-medium leading-normal text-[#999]">
            We will get in touch with you on Whatsapp/ Email
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
          <div className="flex flex-col items-center">
            <span className="text-center text-[20px] font-normal leading-[40px] text-[#9A9A9A]">
              Booking ID
            </span>
            <span className="text-[30px] font-bold leading-[40px] text-white">
              {bookingId || '—'}
            </span>
          </div>

          <div className="flex flex-col items-start gap-5 self-stretch">
            <InfoRow icon={<CalendarIcon />} label="Date" value={bookingDate} />
            <InfoRow icon={<UserIcon />} label="Member Name" value={memberNames || '—'} />
          </div>
        </div>
      </div>

      <a
        href="https://app.supershyft.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-[10px] flex h-[49px] w-[231.53px] items-center justify-center gap-2 rounded-[36px] border border-[#969696] bg-gradient-to-r from-[#296359] to-[#41AB99] px-6 py-2.5 text-center text-[15px] font-bold text-white shadow-[0_12px_20px_0_rgba(255,255,255,0.15)] transition hover:brightness-110"
      >
        Download the App
      </a>

      <p className="mt-3 text-center text-[14px] font-medium leading-[22.5px] text-[#999]">OR</p>
      <p className="text-center text-[15px] font-medium leading-[22.5px] text-[#999]">
        We will get in touch with you on Whatsapp/ Email
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
    <div className="flex items-start gap-3 self-stretch">
      <span
        className={
          isMobile
            ? 'mt-[6px] flex size-[18px] shrink-0 items-center justify-center'
            : 'mt-[18px] flex size-5 shrink-0 items-center justify-center'
        }
        aria-hidden
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={
            isMobile
              ? 'font-sans text-[10px] font-normal leading-normal text-[#9A9A9A]'
              : 'text-[12px] font-normal leading-none text-[#9A9A9A]'
          }
        >
          {label}
        </span>
        <span
          className={
            isMobile
              ? 'mt-1 font-sans text-[15px] font-medium leading-normal text-[#CCC]'
              : 'mt-1 truncate text-[20px] font-medium leading-none text-[#CCC]'
          }
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

