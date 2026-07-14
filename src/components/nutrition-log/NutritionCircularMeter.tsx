import {
  NUTRITION_METER_RING_SIZE,
  NUTRITION_METER_STROKE,
} from './nutritionCircularMeterConfig'
import { useAnimatedMeterNumber } from './useAnimatedMeterNumber'

/** Half-stroke + AA so the thick ring is not clipped by the SVG box */
const PAD = NUTRITION_METER_STROKE / 2 + 2
const FRAME = NUTRITION_METER_RING_SIZE + PAD * 2
const C = FRAME / 2
const R = NUTRITION_METER_RING_SIZE / 2 - NUTRITION_METER_STROKE / 2
const CIRC = 2 * Math.PI * R

/** Figma 5646:36079 — thick cyan→blue circular meter */
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
  const fill = Math.min(1, Math.max(0, useAnimatedMeterNumber(fillRatio)))
  const display = Math.round(useAnimatedMeterNumber(value))
  const gradientId = `${meterId}-g`

  return (
    <div
      className="relative flex items-center justify-center overflow-visible"
      style={{ width: FRAME, height: FRAME }}
    >
      <svg
        width={FRAME}
        height={FRAME}
        viewBox={`0 0 ${FRAME} ${FRAME}`}
        className="absolute inset-0 overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <g transform={`rotate(-90 ${C} ${C})`}>
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={NUTRITION_METER_STROKE}
          />
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={NUTRITION_METER_STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - fill)}
          />
        </g>
      </svg>

      <div className="relative flex flex-col items-center">
        <span className="text-[48px] font-extrabold leading-[48px] tracking-[-0.96px] text-white">
          {display}
        </span>
        <span className="pt-1 text-[12px] font-bold uppercase leading-4 tracking-[1.2px] text-[rgba(59,130,246,0.8)]">
          {unitLabel}
        </span>
      </div>
    </div>
  )
}
