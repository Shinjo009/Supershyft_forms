import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { PointerEvent } from 'react'
import { clamp } from './anthropometryConfig'

const VIEWPORT_HEIGHT = 268
const PX_PER_UNIT = 64
const FRICTION = 0.935
const SNAP_PX = 0.35
const MIN_FLING = 0.04
const RUBBER = 0.28

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

function valueToOffset(value: number, min: number): number {
  return (value - min) * PX_PER_UNIT
}

function offsetToValue(offset: number, min: number, max: number, step: number): number {
  return clamp(roundToStep(min + offset / PX_PER_UNIT, step), min, max)
}

function formatFixed(value: number, step: number): string {
  const decimals = step < 1 ? 1 : 0
  return value.toFixed(decimals)
}

export function HeightRulerPicker({
  value,
  min,
  max,
  step = 0.1,
  snapStep,
  unitLabel,
  formatValue,
  formatTickLabel,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  snapStep?: number
  unitLabel: string
  formatValue?: (value: number) => string
  formatTickLabel?: (value: number) => string
  onChange: (value: number) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(valueToOffset(value, min))
  const velocityRef = useRef(0)
  const rafRef = useRef(0)
  const draggingRef = useRef(false)
  const lastYRef = useRef(0)
  const lastTsRef = useRef(0)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const rangeRef = useRef({ min, max, step, snapStep: snapStep ?? step })

  valueRef.current = value
  onChangeRef.current = onChange
  rangeRef.current = { min, max, step, snapStep: snapStep ?? step }

  const ticks = useMemo(() => {
    const list: number[] = []
    for (let tick = min; tick <= max + step / 2; tick = roundToStep(tick + step, step)) {
      list.push(Number(tick.toFixed(1)))
    }
    return list
  }, [min, max, step])

  const applyTransform = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const center = VIEWPORT_HEIGHT / 2
    track.style.transform = `translate3d(0, ${center - offsetRef.current}px, 0)`
  }, [])

  const emitValue = useCallback(() => {
    const { min: lo, max: hi, snapStep: snap } = rangeRef.current
    const next = offsetToValue(offsetRef.current, lo, hi, snap)
    if (next !== valueRef.current) onChangeRef.current(next)
  }, [])

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const settleToSnap = useCallback(() => {
    const { min: lo, max: hi, snapStep: snap } = rangeRef.current
    const snapped = offsetToValue(offsetRef.current, lo, hi, snap)
    const target = valueToOffset(snapped, lo)
    const tick = () => {
      const delta = target - offsetRef.current
      if (Math.abs(delta) < SNAP_PX && Math.abs(velocityRef.current) < MIN_FLING) {
        offsetRef.current = target
        velocityRef.current = 0
        applyTransform()
        emitValue()
        rafRef.current = 0
        return
      }
      offsetRef.current += delta * 0.22
      velocityRef.current *= 0.7
      applyTransform()
      emitValue()
      rafRef.current = requestAnimationFrame(tick)
    }
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [applyTransform, emitValue, stopRaf])

  const fling = useCallback(() => {
    let previous = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(32, now - previous)
      previous = now
      const { min: lo, max: hi } = rangeRef.current
      let offset = offsetRef.current + velocityRef.current * dt
      const loBound = 0
      const hiBound = (hi - lo) * PX_PER_UNIT

      if (offset < loBound) {
        offset = loBound + (offset - loBound) * RUBBER
        velocityRef.current *= 0.55
      } else if (offset > hiBound) {
        offset = hiBound + (offset - hiBound) * RUBBER
        velocityRef.current *= 0.55
      }

      offsetRef.current = offset
      velocityRef.current *= FRICTION ** (dt / 16.67)
      applyTransform()
      emitValue()

      if (Math.abs(velocityRef.current) < MIN_FLING) {
        offsetRef.current = clamp(offsetRef.current, loBound, hiBound)
        applyTransform()
        settleToSnap()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [applyTransform, emitValue, settleToSnap, stopRaf])

  useEffect(() => {
    offsetRef.current = valueToOffset(value, min)
    applyTransform()
  }, [applyTransform, min, max])

  useEffect(() => {
    if (draggingRef.current || rafRef.current) return
    offsetRef.current = valueToOffset(value, min)
    applyTransform()
  }, [applyTransform, min, value])

  useEffect(() => () => stopRaf(), [stopRaf])

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    let wheelTimer = 0
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      stopRaf()
      offsetRef.current += event.deltaY * 0.55
      applyTransform()
      emitValue()
      window.clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => settleToSnap(), 90)
    }
    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.clearTimeout(wheelTimer)
      node.removeEventListener('wheel', handleWheel)
    }
  }, [applyTransform, emitValue, settleToSnap, stopRaf])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    draggingRef.current = true
    velocityRef.current = 0
    lastYRef.current = event.clientY
    lastTsRef.current = event.timeStamp
    stopRaf()
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const y = event.clientY
    const dy = lastYRef.current - y
    const dt = Math.max(8, event.timeStamp - lastTsRef.current)
    lastYRef.current = y
    lastTsRef.current = event.timeStamp
    offsetRef.current += dy
    velocityRef.current = clamp(dy / dt, -3.2, 3.2)
    applyTransform()
    emitValue()
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
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

  const display = formatValue ? formatValue(value) : formatFixed(value, step)

  return (
    <div className="ndq-ruler">
      <div
        ref={viewportRef}
        className="ndq-ruler__viewport"
        style={{ height: VIEWPORT_HEIGHT }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label="Height"
        tabIndex={0}
      >
        <div ref={trackRef} className="ndq-ruler__track">
          {ticks.map((tick) => {
            const major = Math.abs(tick - Math.round(tick)) < 0.001
            const mid = !major && Math.abs(tick * 2 - Math.round(tick * 2)) < 0.001
            return (
              <div
                key={tick}
                className="ndq-ruler__row"
                style={{ top: valueToOffset(tick, min) }}
              >
                <span className={`ndq-ruler__label${major ? ' is-major' : ''}`}>
                  {major ? (formatTickLabel ? formatTickLabel(tick) : String(Math.round(tick))) : ''}
                </span>
                <span
                  className={`ndq-ruler__tick${major ? ' is-major' : mid ? ' is-mid' : ''}`}
                />
              </div>
            )
          })}
        </div>

        <div className="ndq-ruler__center" aria-hidden>
          <div className="ndq-ruler__hairline" />
        </div>
      </div>

      <div className="ndq-ruler__readout">
        <div className="ndq-ruler__caret" aria-hidden />
        <div className="ndq-ruler__value-wrap">
          <p className="ndq-ruler__value">{display}</p>
          {unitLabel ? <p className="ndq-ruler__unit">{unitLabel}</p> : null}
        </div>
      </div>
    </div>
  )
}
