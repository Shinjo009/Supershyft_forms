import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Home,
  Mail,
  MapPin,
  Mars,
  Phone,
  User,
  Venus,
  X,
} from 'lucide-react'
import { AddMemberModal } from './components/AddMemberModal'
import { ContinueButton } from './components/ContinueButton'
import { PackageDetailBody } from './components/PackageDetailBody'
import { PageBackdrop } from './components/PageBackdrop'
import { Stepper } from './components'
import { getPackage, PACKAGES, type PackageId } from './data/packages'
import { defaultFormData, type FormData } from './types'

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
    'w-full rounded-[8px] bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/5 placeholder:text-[#9a9a9a] focus:ring-[#4b8d83]/70',
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

function PackageInfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 0C8.85652 0 10.637 0.737498 11.9497 2.05025C13.2625 3.36301 14 5.14348 14 7C14 8.85652 13.2625 10.637 11.9497 11.9497C10.637 13.2625 8.85652 14 7 14C5.14348 14 3.36301 13.2625 2.05025 11.9497C0.737498 10.637 0 8.85652 0 7C0 5.14348 0.737498 3.36301 2.05025 2.05025C3.36301 0.737498 5.14348 0 7 0ZM8.05 4.29688C8.57031 4.29688 8.99219 3.9375 8.99219 3.40156C8.99219 2.86563 8.57031 2.50625 8.05 2.50625C7.52969 2.50625 7.10938 2.86563 7.10938 3.40156C7.10938 3.9375 7.53125 4.29844 8.05 4.29844M8.23281 9.925C8.23281 9.81875 8.27031 9.54063 8.24844 9.38125L7.42656 10.3281C7.25625 10.5063 7.04375 10.6312 6.94375 10.5984C6.89862 10.5816 6.86096 10.5492 6.83749 10.5071C6.81403 10.4651 6.80627 10.416 6.81563 10.3687L8.18437 6.04063C8.29688 5.49062 7.98906 4.99062 7.33594 4.92656C6.64844 4.92656 5.63281 5.625 5.01562 6.5125C5.01562 6.61875 4.99531 6.88125 5.01562 7.04062L5.8375 6.09375C6.00938 5.91563 6.20625 5.79062 6.30625 5.825C6.35491 5.84336 6.39467 5.87968 6.41734 5.92648C6.44002 5.97328 6.44387 6.027 6.42812 6.07656L5.06875 10.3844C4.9125 10.8875 5.20937 11.3812 5.92969 11.4937C6.99062 11.4937 7.61719 10.8125 8.23438 9.925H8.23281Z" fill="white"/>
    </svg>
  )
}

