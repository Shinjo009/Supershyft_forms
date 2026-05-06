import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Home,
  IdCard,
  Mail,
  MapPin,
  Mars,
  Phone,
  User,
  Users,
  Venus,
} from 'lucide-react'
import { ContinueButton } from './components/ContinueButton'
import { PageBackdrop } from './components/PageBackdrop'
import { SavedMemberCard } from './components/SavedMemberCard'
import { Stepper } from './components'
import { defaultFormData, type FormData } from './types'
import areaStreetIcon from './assets/AreaStreet.svg'
import landmarkIcon from './assets/landmark.svg'
import pincodeIcon from './assets/pincode.svg'
import { onboardUserForEngagement } from './onboardUserForEngagementApi'

const ALLOWED_EMPLOYEE_IDS = new Set([
  '0000IN0210', '0000IN0221', '0000IN0224', '0000IN0227', '0000IN0228', '0000IN0229',
  '0000IN0232', '0000IN0233', '0000IN0235', '0000IN0237', '0000IN0245', '0000IN0277',
  '0000IN0315', '0000IN0335', '0000IN0338', '0000IN0351', '0000IN0354', '0000IN0368',
  '0000IN0406', '0000IN0424', '0000IN0426', '0000IN0428', '0000IN0442', '0000IN0451',
  '0000IN0508', '0000IN0524', '0000IN0543', '0000IN0547', '0000IN0548', '0000IN0550',
  '0000IN0551', '0000IN0554', '0000IN0555', '0000IN0560', '0000IN0561', '0000IN0564',
  '0000IN0567', '0000IN0570', '0000IN0580', '0000IN0583', '0000IN0584', '0000IN0585',
  // Reusable test ID: can book multiple times.
  '0000IN000',
])

const REUSABLE_TEST_EMPLOYEE_IDS = new Set(['0000IN000'])
const USED_EMPLOYEE_IDS_STORAGE_KEY = 'supershyft-used-employee-ids'

function normalizeEmployeeId(value: string): string {
  return value.trim().toUpperCase()
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}

function getUsedEmployeeIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(USED_EMPLOYEE_IDS_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(
      parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => normalizeEmployeeId(item)),
    )
  } catch {
    return new Set()
  }
}

function persistUsedEmployeeId(employeeId: string) {
  if (typeof window === 'undefined') return
  const normalized = normalizeEmployeeId(employeeId)
  if (!normalized || REUSABLE_TEST_EMPLOYEE_IDS.has(normalized)) return
  const used = getUsedEmployeeIds()
  used.add(normalized)
  try {
    window.localStorage.setItem(USED_EMPLOYEE_IDS_STORAGE_KEY, JSON.stringify([...used]))
  } catch {
    // ignore storage write failures
  }
}

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
    'w-full rounded-[8px] bg-white/5 px-4 text-base lg:text-sm text-white outline-none ring-1 ring-white/5 placeholder:text-[#9a9a9a] focus:ring-[#4b8d83]/70',
    short ? 'h-10' : 'h-[44px]',
  ].join(' ')
}

/** Figma mobile: 20px icon, 8px gap, Lato Medium 14px #999. Desktop: ~14px icon, 13px label #9a9a9a */
function labelRow(
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>,
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
        className={`font-medium ${mobile ? 'text-[13px] text-[#999]' : 'text-[13px] text-[#9a9a9a]'}`}
      >
        {label}
      </span>
      {extra}
    </div>
  )
}

function AreaStreetIcon({ className }: { className?: string; strokeWidth?: number }) {
  return <img src={areaStreetIcon} alt="" className={className} aria-hidden />
}

function LandmarkIcon({ className }: { className?: string; strokeWidth?: number }) {
  return <img src={landmarkIcon} alt="" className={className} aria-hidden />
}

function PincodeIcon({ className }: { className?: string; strokeWidth?: number }) {
  return <img src={pincodeIcon} alt="" className={className} aria-hidden />
}

