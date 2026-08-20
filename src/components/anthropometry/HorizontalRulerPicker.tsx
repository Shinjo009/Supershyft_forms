import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { PointerEvent } from 'react'
import { clamp } from './anthropometryConfig'

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

export function HorizontalRulerPicker({
  value,
  min,
  max,
  step = 0.1,
  snapStep,
  unitLabel,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  snapStep?: number
  unitLabel: string
  onChange: (value: number) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef(160)
  const offsetRef = useRef(valueToOffset(value, min))
  const velocityRef = useRef(0)
  const rafRef = useRef(0)
  const draggingRef = useRef(false)
  const lastXRef = useRef(0)
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
    const x = centerRef.current - offsetRef.current
    const transform = `translate3d(${x}px, 0, 0)`
    if (trackRef.current) trackRef.current.style.transform = transform
    if (labelsRef.current) labelsRef.current.style.transform = transform
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
    const node = viewportRef.current
    if (!node) return
    const syncWidth = () => {
      centerRef.current = node.clientWidth / 2
      applyTransform()
    }
    syncWidth()
    const observer = new ResizeObserver(syncWidth)
    observer.observe(node)
    return () => observer.disconnect()
  }, [applyTransform])

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
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      offsetRef.current += delta * 0.55
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
    lastXRef.current = event.clientX
    lastTsRef.current = event.timeStamp
    stopRaf()
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const x = event.clientX
    const dx = lastXRef.current - x
    const dt = Math.max(8, event.timeStamp - lastTsRef.current)
    lastXRef.current = x
    lastTsRef.current = event.timeStamp
    offsetRef.current += dx
    velocityRef.current = clamp(dx / dt, -3.2, 3.2)
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

  return (
    <div className="ndq-hruler">
      <div className="ndq-hruler__readout">
        <p className="ndq-hruler__value">{formatFixed(value, snapStep ?? step)}</p>
        <p className="ndq-hruler__unit">{unitLabel}</p>
      </div>

      <div
        className="ndq-hruler__scale"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label="Measurement"
        tabIndex={0}
      >
        <div className="ndq-hruler__card">
          <div ref={viewportRef} className="ndq-hruler__viewport">
            <div ref={trackRef} className="ndq-hruler__track">
              {ticks.map((tick) => {
                const major = Math.abs(tick - Math.round(tick)) < 0.001
                return (
                  <div
                    key={tick}
                    className="ndq-hruler__col"
                    style={{ left: valueToOffset(tick, min) }}
                  >
                    <span className={`ndq-hruler__tick${major ? ' is-major' : ''}`} />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="ndq-hruler__hairline" aria-hidden />
        </div>
        <div className="ndq-hruler__labels" aria-hidden>
          <div ref={labelsRef} className="ndq-hruler__track">
            {ticks
              .filter((tick) => Math.abs(tick - Math.round(tick)) < 0.001)
              .map((tick) => (
                <span
                  key={`label-${tick}`}
                  className="ndq-hruler__label"
                  style={{ left: valueToOffset(tick, min) }}
                >
                  {Math.round(tick)}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
