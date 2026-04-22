import { useId } from 'react'

const STEPS = ['Personal', 'Address', 'Package', 'Schedule'] as const

/** Circle centers and inactive rect origins from `src/assets/Stepper.svg` */
const STEP_LAYOUT = [
  { cx: 50, cy: 29, inactive: { x: 35, y: 14, w: 30, h: 30, rx: 15 } },
  { cx: 136.656, cy: 29, inactive: { x: 121.756, y: 14.1, w: 29.8, h: 29.8, rx: 14.9 } },
  { cx: 223.313, cy: 29.5, inactive: { x: 208.413, y: 14.6, w: 29.8, h: 29.8, rx: 14.9 } },
  { cx: 309.97, cy: 29.5, inactive: { x: 295.07, y: 14.6, w: 29.8, h: 29.8, rx: 14.9 } },
] as const

/** Grey track segments from SVG (x, width) at y=28 */
const GREY_SEGMENTS = [
  { x: 20, w: 102 },
  { x: 151, w: 58 },
  { x: 238, w: 57 },
  { x: 325, w: 15 },
] as const

type Props = {
  current: number
  compact?: boolean
}

function tealWidthPx(segIndex: number, current: number): number {
  const max = GREY_SEGMENTS[segIndex].w
  if (current >= 5) return max
  if (current > segIndex + 1) return max
  if (current === segIndex + 1) {
    const partial = [44 / 102, 0.5, 0.64, 0.78][segIndex] ?? 0.4
    return max * partial
  }
  return 0
}

export function Stepper({ current, compact }: Props) {
  const rid = useId().replace(/:/g, '')
  const f0 = `f0_${rid}`
  const f1 = `f1_${rid}`
  const maskId = `m_${rid}`

  const labelY = compact ? 56 : 57

  const stepForA11y = current >= 5 ? 4 : Math.max(1, Math.min(4, current))

  return (
    <div
      className="w-full"
      role="navigation"
      aria-label={`Form progress, step ${stepForA11y} of 4: ${STEPS[stepForA11y - 1]}`}
    >
      <svg
        className="mx-auto block h-auto w-full max-w-[360px]"
        viewBox="0 0 360 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <filter
            id={f0}
            x="10"
            y="19"
            width="64"
            height="22"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.564706 0 0 0 0 0.87451 0 0 0 0 0.619608 0 0 0 1 0"
            />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1" result="shape" />
          </filter>
          <filter
            id={f1}
            x="21"
            y="0"
            width="58"
            height="58"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology radius="4" operator="dilate" in="SourceAlpha" result="effect1" />
            <feOffset />
            <feGaussianBlur stdDeviation="5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.293432 0 0 0 0 0.553846 0 0 0 0 0.51218 0 0 0 1 0"
            />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect2" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect2" result="shape" />
          </filter>
          {current >= 1 && current <= 4 && (
            <mask id={`${maskId}_ring`} fill="white">
              <g
                transform={`translate(${STEP_LAYOUT[current - 1].cx - 50} ${STEP_LAYOUT[current - 1].cy - 29})`}
              >
                <path d="M35 29C35 20.7157 41.7157 14 50 14C58.2843 14 65 20.7157 65 29C65 37.2843 58.2843 44 50 44C41.7157 44 35 37.2843 35 29Z" />
              </g>
            </mask>
          )}
        </defs>

        {GREY_SEGMENTS.map((s, i) => (
          <rect
            key={`g-${i}`}
            opacity="0.5"
            x={s.x}
            y="28"
            width={s.w}
            height="1"
            rx="0.5"
            fill="#9A9A9A"
          />
        ))}

        {GREY_SEGMENTS.map((s, i) => {
          const w = tealWidthPx(i, current)
          if (w <= 0) return null
          return (
            <g key={`t-${i}`} filter={`url(#${f0})`}>
              <rect x={s.x} y="28" width={w} height="2" fill="#4B8D83" />
            </g>
          )
        })}

        {STEP_LAYOUT.map((step, i) => {
          const n = i + 1
          const active = current < 5 && n === current
          const done = (current < 5 && n < current) || (current >= 5 && n <= 4)
          const { cx, cy, inactive: r } = step

          if (active) {
            const dx = cx - 50
            const dy = cy - 29
            return (
              <g key={`a-${i}`}>
                <g transform={`translate(${dx} ${dy})`} filter={`url(#${f1})`}>
                  <path
                    d="M35 29C35 20.7157 41.7157 14 50 14C58.2843 14 65 20.7157 65 29C65 37.2843 58.2843 44 50 44C41.7157 44 35 37.2843 35 29Z"
                    fill="#063533"
                    shapeRendering="crispEdges"
                  />
                  <path
                    d="M35 29M65 29M65 29M35 29M50 14M65 29M50 44M35 29M50 44V42.4C42.5994 42.4 36.6 36.4006 36.6 29H35H33.4C33.4 38.1679 40.8321 45.6 50 45.6V44ZM65 29H63.4C63.4 36.4006 57.4006 42.4 50 42.4V44V45.6C59.1679 45.6 66.6 38.1679 66.6 29H65ZM50 14V15.6C57.4006 15.6 63.4 21.5994 63.4 29H65H66.6C66.6 19.8321 59.1679 12.4 50 12.4V14ZM50 14V12.4C40.8321 12.4 33.4 19.8321 33.4 29H35H36.6C36.6 21.5994 42.5994 15.6 50 15.6V14Z"
                    fill="#4B8D83"
                    mask={`url(#${maskId}_ring)`}
                  />
                </g>
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  className="font-semibold"
                  style={{ fontFamily: 'Lato, sans-serif', fontSize: compact ? 12 : 13 }}
                >
                  {n}
                </text>
              </g>
            )
          }

          if (done) {
            return (
              <g key={`d-${i}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={14.9}
                  fill="#063533"
                  stroke="#4B8D83"
                  strokeWidth="1.6"
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#4B8D83"
                  className="font-semibold"
                  style={{ fontFamily: 'Lato, sans-serif', fontSize: compact ? 12 : 13 }}
                >
                  {n}
                </text>
              </g>
            )
          }

          return (
            <g key={`i-${i}`} opacity="0.5">
              <rect
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx={r.rx}
                fill="black"
                fillOpacity="0.01"
              />
              <rect
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx={r.rx}
                stroke="#9A9A9A"
                strokeWidth="0.2"
                fill="none"
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#9A9A9A"
                className="font-semibold"
                style={{ fontFamily: 'Lato, sans-serif', fontSize: compact ? 12 : 13 }}
              >
                {n}
              </text>
            </g>
          )
        })}

        {STEP_LAYOUT.map((step, i) => {
          const label = STEPS[i]
          const n = i + 1
          const active = current < 5 && n === current
          const done = (current < 5 && n < current) || (current >= 5 && n <= 4)
          const fill = active ? '#FFFFFF' : done ? '#4B8D83' : '#9A9A9A'
          const weight = active ? 700 : done ? 500 : 400
          return (
            <text
              key={`lbl-${i}`}
              x={step.cx}
              y={labelY}
              textAnchor="middle"
              fill={fill}
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: compact ? 10 : 11,
                fontWeight: weight,
              }}
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
