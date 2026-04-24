const STEPS = ['Personal Info', 'Schedule & Time Slot'] as const

type Props = {
  current: number
  compact?: boolean
  /** Furthest step the user has already completed. Any step <= this is clickable. */
  maxReachable?: number
  onStepClick?: (step: number) => void
}

function activeStep(current: number) {
  return current >= 3 ? 2 : Math.max(1, Math.min(2, current))
}

function lineFillPercent(current: number) {
  if (current >= 3) return 100
  const step = activeStep(current)
  if (step >= 2) return 100
  if (step === 1) return Math.round(100 * (15 / 30))
  return 0
}

export function Stepper({ current, compact = false, maxReachable, onStepClick }: Props) {
  const stepForA11y = activeStep(current)
  const fillPercent = lineFillPercent(current)

  return (
    <div
      className="w-full"
      role="navigation"
      aria-label={`Form progress, step ${stepForA11y} of 2: ${STEPS[stepForA11y - 1]}`}
    >
      <div className={compact ? 'mx-auto w-full max-w-[360px]' : 'mx-auto w-[600px]'}>
        <div className="relative">
          <div className="pointer-events-none absolute left-[15px] right-[15px] top-[15px] h-px bg-[#9A9A9A]/50" />
          <div
            className="pointer-events-none absolute left-[15px] top-[14.5px] h-[2px] bg-[#4B8D83] shadow-[0_0_10px_rgba(75,141,131,0.7)]"
            style={{ width: `calc((100% - 30px) * ${fillPercent / 100})` }}
          />

          <div className="relative z-10 flex items-start justify-between">
            {STEPS.map((label, i) => {
              const step = i + 1
              const active = current < 3 && step === current
              const done = (current < 3 && step < current) || (current >= 3 && step <= 2)
              const fill = active ? '#FFFFFF' : done ? '#4B8D83' : '#9A9A9A'
              const reachable = maxReachable ?? current
              const clickable = Boolean(onStepClick) && step !== current && step <= reachable

              const circleClass = [
                'flex h-[30px] w-[30px] items-center justify-center rounded-full border text-xs font-semibold',
                active
                  ? 'border-[#4B8D83] bg-[#063533] text-white shadow-[0_0_18px_rgba(75,141,131,0.8)]'
                  : done
                    ? 'border-[#4B8D83] bg-[#063533] text-[#4B8D83]'
                    : 'border-[#9A9A9A]/40 bg-[#061214] text-[#9A9A9A]',
                clickable ? 'cursor-pointer transition hover:brightness-125' : '',
              ].join(' ')

              return (
                <div key={label} className="flex w-[30px] flex-col items-center">
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
                  <span
                    className="mt-2 text-center text-[12px] font-medium leading-none"
                    style={{ fontFamily: 'Lato, sans-serif', color: fill, fontStyle: 'normal' }}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