export default function BookAppointment() {
  const isLg = useIsLg()
  const [step, setStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultFormData)
  const [savedMembers, setSavedMembers] = useState<FormData[]>([])
  const [expandedMemberIndex, setExpandedMemberIndex] = useState<number | null>(null)
  const [bookingId, setBookingId] = useState<string>('')
  const [stepError, setStepError] = useState('')

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setStepError('')
    setForm((f) => ({ ...f, [key]: value }))
  }, [])

  const primaryMember = savedMembers[0]

  const goToStep = useCallback((nextStep: number) => {
    setStep(nextStep)
    setMaxReachedStep((prev) => Math.max(prev, nextStep))
    setStepError('')
  }, [])

  /** Every member walks 3 editable steps before confirm. */
  const goNextFromPersonal = () => {
    continueFromCurrentStep()
  }

  const allMembers = useMemo(() => [...savedMembers, form], [savedMembers, form])

  const hasText = (value: string) => value.trim().length > 0
  const hasSavedMembers = savedMembers.length > 0
  const phoneForValidation =
    hasSavedMembers && form.useSamePhone && primaryMember ? primaryMember.phone : form.phone
  const emailForValidation =
    hasSavedMembers && form.useSameEmail && primaryMember ? primaryMember.email : form.email

  const validateStep = (targetStep: number): boolean => {
    if (targetStep === 1) {
      const normalizedEmployeeId = normalizeEmployeeId(form.employeeId)
      const normalizedPhone = normalizePhoneDigits(phoneForValidation)
      const personalValid =
        hasText(form.firstName) &&
        hasText(form.lastName) &&
        hasText(form.age) &&
        hasText(form.gender) &&
        hasText(form.employeeId) &&
        normalizedPhone.length === 10 &&
        hasText(emailForValidation) &&
        (!hasSavedMembers || hasText(form.relation))

      if (!personalValid) {
        setStepError('Please fill all Personal details. Phone must be exactly 10 digits.')
        return false
      }

      if (!ALLOWED_EMPLOYEE_IDS.has(normalizedEmployeeId)) {
        setStepError('This Employee ID is not eligible for this form.')
        return false
      }

      const usedIds = getUsedEmployeeIds()
      if (
        usedIds.has(normalizedEmployeeId) &&
        !REUSABLE_TEST_EMPLOYEE_IDS.has(normalizedEmployeeId)
      ) {
        setStepError('This Employee ID has already been used for booking.')
        return false
      }

      return true
    }

    if (targetStep === 2) {
      const addressValid =
        hasText(form.houseBuilding) &&
        hasText(form.areaStreet) &&
        hasText(form.landmark) &&
        hasText(form.pincode) &&
        hasText(form.city)

      if (!addressValid) {
        setStepError('Please fill all Address details to continue.')
        return false
      }
      return true
    }

    if (targetStep === 3) {
      const scheduleValid = hasText(form.appointmentDate) && hasText(form.appointmentTime)
      if (!scheduleValid) {
        setStepError('Please choose both preferred date and time slot.')
        return false
      }
      return true
    }

    return true
  }

  const continueFromCurrentStep = () => {
    if (!validateStep(step)) return
    if (step === 1) goToStep(2)
    else if (step === 2) goToStep(3)
    else if (step === 3) goToStep(4)
  }

  const handleProceedToPayment = async () => {
    setStepError('')

    const parsedAge = Number.parseInt(form.age.trim(), 10)
    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      setStepError('Please enter a valid age before confirming.')
      return
    }

    const normalizeCollectionTimeSlot = (rawSlot: string): string => {
      const slot = rawSlot.trim()
      const ampmMatch = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
      if (ampmMatch) {
        const hour12 = Number.parseInt(ampmMatch[1], 10)
        const minutes = ampmMatch[2]
        const period = ampmMatch[3].toUpperCase()
        const hour24 = (hour12 % 12) + (period === 'PM' ? 12 : 0)
        return `${hour24}:${minutes}`
      }
      return slot
    }

    try {
      await onboardUserForEngagement({
        age: parsedAge,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        blood_collection_date: form.appointmentDate,
        blood_collection_time_slot: normalizeCollectionTimeSlot(form.appointmentTime),
        participants_employee_id: normalizeEmployeeId(form.employeeId),
        participant_department: 'General',
        participant_blood_group: 'Unknown',
        want_doctor_consultation: true,
      })

      persistUsedEmployeeId(form.employeeId)
      setBookingId((prev) => prev || generateBookingId())
      goToStep(5)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit booking.'
      setStepError(message)
    }
  }

  /** Load the chosen member into the editable `form` (swapping with whoever was current)
   *  and send the user back to Personal. After they walk the flow + say "No" on the
   *  add-member popup, they'll land back on Confirm with the updated data. */
  const editMember = (index: number) => {
    if (index >= 0 && index < savedMembers.length) {
      const next = [...savedMembers]
      const toEdit = next[index]
      next[index] = form
      setSavedMembers(next)
      setForm(toEdit)
    }
    setExpandedMemberIndex(null)
    goToStep(1)
  }

  const headerTitle = 'Book Appointment'

  const glassPanel =
    'rounded-[18px] border border-white/12 bg-black/18 shadow-[0_26px_70px_rgba(0,0,0,0.35)] backdrop-blur-[2px]'
  /** Mobile step 1: full-bleed on backdrop — no framed card/border (matches Figma). */
  const mobileStep1Layout = 'flex w-full min-h-0 flex-1 flex-col overflow-hidden'

  const isMobile = !isLg
  const mobilePersonal = isMobile && step === 1
  const showBack = step === 5 ? false : isLg ? step > 1 : step > 1
  const stretchStepBody = !isLg || step === 4 || step === 5
  const hideGlobalContinue = mobilePersonal || step === 5
  const mobileHeader = isMobile
  const hideStepper = step === 5

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
                    onClick={() => goToStep(Math.max(1, step - 1))}
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
                    onClick={() => goToStep(Math.max(1, step - 1))}
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
                  ? 'mt-5 mb-8 shrink-0 px-5'
                  : isMobile
                    ? 'mt-6 mb-8 shrink-0 px-5'
                    : 'mb-8 px-1 lg:mx-auto lg:w-[600px] lg:px-0'
              }
            >
              <Stepper
                current={step}
                compact={!isLg}
                maxReachable={maxReachedStep}
                onStepClick={(target) => goToStep(target)}
              />
            </div>
          )}

          <div
            className={`flex min-h-0 flex-col ${stretchStepBody ? 'flex-1' : 'flex-none'} ${
              mobilePersonal
                ? 'min-h-0 overflow-hidden'
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
              <AddressStep
                form={form}
                update={update}
                inputClass={inputClass}
                labelRow={labelRow}
                isMobile={isMobile}
              />
            )}
            {step === 3 && (
              <ScheduleStep form={form} update={update} isMobile={isMobile} />
            )}
            {step === 4 && (
              <ConfirmStep
                form={form}
                members={allMembers}
                onEdit={(s) => goToStep(s)}
                onEditMember={editMember}
                onProceed={handleProceedToPayment}
                errorMessage={stepError}
              />
            )}
            {step === 5 && (
              <BookingConfirmedStep
                bookingId={bookingId}
                form={form}
                members={allMembers}
                isMobile={isMobile}
              />
            )}
          </div>

          {mobilePersonal && step === 1 && (
            <div className="shrink-0 px-6 pt-1 pb-5">
              {stepError && (
                <p className="mb-2 text-center text-xs text-[#ffb4b4]">{stepError}</p>
              )}
              <ContinueButton variant="mobileBar" onClick={goNextFromPersonal}>
                Continue
              </ContinueButton>
            </div>
          )}

          {/* Footer CTA — mobile: full-width bar pinned to bottom with 30px safe-area; desktop: right-aligned pill */}
          {!hideGlobalContinue && (
            isMobile ? (
              step < 4 ? (
                <div className="mt-auto shrink-0 px-6 pt-4 pb-[30px]">
                  {stepError && (
                    <p className="mb-2 text-center text-xs text-[#ffb4b4]">{stepError}</p>
                  )}
                  <ContinueButton
                    variant="mobileBar"
                    onClick={continueFromCurrentStep}
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
                  <div className="flex flex-col items-end gap-2">
                    {stepError && (
                      <p className="text-right text-xs text-[#ffb4b4]">{stepError}</p>
                    )}
                    <ContinueButton onClick={continueFromCurrentStep}>
                      Continue
                    </ContinueButton>
                  </div>
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
  'h-10 w-full rounded-lg border-0 bg-white/5 px-4 text-[16px] text-white outline-none ring-1 ring-transparent placeholder:text-[#9a9a9a] focus:ring-[#4b8d83]'
const mobileFieldInput14 = mobileFieldInput
const mobileFieldTextarea =
  'h-10 w-full resize-none overflow-hidden rounded-lg border-0 bg-white/5 px-4 py-2.5 text-[16px] text-white outline-none ring-1 ring-transparent placeholder:text-[#9a9a9a] focus:ring-[#4b8d83]'
const desktopFieldTextarea =
  'h-[44px] w-full resize-none overflow-hidden rounded-[8px] bg-white/5 px-4 py-3 text-base lg:text-sm text-white outline-none ring-1 ring-white/5 placeholder:text-[#9a9a9a] focus:ring-[#4b8d83]/70'

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
    Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>,
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
            {labelRow(IdCard, 'Employee ID', undefined, true)}
            <input
              className={mobileFieldInput14}
              placeholder="Employee ID"
              value={form.employeeId}
              onChange={(e) => update('employeeId', e.target.value)}
            />
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
              maxLength={10}
              value={phoneValue}
              onChange={(e) => update('phone', normalizePhoneDigits(e.target.value))}
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
              maxLength={10}
              value={form.phone}
              onChange={(e) => update('phone', normalizePhoneDigits(e.target.value))}
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

          <div className="flex flex-col gap-1">
            {labelRow(IdCard, 'Employee ID', undefined, true)}
            <input
              className={mobileFieldInput14}
              placeholder="Employee ID"
              value={form.employeeId}
              onChange={(e) => update('employeeId', e.target.value)}
            />
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
          <div className="lg:col-span-2">
            {labelRow(User, 'Full Name')}
            <div className="flex gap-3">
              <input
                className={inputClass()}
                placeholder="First name"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
              />
              <input
                className={inputClass()}
                placeholder="Last Name"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
              />
            </div>
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
              maxLength={10}
              value={phoneValue}
              onChange={(e) => update('phone', normalizePhoneDigits(e.target.value))}
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

          <div>
            {labelRow(IdCard, 'Employee ID')}
            <input
              className={inputClass()}
              placeholder="Employee ID"
              value={form.employeeId}
              onChange={(e) => update('employeeId', e.target.value)}
            />
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
        <div className="lg:col-span-2">
          {labelRow(User, 'Full Name')}
          <div className="flex gap-3">
            <input
              className={inputClass()}
              placeholder="First name"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
            <input
              className={inputClass()}
              placeholder="Last Name"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
          </div>
        </div>

        <div>
          {labelRow(User, 'Gender')}
          {genderButtons}
        </div>

        <div>
          {labelRow(IdCard, 'Employee ID')}
          <input
            className={inputClass()}
            placeholder="Employee ID"
            value={form.employeeId}
            onChange={(e) => update('employeeId', e.target.value)}
          />
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
            inputMode="tel"
            maxLength={10}
            value={form.phone}
            onChange={(e) => update('phone', normalizePhoneDigits(e.target.value))}
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

function AddressStep({
  form,
  update,
  inputClass,
  labelRow,
  isMobile,
}: {
  form: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  inputClass: (short?: boolean) => string
  labelRow: (
    Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>,
    label: string,
    extra?: React.ReactNode,
    mobile?: boolean,
  ) => React.ReactNode
  isMobile: boolean
}) {
  const autoResizeTextarea = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex flex-col gap-1">
          {labelRow(Home, 'House No./ Building', undefined, true)}
          <textarea
            className={mobileFieldTextarea}
            placeholder="House No./ Building"
            value={form.houseBuilding}
            onChange={(e) => update('houseBuilding', e.target.value)}
            onInput={autoResizeTextarea}
            rows={1}
          />
        </div>
        <div className="flex flex-col gap-1">
          {labelRow(AreaStreetIcon, 'Area/ Street', undefined, true)}
          <textarea
            className={mobileFieldTextarea}
            placeholder="Area/ Street"
            value={form.areaStreet}
            onChange={(e) => update('areaStreet', e.target.value)}
            onInput={autoResizeTextarea}
            rows={1}
          />
        </div>
        <div className="flex flex-col gap-1">
          {labelRow(LandmarkIcon, 'Landmark', undefined, true)}
          <textarea
            className={mobileFieldTextarea}
            placeholder="Landmark"
            value={form.landmark}
            onChange={(e) => update('landmark', e.target.value)}
            onInput={autoResizeTextarea}
            rows={1}
          />
        </div>
        <div className="flex flex-col gap-1">
          {labelRow(PincodeIcon, 'Pincode', undefined, true)}
          <input
            className={mobileFieldInput14}
            inputMode="numeric"
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) => update('pincode', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          {labelRow(MapPin, 'City', undefined, true)}
          <textarea
            className={mobileFieldTextarea}
            placeholder="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            onInput={autoResizeTextarea}
            rows={1}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <h2 className="mb-7 text-2xl font-medium text-white lg:text-[24px] lg:leading-none">
        Address Details
      </h2>
      <div className="grid content-start gap-6 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6">
        <div>
          {labelRow(Home, 'House No./ Building')}
          <textarea
            className={desktopFieldTextarea}
            placeholder="House No./ Building"
            value={form.houseBuilding}
            onChange={(e) => update('houseBuilding', e.target.value)}
            onInput={autoResizeTextarea}
            rows={1}
          />
        </div>
        <div>
          {labelRow(AreaStreetIcon, 'Area/ Street')}
          <textarea
            className={desktopFieldTextarea}
            placeholder="Area/ Street"
            value={form.areaStreet}
            onChange={(e) => update('areaStreet', e.target.value)}
            onInput={autoResizeTextarea}
            rows={1}
          />
        </div>
        <div>
          {labelRow(LandmarkIcon, 'Landmark')}
          <textarea
            className={desktopFieldTextarea}
            placeholder="Landmark"
            value={form.landmark}
            onChange={(e) => update('landmark', e.target.value)}
            onInput={autoResizeTextarea}
            rows={1}
          />
        </div>
        <div>
          {labelRow(PincodeIcon, 'Pincode')}
          <input
            className={inputClass()}
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) => update('pincode', e.target.value)}
          />
        </div>
        <div>
          {labelRow(MapPin, 'City')}
          <textarea
            className={desktopFieldTextarea}
            placeholder="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            onInput={autoResizeTextarea}
            rows={1}
          />
        </div>
      </div>
    </>
  )
}

function ConfirmStep({
  form,
  members,
  onEdit,
  onEditMember,
  onProceed,
  errorMessage,
}: {
  form: FormData
  members: FormData[]
  onEdit: (step: number) => void
  onEditMember: (index: number) => void
  onProceed: () => void
  errorMessage?: string
}) {
  const mergedAddress = [form.houseBuilding, form.areaStreet].filter(Boolean).join(', ')

  return (
    <>
      <h2 className="mb-3 text-[18px] font-semibold text-white lg:mb-8 lg:text-2xl lg:font-medium">
        Confirm Details
      </h2>
      <div className="flex flex-col gap-3 lg:gap-4">
        <section className="rounded-lg bg-white/5 p-3 lg:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
            <h3 className="text-[15px] font-semibold text-white">Personal Information</h3>
          </div>
          {members.map((m, i) => (
            <div key={i}>
              {i > 0 && (
                <div
                  className="my-3 h-px w-full bg-white/20"
                  aria-hidden
                />
              )}
              <MemberSummary
                member={m}
                showRelation={i > 0}
                onEdit={() => onEditMember(i)}
              />
            </div>
          ))}
        </section>

        <section className="rounded-lg bg-white/5 p-3 lg:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
            <h3 className="text-[15px] font-semibold text-white">Address Details</h3>
            <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(2)}>
              Edit
            </button>
          </div>
          <ul className="space-y-3 text-[11px] leading-[1.15] text-[#ccc]">
            <li className="flex items-start gap-2">
              <Home className="mt-0.5 size-[14px] shrink-0 opacity-70" strokeWidth={1.75} />
              <span>{mergedAddress || '—'}</span>
            </li>
            <li className="flex items-start gap-2">
              <LandmarkIcon className="mt-0.5 size-[14px] shrink-0 opacity-70" />
              <span>{form.landmark || '—'}</span>
            </li>
            <li className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-[14px] shrink-0 opacity-70" strokeWidth={1.75} />
                <span>{form.city || '—'}</span>
              </div>
              <div className="flex items-start gap-2">
                <PincodeIcon className="mt-0.5 size-[14px] shrink-0 opacity-70" />
                <span>{form.pincode || '—'}</span>
              </div>
            </li>
          </ul>
        </section>

        <section className="rounded-lg bg-white/5 p-3 lg:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
            <h3 className="text-[15px] font-semibold text-white">Sample Collection</h3>
            <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(3)}>
              Edit
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] leading-[1.15] text-[#ccc]">
            <li className="flex items-start gap-2">
              <PreferredDateIcon className="mt-0.5 size-[14px] shrink-0 opacity-70" />
              <span>{form.appointmentDate || '—'}</span>
            </li>
            <li className="flex items-start gap-2">
              <PreferredTimeIcon className="mt-0.5 size-[14px] shrink-0 opacity-70" />
              <span>{form.appointmentTime || '—'}</span>
            </li>
          </ul>
        </section>

        <ContinueButton
          className="mt-3 w-full max-w-none"
          showChevron={false}
          onClick={onProceed}
        >
          Confirm
        </ContinueButton>
        {errorMessage && (
          <p className="text-center text-xs text-[#ffb4b4]">{errorMessage}</p>
        )}
      </div>
    </>
  )
}

function MemberSummary({
  member,
  showRelation,
  onEdit,
}: {
  member: FormData
  showRelation: boolean
  onEdit: () => void
}) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(' ') || '—'
  const GenderIcon = member.gender === 'female' ? Venus : Mars
  const genderLabel = member.gender
    ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1)
    : '—'
  const relationLabel =
    RELATION_OPTIONS.find((o) => o.toLowerCase() === member.relation) ?? member.relation

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onEdit}
        className="absolute right-0 top-0 text-[13px] font-medium text-[#4b8d83]"
      >
        Edit
      </button>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pr-10 text-[11px] leading-[1.15] text-[#cccccc]">
        {showRelation ? (
          <>
            <SummaryItem Icon={User} label={name} />
            <SummaryItem Icon={User} label={relationLabel || '—'} capitalize />
          </>
        ) : (
          <>
            <SummaryItem Icon={User} label={name} />
            <SummaryItem Icon={GenderIcon} label={genderLabel} />
          </>
        )}
        <SummaryItem Icon={Phone} label={member.phone || '—'} />
        <SummaryItem Icon={Calendar} label={member.age ? `${member.age} Years` : '—'} />
        <SummaryItem Icon={Mail} label={member.email || '—'} />
        <SummaryItem Icon={IdCard} label={member.employeeId || '—'} />
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
    <div className="flex min-w-0 items-start gap-1.5 leading-[1.15]">
      <Icon className="mt-0.5 size-[13px] shrink-0 opacity-70" strokeWidth={1.75} />
      <span className={['min-w-0 break-words', capitalize ? 'capitalize' : ''].join(' ')}>
        {label}
      </span>
    </div>
  )
}

const TIME_SLOTS = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM',
  '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM',
  '01:30 PM',
] as const

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

type UpcomingDate = { iso: string; day: string; date: number }

function getUpcomingDates(count: number, startOffsetDays = 0): UpcomingDate[] {
  const pad = (n: number) => String(n).padStart(2, '0')
  const today = new Date()
  const out: UpcomingDate[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + startOffsetDays + i)
    out.push({
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      day: DAY_LABELS[d.getDay()],
      date: d.getDate(),
    })
  }
  return out
}

function PreferredDateIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={className}
    >
      <path d="M6.66699 1.66699V5.00033M13.3337 1.66699V5.00033" stroke="#9A9A9A" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.16667 3.33398H15.8333C16.7538 3.33398 17.5 4.08018 17.5 5.00065V16.6673C17.5 17.5878 16.7538 18.334 15.8333 18.334H4.16667C3.24619 18.334 2.5 17.5878 2.5 16.6673V5.00065C2.5 4.08018 3.24619 3.33398 4.16667 3.33398V3.33398" stroke="#9A9A9A" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 8.33398H17.5" stroke="#9A9A9A" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PreferredTimeIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={className}
    >
      <path d="M10.5932 19.4902L10.5822 19.492L10.5112 19.5241L10.4912 19.5278L10.4772 19.5241L10.4062 19.492C10.3955 19.4889 10.3875 19.4905 10.3822 19.4966L10.3782 19.5057L10.3612 19.8981L10.3662 19.9165L10.3762 19.9284L10.4802 19.9962L10.4952 19.9999L10.5072 19.9962L10.6112 19.9284L10.6232 19.9137L10.6272 19.8981L10.6102 19.5067C10.6075 19.4969 10.6018 19.4914 10.5932 19.4902ZM10.8582 19.3866L10.8452 19.3884L10.6602 19.4737L10.6502 19.4828L10.6472 19.4929L10.6652 19.8871L10.6702 19.8981L10.6782 19.9046L10.8792 19.9898C10.8918 19.9929 10.9015 19.9904 10.9082 19.9825L10.9122 19.9696L10.8782 19.4067C10.8748 19.3957 10.8682 19.389 10.8582 19.3866ZM10.1432 19.3884C10.1388 19.3859 10.1335 19.3852 10.1285 19.3862C10.1234 19.3872 10.119 19.39 10.1162 19.3939L10.1102 19.4067L10.0762 19.9696C10.0768 19.9806 10.0825 19.988 10.0932 19.9917L10.1082 19.9898L10.3092 19.9046L10.3192 19.8972L10.3232 19.8871L10.3402 19.4929L10.3372 19.4819L10.3272 19.4727L10.1432 19.3884Z" fill="#9A9A9A" />
      <path d="M10 0C15.523 0 20 4.1045 20 9.16798C20 14.2315 15.523 18.336 10 18.336C4.477 18.336 0 14.2315 0 9.16798C0 4.1045 4.477 0 10 0ZM10 1.8336C7.87827 1.8336 5.84344 2.60632 4.34315 3.98179C2.84285 5.35725 2 7.22278 2 9.16798C2 11.1132 2.84285 12.9787 4.34315 14.3542C5.84344 15.7296 7.87827 16.5024 10 16.5024C12.1217 16.5024 14.1566 15.7296 15.6569 14.3542C17.1571 12.9787 18 11.1132 18 9.16798C18 7.22278 17.1571 5.35725 15.6569 3.98179C14.1566 2.60632 12.1217 1.8336 10 1.8336ZM10 3.66719C10.2449 3.66722 10.4813 3.74966 10.6644 3.89888C10.8474 4.0481 10.9643 4.25371 10.993 4.47672L11 4.58399V8.78842L13.707 11.2702C13.8863 11.4352 13.9905 11.6566 13.9982 11.8894C14.006 12.1222 13.9168 12.349 13.7488 12.5237C13.5807 12.6984 13.3464 12.8079 13.0935 12.83C12.8406 12.8521 12.588 12.7851 12.387 12.6426L12.293 12.5665L9.293 9.81615C9.13758 9.67354 9.03776 9.48794 9.009 9.28808L9 9.16798V4.58399C9 4.34084 9.10536 4.10765 9.29289 3.93571C9.48043 3.76378 9.73478 3.66719 10 3.66719Z" fill="#9A9A9A" />
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
  const dates = useMemo(() => getUpcomingDates(4, 2), [])

  const selectedDateClass =
    'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] border-transparent'
  const idleDateClass = 'border-white/[0.08] bg-white/5'

  const selectedPillClass =
    'bg-[radial-gradient(50.74%_50.76%_at_50%_50%,_#11795F_0%,_#1C493D_100%)] text-white'
  const idlePillClass = 'bg-white/5 text-[#9A9A9A]'

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
              ? 'grid w-full grid-cols-4 gap-3 self-stretch'
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
      </section>

      <section className={`flex flex-col items-start self-stretch ${isMobile ? 'gap-3' : 'gap-6'}`}>
        {isMobile ? (
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-2">
              <PreferredTimeIcon />
              <h2 className={sectionLabelClass}>Preferred Time Slot</h2>
            </div>
            <p className="pl-[28px] font-sans text-[10px] font-light leading-normal text-[#CCC]">
              Collection window is of 1 hour
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <h2 className={sectionLabelClass}>Preferred Time Slot</h2>
            <p className="text-[15px] font-light leading-none text-[#999]">
              Collection window is of 1 hour
            </p>
          </div>
        )}
        <div className="grid w-full grid-cols-3 gap-3 self-stretch sm:grid-cols-4 lg:grid-cols-5">
          {TIME_SLOTS.map((slot) => {
            const selected = form.appointmentTime === slot
            return (
              <button
                key={slot}
                type="button"
                onClick={() => update('appointmentTime', slot)}
                aria-pressed={selected}
                className={[
                  'flex h-[39px] flex-col items-center justify-center rounded-[20px] border border-transparent px-4 text-center text-[14px] font-normal leading-none transition',
                  selected ? selectedPillClass : idlePillClass,
                ].join(' ')}
              >
                {slot}
              </button>
            )
          })}
        </div>
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

function formatTimeWindow(slot: string): string {
  if (!slot) return '—'
  const match = slot.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/)
  if (!match) return slot
  const startH12 = parseInt(match[1], 10)
  const minutes = match[2]
  const startPeriod = match[3]
  const h24 = (startH12 % 12) + (startPeriod === 'PM' ? 12 : 0)
  const endH24 = (h24 + 1) % 24
  const endPeriod = endH24 >= 12 ? 'PM' : 'AM'
  const endH12 = endH24 % 12 === 0 ? 12 : endH24 % 12
  if (startPeriod === endPeriod) {
    return `${startH12}:${minutes}-${endH12}:${minutes} ${startPeriod}`
  }
  return `${startH12}:${minutes} ${startPeriod}-${endH12}:${minutes} ${endPeriod}`
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
  const location =
    [form.landmark, form.city].filter(Boolean).join(', ') ||
    form.city ||
    form.areaStreet ||
    form.houseBuilding ||
    '—'
  const dateTime = `${formatBookingDate(form.appointmentDate)}  |  ${formatTimeWindow(form.appointmentTime)}`

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
              <InfoRow icon={<CalendarIcon />} label="Date & Time" value={dateTime} isMobile />
              <InfoRow icon={<UserIcon />} label="Member Name" value={memberNames || '—'} isMobile />
              <InfoRow icon={<LocationIcon />} label="Location" value={location} isMobile />
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
          <p className="text-center font-sans text-[14px] font-medium leading-normal text-[#CCC]">
            ⚠️ Don&apos;t miss the call from our collection team
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
            <InfoRow icon={<CalendarIcon />} label="Date & Time" value={dateTime} />
            <InfoRow icon={<UserIcon />} label="Member Name" value={memberNames || '—'} />
            <InfoRow icon={<LocationIcon />} label="Location" value={location} />
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
      <p className="mt-4 text-center text-[14px] font-medium leading-normal text-[#CCC]">
        ⚠️ Don&apos;t miss the call from our collection team
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

function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M16.6668 8.33366C16.6668 12.4945 12.051 16.8278 10.501 18.1662C10.2044 18.3892 9.79596 18.3892 9.49933 18.1662C7.94933 16.8278 3.3335 12.4945 3.3335 8.33366C3.3335 4.65423 6.32073 1.66699 10.0002 1.66699C13.6796 1.66699 16.6668 4.65423 16.6668 8.33366" stroke="#4B8D83" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 8.33398C7.5 9.71377 8.62021 10.834 10 10.834C11.3798 10.834 12.5 9.71377 12.5 8.33398C12.5 6.9542 11.3798 5.83398 10 5.83398C8.62021 5.83398 7.5 6.9542 7.5 8.33398V8.33398" stroke="#4B8D83" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
