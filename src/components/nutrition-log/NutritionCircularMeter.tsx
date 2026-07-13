import {
  NUTRITION_METER_RING_SIZE,
  NUTRITION_METER_STROKE,
} from './nutritionCircularMeterConfig'
import { useAnimatedMeterNumber } from './useAnimatedMeterNumber'

const RADIUS = (NUTRITION_METER_RING_SIZE - NUTRITION_METER_STROKE) / 2
const CENTER = NUTRITION_METER_RING_SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Extra canvas so SVG glow is not clipped by the container on mobile */
const METER_FRAME = NUTRITION_METER_RING_SIZE + 48
const FRAME_OFFSET = (METER_FRAME - NUTRITION_METER_RING_SIZE) / 2

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
  const gradientId = `${meterId}-ring-gradient`
  const glowFilterId = `${meterId}-ring-glow`
  const haloOpacity = clampedFill > 0 ? 0.22 + clampedFill * 0.18 : 0

  return (
    <div
      className="relative flex items-center justify-center overflow-visible"
      style={{ width: METER_FRAME, height: METER_FRAME }}
    >
      <svg
        width={METER_FRAME}
        height={METER_FRAME}
        viewBox={`0 0 ${METER_FRAME} ${METER_FRAME}`}
        className="absolute overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={FRAME_OFFSET + CENTER - RADIUS}
            y1={FRAME_OFFSET + CENTER - RADIUS}
            x2={FRAME_OFFSET + CENTER + RADIUS}
            y2={FRAME_OFFSET + CENTER + RADIUS}
          >
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          <filter
            id={glowFilterId}
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
            filterUnits="objectBoundingBox"
          >
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${FRAME_OFFSET} ${FRAME_OFFSET}) rotate(-90 ${CENTER} ${CENTER})`}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={NUTRITION_METER_STROKE}
          />

          {clampedFill > 0 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={NUTRITION_METER_STROKE + 10}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              opacity={haloOpacity}
              filter={`url(#${glowFilterId})`}
            />
          ) : null}

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
        </g>
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
