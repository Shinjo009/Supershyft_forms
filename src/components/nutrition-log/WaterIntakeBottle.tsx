import { useId } from 'react'
import {
  formatWaterLiters,
  WATER_BOTTLE_BODY_HEIGHT,
} from './waterIntakeConfig'
import { useAnimatedMeterNumber } from './useAnimatedMeterNumber'

const BOTTLE_W = 135
const BOTTLE_H = WATER_BOTTLE_BODY_HEIGHT
const CAP_W = 73
const CAP_H = 41
const NECK_W = 65
const NECK_H = 7
const TOTAL_H = CAP_H + NECK_H + BOTTLE_H

/** Rounded bottle body — top radius 20, bottom radius 10 */
const BOTTLE_BODY_PATH = `
  M 20 0
  H 115
  Q ${BOTTLE_W} 0 ${BOTTLE_W} 20
  V 231
  Q ${BOTTLE_W} ${BOTTLE_H} 125 ${BOTTLE_H}
  H 10
  Q 0 ${BOTTLE_H} 0 231
  V 20
  Q 0 0 20 0
  Z
`

/** Figma 5627:13277 — animated water bottle fill */
export function WaterIntakeBottle({
  liters,
  fillRatio,
}: {
  liters: number
  fillRatio: number
}) {
  const uid = useId().replace(/:/g, '')
  const clipId = `water-bottle-clip-${uid}`
  const waterGradId = `water-bottle-fill-${uid}`
  const glassGradId = `water-bottle-glass-${uid}`
  const capGradId = `water-bottle-cap-${uid}`

  const animatedLiters = useAnimatedMeterNumber(liters)
  const animatedFill = useAnimatedMeterNumber(fillRatio)
  const clampedFill = Math.min(1, Math.max(0, animatedFill))
  const liquidHeight = clampedFill * BOTTLE_H
  const waterY = BOTTLE_H - liquidHeight
  const showLabel = clampedFill > 0.08
  const bodyTop = CAP_H + NECK_H

  return (
    <div className="relative shrink-0" style={{ width: BOTTLE_W, height: TOTAL_H }}>
      <svg
        width={BOTTLE_W}
        height={TOTAL_H}
        viewBox={`0 0 ${BOTTLE_W} ${TOTAL_H}`}
        aria-hidden
        className="overflow-visible"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={BOTTLE_BODY_PATH} transform={`translate(0 ${bodyTop})`} />
          </clipPath>

          <linearGradient id={capGradId} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#d9d9d9" />
            <stop offset="100%" stopColor="#3e3e3e" />
          </linearGradient>

          <linearGradient id={glassGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(42,49,62,0.2)" />
            <stop offset="100%" stopColor="rgba(21,29,41,0.2)" />
          </linearGradient>

          <linearGradient id={waterGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#59d2ff" />
            <stop offset="100%" stopColor="#0084ff" />
          </linearGradient>
        </defs>

        <rect
          x={(BOTTLE_W - CAP_W) / 2}
          y={0}
          width={CAP_W}
          height={CAP_H}
          rx={3}
          fill={`url(#${capGradId})`}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={0.5}
        />

        <rect
          x={(BOTTLE_W - NECK_W) / 2}
          y={CAP_H}
          width={NECK_W}
          height={NECK_H}
          fill="transparent"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={0.5}
        />

        <path
          d={BOTTLE_BODY_PATH}
          transform={`translate(0 ${bodyTop})`}
          fill={`url(#${glassGradId})`}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={0.5}
        />

        {liquidHeight > 0 ? (
          <g clipPath={`url(#${clipId})`}>
            <rect
              x={0}
              y={bodyTop + waterY}
              width={BOTTLE_W}
              height={liquidHeight}
              fill={`url(#${waterGradId})`}
            />
            {clampedFill < 0.995 ? (
              <line
                x1={12}
                y1={bodyTop + waterY + 0.5}
                x2={BOTTLE_W - 12}
                y2={bodyTop + waterY + 0.5}
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={1}
                strokeLinecap="round"
              />
            ) : null}
          </g>
        ) : null}
      </svg>

      {showLabel ? (
        <div
          className="pointer-events-none absolute left-0 flex w-full flex-col items-center justify-center gap-1"
          style={{ top: bodyTop, height: BOTTLE_H }}
        >
          <span className="text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-white">
            {formatWaterLiters(animatedLiters)}
          </span>
          <span className="text-[10px] font-bold uppercase leading-[15px] tracking-[2px] text-[rgba(255,255,255,0.8)]">
            DAILY
          </span>
        </div>
      ) : null}
    </div>
  )
}
