import { useEffect, useRef, useState } from 'react'
import { NUTRITION_METER_ANIMATION_MS } from './nutritionCircularMeterConfig'

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function useAnimatedMeterNumber(target: number) {
  const [value, setValue] = useState(target)
  const currentRef = useRef(target)
  const startRef = useRef(target)
  const startTimeRef = useRef<number | null>(null)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (frameRef.current !== undefined) {
      cancelAnimationFrame(frameRef.current)
    }

    startRef.current = currentRef.current
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(1, elapsed / NUTRITION_METER_ANIMATION_MS)
      const eased = easeInOutCubic(progress)
      const next = startRef.current + (target - startRef.current) * eased

      currentRef.current = next
      setValue(next)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [target])

  return value
}
