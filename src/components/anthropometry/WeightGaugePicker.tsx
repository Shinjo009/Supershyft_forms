import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { clamp } from './anthropometryConfig'

const VB_W = 320
const VB_H = 192
const CX = 160
const CY = 172
const R_TRACK = 108
const R_TICK_OUTER = 102
const R_LABEL = 128
const R_ARROW = 82
const TRACK_WIDTH = 12
const FRICTION = 0.98
const MIN_FLING = 0.01
const SNAP_EPS = 0.04
const FLING_SPEED = 0.22
const SETTLE_LERP = 0.07
const MAX_VELOCITY = 0.35

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

function polar(radius: number, angle: number): { x: number; y: number } {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle),
  }
}

function describeUpperArc(radius: number): string {
  const steps = 72
  const parts: string[] = []
  for (let i = 0; i <= steps; i += 1) {
    const angle = Math.PI * (1 - i / steps)
    const { x, y } = polar(radius, angle)
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return parts.join(' ')
}

function tickAngle(value: number, min: number, max: number): number {
  const t = (clamp(value, min, max) - min) / (max - min || 1)
  return Math.PI * (1 - t)
}

function angleToValue(angle: number, min: number, max: number): number {
  const t = 1 - clamp(angle, 0, Math.PI) / Math.PI
  return min + t * (max - min)
}

function tickKind(value: number, majorEvery: number): 'major' | 'mid' | 'minor' {
  if (value % majorEvery === 0) return 'major'
  if (value % (majorEvery / 2) === 0) return 'mid'
  return 'minor'
}

export function WeightGaugePicker({
  value,
  min,
  max,
  unitLabel,
  onChange,
}: {
  value: number
  min: number
  max: number
  unitLabel: string
  onChange: (value: number) => void
}) {
  const uid = useId().replace(/:/g, '')
  const gradId = `ndq-w-grad-${uid}`
  const svgRef = useRef<SVGSVGElement>(null)
  const glowHaloRef = useRef<SVGPathElement>(null)
  const glowCoreRef = useRef<SVGPathElement>(null)
  const arrowRef = useRef<SVGGElement>(null)
  const visualRef = useRef(value)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const rangeRef = useRef({ min, max })
  const draggingRef = useRef(false)
  const velocityRef = useRef(0)
  const lastValueRef = useRef(value)
  const lastTsRef = useRef(0)
  const rafRef = useRef(0)
  const [display, setDisplay] = useState(Math.round(value))

  valueRef.current = value
  onChangeRef.current = onChange
  rangeRef.current = { min, max }

  const minorStep = max - min > 150 ? 2 : 1
  const majorEvery = max - min > 150 ? 20 : 10

  const ticks = useMemo(() => {
    const list: { value: number; kind: 'major' | 'mid' | 'minor'; key: string }[] = []
    let i = 0
    for (let tickValue = min; tickValue <= max + 0.01; tickValue += minorStep) {
      const rounded = Math.round(tickValue)
      list.push({ value: rounded, kind: tickKind(rounded, majorEvery), key: `t-${i}` })
      i += 1
    }
    return list
  }, [majorEvery, max, min, minorStep])

  const applyVisual = useCallback(() => {
    const { min: lo, max: hi } = rangeRef.current
    const current = visualRef.current
    const t = clamp((current - lo) / (hi - lo || 1), 0, 1)
    const dash = `${t} 1`
    glowHaloRef.current?.setAttribute('stroke-dasharray', dash)
    glowCoreRef.current?.setAttribute('stroke-dasharray', dash)
    const angle = tickAngle(current, lo, hi)
    const pos = polar(R_ARROW, angle)
    const deg = 90 - (angle * 180) / Math.PI
    arrowRef.current?.setAttribute('transform', `translate(${pos.x} ${pos.y}) rotate(${deg})`)
  }, [])

  const emitValue = useCallback(() => {
    const { min: lo, max: hi } = rangeRef.current
    const next = Math.round(clamp(visualRef.current, lo, hi))
    setDisplay(next)
    if (next !== valueRef.current) onChangeRef.current(next)
  }, [])

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const settleToSnap = useCallback(() => {
    const { min: lo, max: hi } = rangeRef.current
    const target = clamp(roundToStep(visualRef.current, 1), lo, hi)
    const tick = () => {
      const delta = target - visualRef.current
      if (Math.abs(delta) < SNAP_EPS && Math.abs(velocityRef.current) < MIN_FLING) {
        visualRef.current = target
        velocityRef.current = 0
        applyVisual()
        emitValue()
        rafRef.current = 0
        return
      }
      visualRef.current += delta * SETTLE_LERP
      velocityRef.current *= 0.72
      applyVisual()
      emitValue()
      rafRef.current = requestAnimationFrame(tick)
    }
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [applyVisual, emitValue, stopRaf])

  const fling = useCallback(() => {
    let previous = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(32, now - previous)
      previous = now
      const { min: lo, max: hi } = rangeRef.current
      let next = visualRef.current + velocityRef.current * dt * FLING_SPEED
      if (next < lo || next > hi) {
        next = clamp(next, lo, hi)
        velocityRef.current = 0
      }
      visualRef.current = next
      velocityRef.current *= FRICTION ** (dt / 16.67)
      applyVisual()
      emitValue()
      if (Math.abs(velocityRef.current) < MIN_FLING) {
        settleToSnap()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [applyVisual, emitValue, settleToSnap, stopRaf])

  const clientToValue = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    const { min: lo, max: hi } = rangeRef.current
    if (!svg) return visualRef.current
    const rect = svg.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * VB_W
    const y = ((clientY - rect.top) / rect.height) * VB_H
    const angle = Math.atan2(CY - y, x - CX)
    return angleToValue(angle, lo, hi)
  }

  useLayoutEffect(() => {
    visualRef.current = value
    setDisplay(Math.round(value))
    applyVisual()
  }, [applyVisual, min, max])

  useEffect(() => {
    if (draggingRef.current || rafRef.current) return
    visualRef.current = value
    setDisplay(Math.round(value))
    applyVisual()
  }, [applyVisual, value])

  useEffect(() => () => stopRaf(), [stopRaf])

  useEffect(() => {
    const node = svgRef.current
    if (!node) return
    let wheelTimer = 0
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      stopRaf()
      const { min: lo, max: hi } = rangeRef.current
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      visualRef.current = clamp(visualRef.current + Math.sign(delta), lo, hi)
      applyVisual()
      emitValue()
      window.clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => settleToSnap(), 90)
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.clearTimeout(wheelTimer)
      node.removeEventListener('wheel', onWheel)
    }
  }, [applyVisual, emitValue, settleToSnap, stopRaf])

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.preventDefault()
    draggingRef.current = true
    velocityRef.current = 0
    lastTsRef.current = event.timeStamp
    stopRaf()
    event.currentTarget.setPointerCapture(event.pointerId)
    const next = clientToValue(event.clientX, event.clientY)
    lastValueRef.current = next
    visualRef.current = next
    applyVisual()
    emitValue()
  }

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return
    const next = clientToValue(event.clientX, event.clientY)
    const dt = Math.max(8, event.timeStamp - lastTsRef.current)
    velocityRef.current = clamp((next - lastValueRef.current) / dt, -MAX_VELOCITY, MAX_VELOCITY)
    lastValueRef.current = next
    lastTsRef.current = event.timeStamp
    visualRef.current = next
    applyVisual()
    emitValue()
  }

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
    if (Math.abs(velocityRef.current) > MIN_FLING) fling()
    else settleToSnap()
  }

  const nudge = (delta: number) => {
    const { min: lo, max: hi } = rangeRef.current
    const next = clamp(Math.round(valueRef.current + delta), lo, hi)
    visualRef.current = next
    applyVisual()
    emitValue()
  }

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      nudge(1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      nudge(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      nudge(min - valueRef.current)
    } else if (event.key === 'End') {
      event.preventDefault()
      nudge(max - valueRef.current)
    }
  }

  const innerLen = { major: 16, mid: 11, minor: 7 }
  const trackPath = describeUpperArc(R_TRACK)
  const startAngle = tickAngle(value, min, max)
  const startPos = polar(R_ARROW, startAngle)
  const startDeg = 90 - (startAngle * 180) / Math.PI

  return (
    <div className="ndq-weight">
      <div className="ndq-weight__stage">
        <svg
          ref={svgRef}
          className="ndq-weight__svg"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={display}
          aria-label="Body weight"
          tabIndex={0}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#024744" />
              <stop offset="48%" stopColor="#013B4E" />
              <stop offset="100%" stopColor="#013654" />
            </linearGradient>
          </defs>

          <path
            d={trackPath}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="butt"
          />
          <path
            ref={glowHaloRef}
            d={trackPath}
            fill="none"
            stroke="#04FBCD"
            strokeWidth={TRACK_WIDTH + 4}
            strokeLinecap="butt"
            opacity="0.22"
            pathLength={1}
            strokeDasharray="0.5 1"
          />
          <path
            ref={glowCoreRef}
            d={trackPath}
            fill="none"
            stroke="#04FBCD"
            strokeWidth={TRACK_WIDTH - 2}
            strokeLinecap="butt"
            opacity="0.85"
            pathLength={1}
            strokeDasharray="0.5 1"
          />

          {ticks.map((tick) => {
            const angle = tickAngle(tick.value, min, max)
            const inner = polar(R_TICK_OUTER - innerLen[tick.kind], angle)
            const outer = polar(R_TICK_OUTER, angle)
            return (
              <line
                key={tick.key}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#DDDBDB"
                strokeOpacity={tick.kind === 'major' ? 0.72 : tick.kind === 'mid' ? 0.45 : 0.28}
                strokeWidth={tick.kind === 'major' ? 2 : 1}
                strokeLinecap="round"
              />
            )
          })}
          {ticks
            .filter((tick) => tick.kind === 'major')
            .map((tick) => {
              const point = polar(R_LABEL, tickAngle(tick.value, min, max))
              const deg = 90 - (tickAngle(tick.value, min, max) * 180) / Math.PI
              return (
                <text
                  key={`label-${tick.key}`}
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#9A9A9A"
                  fontFamily="DM Sans, sans-serif"
                  fontSize="12"
                  transform={`rotate(${deg} ${point.x} ${point.y})`}
                >
                  {Math.round(tick.value)}
                </text>
              )
            })}

          <g ref={arrowRef} transform={`translate(${startPos.x} ${startPos.y}) rotate(${startDeg})`}>
            <circle r="18" fill="transparent" />
            <polygon points="0,-7 7,6 -7,6" fill="#9A9A9A" />
          </g>
        </svg>

        <div className="ndq-weight__readout" aria-hidden>
          <p className="ndq-weight__value">{display}</p>
          <p className="ndq-weight__unit">{unitLabel}</p>
        </div>
      </div>

      <input
        className="ndq-weight__slider"
        type="range"
        min={min}
        max={max}
        step={1}
        value={display}
        onChange={(event) => {
          const next = Number(event.target.value)
          visualRef.current = next
          applyVisual()
          setDisplay(next)
          onChange(next)
        }}
        aria-label="Weight slider"
      />
    </div>
  )
}