export default function BookAppointment() {
  const isLg = useIsLg()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultFormData)
  const [packageId, setPackageId] = useState<PackageId>('fb-no-vit')
  const [detailId, setDetailId] = useState<PackageId | null>(null)
  const [addMemberOpen, setAddMemberOpen] = useState(false)

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }, [])

  const fullName = useMemo(
    () => [form.firstName, form.lastName].filter(Boolean).join(' '),
    [form.firstName, form.lastName],
  )

  const selectedPkg = getPackage(packageId)

  const goNextFromPersonal = () => {
    if (isLg) setAddMemberOpen(true)
    else setStep(2)
  }

  const resolveAddMember = (another: boolean) => {
    setAddMemberOpen(false)
    if (another) {
      setForm((f) => ({
        ...f,
        firstName: '',
        lastName: '',
      }))
    }
    setStep(2)
  }

  const headerTitle = 'Book Appointment'

  const glassPanel =
    'rounded-[18px] border border-white/12 bg-black/18 shadow-[0_26px_70px_rgba(0,0,0,0.35)] backdrop-blur-[2px]'
  /** Thick rounded stroke only — no inner tint/blur so the page background shows through */
  const mobileStep1Shell =
    'mx-auto w-full max-w-[360px] flex-1 overflow-hidden rounded-[18px] border-4 border-[rgba(116,119,117,0.5)] bg-transparent shadow-none ring-0'

  const showBack = isLg ? step > 1 : true
  const mobilePersonal = !isLg && step === 1
  const stretchStepBody = !isLg || step === 4
  const hideGlobalContinue = mobilePersonal
  const mobileHeader = !isLg

  return (
    <PageBackdrop>
      <div
        className={`mx-auto flex flex-col lg:max-w-none lg:min-h-svh lg:px-10 lg:py-14 ${
          mobilePersonal
            ? 'h-dvh max-h-dvh min-h-0 overflow-hidden px-0 py-2'
            : 'min-h-svh max-w-[980px] px-4 py-6 pb-24'
        }`}
      >
        <div
          className={`flex min-h-0 flex-col ${mobilePersonal ? 'flex-1' : 'flex-1 lg:flex-none'} ${mobilePersonal ? mobileStep1Shell : `${glassPanel} p-5 lg:relative lg:mx-auto lg:w-full lg:max-w-[970px] lg:p-7`}`}
        >
          {/* Header — Figma mobile: back | centered title | close */}
          <header
            className={
              mobileHeader
                ? 'mb-2 grid grid-cols-[44px_1fr_44px] items-center gap-1 px-5 pt-5'
                : 'mb-6 flex items-center gap-3 lg:mb-6 lg:gap-4'
            }
          >
            {mobileHeader ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    step > 1 ? setStep((s) => Math.max(1, s - 1)) : window.history.length > 1
                      ? window.history.back()
                      : undefined
                  }
                  className="flex size-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
                  aria-label="Back"
                >
                  <ArrowLeft className="size-5" strokeWidth={2.2} />
                </button>
                <h1 className="text-center text-[20px] font-semibold leading-none text-white">
                  {headerTitle}
                </h1>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 lg:hidden"
                  aria-label="Close"
                >
                  <X className="size-6" strokeWidth={2} />
                </button>
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

          <div className={mobilePersonal ? 'mb-4 shrink-0 px-5' : 'mb-8 px-1 lg:mx-auto lg:w-[600px] lg:px-0'}>
            <Stepper current={step === 4 ? 5 : step} compact={!isLg} />
          </div>

          <div
            className={`flex min-h-0 flex-col ${stretchStepBody ? 'flex-1' : 'flex-none'} ${mobilePersonal ? 'min-h-0 overflow-hidden' : ''}`}
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
                  />
                )}
              </>
            )}
            {step === 2 && (
              <AddressStep form={form} update={update} inputClass={inputClass} labelRow={labelRow} />
            )}
            {step === 3 && (
              <PackageStep
                packageId={packageId}
                setPackageId={setPackageId}
                detailId={detailId}
                setDetailId={setDetailId}
                isLg={isLg}
              />
            )}
            {step === 4 && (
              <ConfirmStep
                form={form}
                fullName={fullName}
                packageTitle={selectedPkg.title}
                onEdit={(s) => setStep(s)}
              />
            )}
          </div>

          {mobilePersonal && step === 1 && (
            <div className="shrink-0 px-6 pb-3 pt-2">
              <ContinueButton variant="mobileBar" onClick={goNextFromPersonal}>
                Continue
              </ContinueButton>
            </div>
          )}

          {/* Footer CTA — Figma mobile step 1: full-width bar inside form column */}
          {!hideGlobalContinue && (
            <div
              className={[
                step < 4 ? 'mt-6 flex' : 'mt-auto flex pt-8',
                step === 4 && isLg ? 'justify-end' : 'justify-end lg:justify-end',
              ].join(' ')}
            >
              {step < 4 && (
                <ContinueButton
                  onClick={() => {
                    if (step === 1) goNextFromPersonal()
                    else if (step === 2) setStep(3)
                    else setStep(4)
                  }}
                >
                  Continue
                </ContinueButton>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile package detail overlay */}
      {detailId && !isLg && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm">
          <div className="relative w-full max-w-[360px]">
            <PackageDetailBody
              pkg={getPackage(detailId)}
              variant="mobile"
              onClose={() => setDetailId(null)}
            />
          </div>
        </div>
      )}

      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onYes={() => resolveAddMember(true)}
        onNo={() => resolveAddMember(false)}
        displayName={fullName}
      />
    </PageBackdrop>
  )
}

