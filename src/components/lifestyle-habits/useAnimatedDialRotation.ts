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

/** Smooth pointer / arc rotation when switching dial options. */
export function useAnimatedDialRotation(targetRotation: number | null) {
  const [rotation, setRotation] = useState(0)
  const currentRef = useRef(0)
  const frameRef = useRef<number | undefined>(undefined)
  const hasTargetRef = useRef(false)

  useEffect(() => {
    if (frameRef.current !== undefined) {
      cancelAnimationFrame(frameRef.current)
    }

    if (targetRotation === null) {
      hasTargetRef.current = false
      currentRef.current = 0
      setRotation(0)
      return
    }

    // First selection: start from the target so we don't sweep from an arbitrary origin.
    if (!hasTargetRef.current) {
      hasTargetRef.current = true
      currentRef.current = targetRotation
      setRotation(targetRotation)
      return
    }

    const animate = () => {
      const delta = shortestAngleDelta(currentRef.current, targetRotation)

      if (Math.abs(delta) < 0.25) {
        currentRef.current = targetRotation
        setRotation(targetRotation)
        return
      }

      currentRef.current += delta * 0.22
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
