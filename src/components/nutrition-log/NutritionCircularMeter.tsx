import {
  NUTRITION_METER_RING_SIZE,
  NUTRITION_METER_STROKE,
} from './nutritionCircularMeterConfig'
import { useAnimatedMeterNumber } from './useAnimatedMeterNumber'

const RADIUS = (NUTRITION_METER_RING_SIZE - NUTRITION_METER_STROKE) / 2
const CENTER = NUTRITION_METER_RING_SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Shared cyan→blue circular meter — Figma 5646:36035, 5701:16098 */
export function NutritionCircularMeter({
  meterId,
  value,
  fillRatio,
  unitLabel,
}: {
  meterId: string
  value: number
  fillRatio: number
  unitLabel: string
}) {
  const animatedValue = useAnimatedMeterNumber(value)
  const animatedFill = useAnimatedMeterNumber(fillRatio)
  const clampedFill = Math.min(1, Math.max(0, animatedFill))
  const dashOffset = CIRCUMFERENCE * (1 - clampedFill)
  const displayValue = Math.round(animatedValue)
  const glowOpacity = clampedFill > 0 ? 0.35 + clampedFill * 0.25 : 0
  const gradientId = `${meterId}-ring-gradient`
  const glowFilterId = `${meterId}-ring-glow`

  return (
    <div className="relative flex size-[220px] items-center justify-center">
      <div
        className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-700 ease-out"
        style={{
          opacity: glowOpacity,
          background:
            'radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(59,130,246,0.18) 45%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      <svg
        width={NUTRITION_METER_RING_SIZE}
        height={NUTRITION_METER_RING_SIZE}
        viewBox={`0 0 ${NUTRITION_METER_RING_SIZE} ${NUTRITION_METER_RING_SIZE}`}
        className="absolute -rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={CENTER - RADIUS}
            y1={CENTER - RADIUS}
            x2={CENTER + RADIUS}
            y2={CENTER + RADIUS}
          >
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <filter
            id={glowFilterId}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            filterUnits="objectBoundingBox"
          >
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={NUTRITION_METER_STROKE}
        />

        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={NUTRITION_METER_STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          filter={clampedFill > 0 ? `url(#${glowFilterId})` : undefined}
        />
      </svg>

      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: RADIUS * 1.72,
          height: RADIUS * 1.72,
          background:
            clampedFill > 0
              ? 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.05) 55%, transparent 100%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center">
        <span className="text-[48px] font-extrabold leading-[48px] tracking-[-0.96px] text-white">
          {displayValue}
        </span>
        <span className="pt-1 text-[12px] font-bold uppercase leading-4 tracking-[1.2px] text-[rgba(59,130,246,0.8)]">
          {unitLabel}
        </span>
      </div>
    </div>
  )
}