const mobileFieldInput =
  'h-10 w-full rounded-lg border-0 bg-white/5 px-4 text-white outline-none ring-1 ring-transparent placeholder:text-[#9a9a9a] focus:ring-[#4b8d83]'
const mobileFieldInput14 = `${mobileFieldInput} text-sm`
const mobileFieldInput12 = `${mobileFieldInput} text-xs`

function PersonalStep({
  form,
  update,
  isLg,
  inputClass,
  labelRow,
  onContinue,
  showMobileContinue,
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
}) {
  if (!isLg) {
    return (
      <div className="flex min-h-0 flex-col gap-5 pt-4 pb-2">
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
              className={mobileFieldInput12}
              inputMode="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            {labelRow(Mail, 'Email', undefined, true)}
            <input
              className={mobileFieldInput12}
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
              className={mobileFieldInput12}
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

function AddressStep({
  form,
  update,
  inputClass,
  labelRow,
}: {
  form: FormData
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  inputClass: (short?: boolean) => string
  labelRow: (Icon: typeof User, label: string, extra?: React.ReactNode) => React.ReactNode
}) {
  return (
    <>
      <h2 className="mb-7 text-2xl font-medium text-white lg:text-[24px] lg:leading-none">
        Address Details
      </h2>
      <div className="grid content-start gap-6 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6">
        <div>
          {labelRow(Home, 'House No./ Street')}
          <input
            className={inputClass()}
            placeholder="House No./ Street"
            value={form.street}
            onChange={(e) => update('street', e.target.value)}
          />
        </div>
        <div>
          {labelRow(Building2, 'Landmark')}
          <input
            className={inputClass()}
            placeholder="Landmark"
            value={form.landmark}
            onChange={(e) => update('landmark', e.target.value)}
          />
        </div>
        <div>
          {labelRow(MapPin, 'Pincode')}
          <input
            className={inputClass()}
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) => update('pincode', e.target.value)}
          />
        </div>
        <div>
          {labelRow(MapPin, 'City')}
          <input
            className={inputClass()}
            placeholder="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
          />
        </div>
      </div>
    </>
  )
}

function PackageStep({
  packageId,
  setPackageId,
  detailId,
  setDetailId,
  isLg,
}: {
  packageId: PackageId
  setPackageId: (id: PackageId) => void
  detailId: PackageId | null
  setDetailId: (id: PackageId | null) => void
  isLg: boolean
}) {
  return (
    <>
      <h2 className="mb-6 text-2xl font-medium text-white lg:mb-8">Select Package</h2>

      <div className="flex flex-1 flex-col gap-6">
        {(!isLg || !detailId) && (
          <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
            {PACKAGES.map((p) => {
              const selected = packageId === p.id
              return (
                <div
                  key={p.id}
                  className={[
                    'relative flex min-w-[200px] flex-1 flex-col items-center rounded-xl border px-4 py-6 text-center transition lg:min-w-0',
                    selected
                      ? 'border-[#4b8d83]/60 bg-[radial-gradient(ellipse_at_50%_30%,_#11795f_0%,_#1c493d_55%,_#0d2520_100%)]'
                      : 'border-white/[0.08] bg-white/5',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => setDetailId(p.id)}
                    className="absolute right-2 top-2 rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                    aria-label={`About ${p.title}`}
                  >
                    <PackageInfoIcon />
                  </button>
                  <button type="button" onClick={() => setPackageId(p.id)} className="flex w-full flex-col items-center gap-3">
                    <div className="flex size-14 items-center justify-center lg:size-16">
                      <img src={p.iconSrc} alt="" className="h-16 w-16 object-contain" aria-hidden />
                    </div>
                    <div className="text-sm font-semibold leading-snug text-white">
                      {p.lines ? (
                        <>
                          {p.lines[0]}
                          <br />
                          {p.lines[1]}
                        </>
                      ) : (
                        p.title
                      )}
                    </div>
                    <p className="text-xs font-light text-white/80">{p.subtitle}</p>
                    <div className="mt-1 flex flex-wrap justify-center gap-3 text-[11px] text-[#90df9e] lg:text-xs">
                      <span className="flex items-center gap-1">✓ Bio-AI Report</span>
                      <span className="flex items-center gap-1">✓ Blood Test</span>
                    </div>
                    <p className="mt-2 text-base font-semibold text-white">{p.price}</p>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {isLg && detailId && (
          <PackageDetailBody pkg={getPackage(detailId)} variant="desktop" onClose={() => setDetailId(null)} />
        )}
      </div>
    </>
  )
}

function ConfirmStep({
  form,
  fullName,
  packageTitle,
  onEdit,
}: {
  form: FormData
  fullName: string
  packageTitle: string
  onEdit: (step: number) => void
}) {
  return (
    <>
      <h2 className="mb-6 text-2xl font-medium text-white lg:mb-8">Confirm Details</h2>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <section className="flex-1 rounded-lg bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between border-b border-white/20 pb-2">
            <h3 className="text-[15px] font-semibold text-white">Personal Information</h3>
            <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(1)}>
              Edit
            </button>
          </div>
          <ul className="space-y-4 text-sm text-[#ccc]">
            <li className="flex gap-2">
              <User className="mt-0.5 size-5 shrink-0 opacity-70" />
              {fullName}
            </li>
            <li className="flex gap-2">
              <Calendar className="mt-0.5 size-5 shrink-0 opacity-70" />
              {form.age} Years
            </li>
            <li className="flex gap-2 capitalize">
              <User className="mt-0.5 size-5 shrink-0 opacity-70" />
              {form.gender}
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-5 shrink-0 opacity-70" />
              {form.phone}
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-5 shrink-0 opacity-70" />
              {form.email}
            </li>
          </ul>
        </section>

        <section className="flex-1 rounded-lg bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between border-b border-white/20 pb-2">
            <h3 className="text-[15px] font-semibold text-white">Address Details</h3>
            <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(2)}>
              Edit
            </button>
          </div>
          <ul className="space-y-4 text-sm text-[#ccc]">
            <li className="flex gap-2">
              <Home className="mt-0.5 size-5 shrink-0 opacity-70" />
              {form.street}
            </li>
            <li className="flex gap-2">
              <Building2 className="mt-0.5 size-5 shrink-0 opacity-70" />
              {form.landmark}
            </li>
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-5 shrink-0 opacity-70" />
              {form.pincode}
            </li>
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-5 shrink-0 opacity-70" />
              {form.city}
            </li>
          </ul>
        </section>

        <section className="flex flex-1 flex-col gap-6">
          <div className="rounded-lg bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/20 pb-2">
              <h3 className="text-[15px] font-semibold text-white">Sample Collection</h3>
              <button type="button" className="text-[13px] font-medium text-[#4b8d83]" onClick={() => onEdit(3)}>
                Edit
              </button>
            </div>
            <ul className="space-y-4 text-sm text-[#ccc]">
              <li className="flex gap-2">
                <Calendar className="mt-0.5 size-5 shrink-0 opacity-70" />
                {form.appointmentDate}
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center opacity-70">🕐</span>
                {form.appointmentTime}
              </li>
            </ul>
            <p className="mt-4 text-xs text-white/50">Package: {packageTitle}</p>
          </div>
          <ContinueButton
            className="w-full max-w-none"
            showChevron={false}
            onClick={() => alert('Proceed to payment (demo)')}
          >
            Proceed to Payment
          </ContinueButton>
        </section>
      </div>
    </>
  )
}
