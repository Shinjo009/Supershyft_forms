import { useEffect, useLayoutEffect, useRef } from 'react'

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

/**
 * Smooth pointer / arc rotation without React re-renders.
 * Same easing as before (lerp factor 0.22); updates happen imperatively via onFrame.
 */
export function useDialRotationDriver(
  targetRotation: number | null,
  onFrame: (rotation: number) => void,
) {
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  const currentRef = useRef(0)
  const frameRef = useRef<number | undefined>(undefined)
  const hasTargetRef = useRef(false)
  const targetRef = useRef<number | null>(null)
  targetRef.current = targetRotation

  // Apply before paint so React remounts don't flash the final angle for one frame.
  useLayoutEffect(() => {
    if (targetRotation === null) {
      hasTargetRef.current = false
      currentRef.current = 0
      onFrameRef.current(0)
      return
    }

    if (!hasTargetRef.current) {
      hasTargetRef.current = true
      currentRef.current = targetRotation
      onFrameRef.current(targetRotation)
      return
    }

    // Selection changed mid-dial: keep the current needle angle on the new DOM nodes.
    onFrameRef.current(currentRef.current)
  }, [targetRotation])

  useEffect(() => {
    if (frameRef.current !== undefined) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = undefined
    }

    if (targetRotation === null) {
      return
    }

    if (Math.abs(shortestAngleDelta(currentRef.current, targetRotation)) < 0.25) {
      currentRef.current = targetRotation
      onFrameRef.current(targetRotation)
      return
    }

    const animate = () => {
      const target = targetRef.current
      if (target === null) return

      const delta = shortestAngleDelta(currentRef.current, target)

      if (Math.abs(delta) < 0.25) {
        currentRef.current = target
        onFrameRef.current(target)
        frameRef.current = undefined
        return
      }

      currentRef.current += delta * 0.22
      onFrameRef.current(currentRef.current)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = undefined
      }
    }
  }, [targetRotation])
}
