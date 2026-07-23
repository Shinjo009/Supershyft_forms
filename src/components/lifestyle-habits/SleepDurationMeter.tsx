import { useEffect, useId, useRef, useState } from 'react'
import {
  SLEEP_DURATION_OPTIONS,
  type SleepDurationOption,
} from '../../data/lifestyleHabitsQuestions'
import { MCQ_PILL_BORDER_IDLE, MCQ_PILL_BORDER_SELECTED } from '../mcq/mcqLayout'
import { SLEEP_MOON_FILL, SLEEP_PILL_GRADIENT } from './sleepDurationConfig'

const MOON_SIZE = 148
const MOON_RADIUS = MOON_SIZE / 2
/** Shadow slides toward ~2 o'clock so the lit crescent starts near 7:30 (bottom-left) */
const SHADOW_ANGLE_RAD = (-28 * Math.PI) / 180
/** Room for drop-shadow so parent scroll areas do not clip the glow */
const MOON_FRAME = MOON_SIZE + 72

function useAnimatedFill(target: number) {
  const [fill, setFill] = useState(target)
  const currentRef = useRef(target)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (frameRef.current !== undefined) {
      cancelAnimationFrame(frameRef.current)
    }

    const animate = () => {
      const delta = target - currentRef.current
      if (Math.abs(delta) < 0.002) {
        currentRef.current = target
        setFill(target)
        return
      }
      currentRef.current += delta * 0.18
      setFill(currentRef.current)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [target])

  return fill
}

function getTerminatorBlur(fill: number) {
  if (fill >= 0.98) return 0
  if (fill <= 0.06) return 9
  if (fill <= 0.12) return 11
  return 14
}

function getLitOpacity(fill: number) {
  if (fill <= 0.06) return 0.12 + (fill / 0.06) * 0.38
  return 1
}

function SleepMoon({ fill }: { fill: number }) {
  const uid = useId().replace(/:/g, '')
  const litGradientId = `sleep-moon-lit-${uid}`
  const idleGlowId = `sleep-moon-idle-${uid}`
  const phaseMaskId = `sleep-moon-mask-${uid}`
  const terminatorFilterId = `sleep-moon-blur-${uid}`
  const dropShadowId = `sleep-moon-shadow-${uid}`

  const travel = fill * MOON_SIZE
  const shadowOffsetX = travel * Math.cos(SHADOW_ANGLE_RAD)
  const shadowOffsetY = travel * Math.sin(SHADOW_ANGLE_RAD)
  const shadowCx = MOON_RADIUS + shadowOffsetX
  const shadowCy = MOON_RADIUS + shadowOffsetY
  const terminatorBlur = getTerminatorBlur(fill)
  const litOpacity = getLitOpacity(fill)
  const idleGlowOpacity = fill < 0.1 ? 0.55 * (1 - fill / 0.1) : 0
  const frameOffset = (MOON_FRAME - MOON_SIZE) / 2

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-visible"
      style={{ width: MOON_FRAME, height: MOON_FRAME }}
    >
      <svg
        width={MOON_FRAME}
        height={MOON_FRAME}
        viewBox={`0 0 ${MOON_FRAME} ${MOON_FRAME}`}
        className="overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={litGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="45%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>

          <radialGradient id={idleGlowId} cx="22%" cy="80%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 150, 70, 0.5)" />
            <stop offset="100%" stopColor="rgba(255, 150, 70, 0)" />
          </radialGradient>

          <filter
            id={terminatorFilterId}
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
          >
            <feGaussianBlur stdDeviation={terminatorBlur} />
          </filter>

          <filter id={dropShadowId} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="rgba(0,0,0,0.35)" />
          </filter>

          <mask id={phaseMaskId}>
            <circle cx={MOON_RADIUS + frameOffset} cy={MOON_RADIUS + frameOffset} r={MOON_RADIUS} fill="white" />
            {fill < 0.99 ? (
              <circle
                cx={shadowCx + frameOffset}
                cy={shadowCy + frameOffset}
                r={MOON_RADIUS}
                fill="black"
                filter={terminatorBlur > 0 ? `url(#${terminatorFilterId})` : undefined}
              />
            ) : null}
          </mask>
        </defs>

        <g filter={`url(#${dropShadowId})`}>
          <circle
            cx={MOON_RADIUS + frameOffset}
            cy={MOON_RADIUS + frameOffset}
            r={MOON_RADIUS}
            fill="rgba(0,0,0,0.35)"
          />

          <circle
            cx={MOON_RADIUS + frameOffset}
            cy={MOON_RADIUS + frameOffset}
            r={MOON_RADIUS}
            fill={`url(#${litGradientId})`}
            mask={`url(#${phaseMaskId})`}
            opacity={litOpacity}
          />

          {idleGlowOpacity > 0 ? (
            <circle
              cx={MOON_RADIUS + frameOffset}
              cy={MOON_RADIUS + frameOffset}
              r={MOON_RADIUS}
              fill={`url(#${idleGlowId})`}
              mask={`url(#${phaseMaskId})`}
              opacity={idleGlowOpacity}
            />
          ) : null}

          <circle
            cx={MOON_RADIUS + frameOffset}
            cy={MOON_RADIUS + frameOffset}
            r={MOON_RADIUS - 0.5}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  )
}

function SleepPill({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center whitespace-nowrap rounded-[24px] border border-solid px-[10px] py-2 text-[14px] leading-5 text-white"
      style={
        selected
          ? {
              backgroundImage: SLEEP_PILL_GRADIENT,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              borderColor: MCQ_PILL_BORDER_IDLE,
            }
      }
    >
      {label}
    </button>
  )
}

/** Figma 5629:14731 — sleep duration moon-phase meter */
export function SleepDurationMeter({
  selected,
  onSelect,
  items,
  fillById,
}: {
  selected: string | null
  onSelect: (value: string) => void
  /** When provided, these pills are shown with API labels. */
  items?: { id: string; label: string }[]
  /** Optional moon-fill amount per option id (0–1). */
  fillById?: Record<string, number>
}) {
  const pills = items && items.length > 0 ? items : SLEEP_DURATION_OPTIONS
  const targetFill =
    selected === null
      ? SLEEP_MOON_FILL.unselected
      : (fillById?.[selected] ??
        SLEEP_MOON_FILL[(selected as SleepDurationOption) ?? 'unselected'] ??
        SLEEP_MOON_FILL.unselected)
  const fill = useAnimatedFill(targetFill)
  const columnCount =
    pills.length <= 1 ? 1 : pills.length === 2 || pills.length === 4 ? 2 : 3

  return (
    <div className="flex w-full flex-col items-center gap-6 overflow-visible">
      <SleepMoon fill={fill} />

      <div
        className="grid w-full gap-3"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {pills.map((option) => (
          <SleepPill
            key={option.id}
            label={option.label}
            selected={selected === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  )
}
