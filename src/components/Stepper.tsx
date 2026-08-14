const STEPS = ['Personal', 'Confirm', 'OTP'] as const
const BOOKING_STEP_COUNT = STEPS.length

type Props = {
  current: number
  maxReachable?: number
  onStepClick?: (step: number) => void
}

function activeStep(current: number) {
  return current >= 5 ? BOOKING_STEP_COUNT : Math.max(1, Math.min(BOOKING_STEP_COUNT, current))
}

/** Progress line width per active step (320px track). */
function progressWidthPercent(current: number) {
  if (current >= 5) return 100
  if (current === 1) return 14
  if (current === 2) return 50
  if (current === 3) return 92
  return 0
}

export function Stepper({ current, maxReachable, onStepClick }: Props) {
  const stepForA11y = activeStep(current)
  const fillPercent = progressWidthPercent(current)

  return (
    <div
      className="w-full"
      role="navigation"
      aria-label={`Form progress, step ${stepForA11y} of ${BOOKING_STEP_COUNT}: ${STEPS[stepForA11y - 1]}`}
    >
      <div className="relative mx-auto w-full max-w-[320px]">
        <div className="pointer-events-none absolute left-[30px] right-[30px] top-[14px] h-px rounded-full bg-[#9a9a9a]/50" />

        <div
          className="pointer-events-none absolute left-0 top-[14px] h-[2px] rounded-full bg-[#4b8d83] shadow-[0_1px_10px_0_#90df9e]"
          style={{ width: `${fillPercent}%` }}
        />

        <div className="relative z-10 flex items-start justify-between">
          {STEPS.map((label, i) => {
            const step = i + 1
            const active = current < 5 && step === current
            const done = (current < 5 && step < current) || current >= 5
            const reachable = maxReachable ?? current
            const clickable = Boolean(onStepClick) && step !== current && step <= reachable

            const circleClass = [
              'relative z-20 flex size-[30px] items-center justify-center rounded-[15px] text-[14px] font-semibold leading-none',
              active || done
                ? 'border-[1.6px] border-[#4b8d83] bg-[#063533] shadow-[0_0_5px_#4b8d83]'
                : 'border-[0.2px] border-[#9a9a9a]/50 bg-[#0d0616] text-[#9a9a9a]',
              active ? 'text-white' : done ? 'text-[#4b8d83]' : '',
              clickable ? 'cursor-pointer transition hover:brightness-125' : '',
            ].join(' ')

            const labelClass = [
              'mt-1.5 w-[60px] text-center text-[11px] leading-none',
              active ? 'font-semibold text-white' : done ? 'font-medium text-[#4b8d83]' : 'font-medium text-[#9a9a9a]',
            ].join(' ')

            return (
              <div key={label} className="flex w-[60px] flex-col items-center">
                <div className={active ? 'flex h-[30px] items-center' : 'flex h-[36px] items-start pb-1.5'}>
                  {clickable ? (
                    <button
                      type="button"
                      onClick={() => onStepClick?.(step)}
                      className={circleClass}
                      aria-label={`Go back to step ${step}: ${label}`}
                    >
                      {step}
                    </button>
                  ) : (
                    <div className={circleClass} aria-hidden>
                      {step}
                    </div>
                  )}
                </div>
                <span className={labelClass}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
