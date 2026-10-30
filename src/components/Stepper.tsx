type Props = {
  steps: readonly string[]
  current: number
  maxReachable?: number
  onStepClick?: (step: number) => void
  complete?: boolean
}

function activeStep(current: number, count: number) {
  return Math.max(1, Math.min(count, current))
}

function progressWidthPercent(current: number, count: number, complete: boolean) {
  if (complete || count <= 1) return 100
  const step = activeStep(current, count)
  if (step <= 1) return 6
  return Math.min(100, ((step - 1) / (count - 1)) * 94)
}

export function Stepper({ steps, current, maxReachable, onStepClick, complete = false }: Props) {
  const count = Math.max(1, steps.length)
  const stepForA11y = complete ? count : activeStep(current, count)
  const fillPercent = progressWidthPercent(current, count, complete)
  const labelWidth = count >= 5 ? 'w-[56px]' : 'w-[70px]'

  return (
    <div
      className="w-full"
      role="navigation"
      aria-label={`Form progress, step ${stepForA11y} of ${count}: ${steps[stepForA11y - 1] ?? ''}`}
    >
      <div className="relative mx-auto w-full max-w-[420px]">
        <div className="pointer-events-none absolute left-[15px] right-[15px] top-[14px] h-px rounded-full bg-[#9a9a9a]/50" />
        <div
          className="pointer-events-none absolute left-[15px] top-[14px] h-[2px] rounded-full bg-[#4b8d83] shadow-[0_1px_10px_0_#90df9e]"
          style={{ width: `calc((100% - 30px) * ${fillPercent / 100})` }}
        />

        <div className="relative z-10 flex items-start justify-between">
          {steps.map((label, i) => {
            const step = i + 1
            const active = !complete && step === current
            const done = complete || (!complete && step < current)
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
              `mt-1.5 ${labelWidth} text-center text-[11px] leading-none`,
              active ? 'font-semibold text-white' : done ? 'font-medium text-[#4b8d83]' : 'font-medium text-[#9a9a9a]',
            ].join(' ')

            return (
              <div key={label} className={`flex ${labelWidth} flex-col items-center`}>
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
