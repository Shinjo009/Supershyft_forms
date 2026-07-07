import { useEffect, useRef, useState } from 'react'

function shortestAngleDelta(from: number, to: number) {
  let delta = to - from
  while (delta > 180) {
    delta -= 360
  }
  while (delta < -180) {
    delta += 360
  }
  return delta
}

/** Smooth pointer rotation when switching dial options. */
export function useAnimatedDialRotation(targetRotation: number | null) {
  const [rotation, setRotation] = useState(0)
  const currentRef = useRef(0)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (frameRef.current !== undefined) {
      cancelAnimationFrame(frameRef.current)
    }

    if (targetRotation === null) {
      currentRef.current = 0
      setRotation(0)
      return
    }

    const animate = () => {
      const delta = shortestAngleDelta(currentRef.current, targetRotation)

      if (Math.abs(delta) < 0.5) {
        currentRef.current = targetRotation
        setRotation(targetRotation)
        return
      }

      currentRef.current += delta * 0.18
      setRotation(currentRef.current)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [targetRotation])

  return rotation
}
