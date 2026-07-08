import { useEffect, useRef, useState } from 'react'
import {
  SLEEP_DURATION_OPTIONS,
  type SleepDurationOption,
} from '../../data/lifestyleHabitsQuestions'
import { SLEEP_MOON_FILL, SLEEP_PILL_GRADIENT } from './sleepDurationConfig'

const MOON_SIZE = 148
/** Shadow slides toward ~2 o'clock so the lit crescent starts near 7:30 (bottom-left) */
const SHADOW_ANGLE_RAD = (-28 * Math.PI) / 180

function useAnimatedFill(target: number) {
  const [fill, setFill] = useState(target)
  const currentRef = useRef(target)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (frameRef.current !== undefined) {
      cancelAnimationFrame(frameRef.current)
    }

    const animate = () => {
      const delta = target - currentRef.current
      if (Math.abs(delta) < 0.002) {
        currentRef.current = target
        setFill(target)
        return
      }
      currentRef.current += delta * 0.18
      setFill(currentRef.current)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [target])

  return fill
}

function getTerminatorBlur(fill: number) {
  if (fill >= 0.98) return 0
  if (fill <= 0.06) return 9
  if (fill <= 0.12) return 11
  return 14
}

function getLitOpacity(fill: number) {
  if (fill <= 0.06) return 0.12 + (fill / 0.06) * 0.38
  return 1
}

function SleepMoon({ fill }: { fill: number }) {
  const travel = fill * MOON_SIZE
  const shadowOffsetX = travel * Math.cos(SHADOW_ANGLE_RAD)
  const shadowOffsetY = travel * Math.sin(SHADOW_ANGLE_RAD)
  const terminatorBlur = getTerminatorBlur(fill)
  const litOpacity = getLitOpacity(fill)
  const idleGlowOpacity = fill < 0.1 ? 0.55 * (1 - fill / 0.1) : 0

  return (
    <div className="flex size-[208.507px] items-center justify-center">
      <div
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{
          width: MOON_SIZE,
          height: MOON_SIZE,
          boxShadow:
            'inset 0 0 24px rgba(0,0,0,0.55), 0 18px 40px rgba(0,0,0,0.35)',
          background: 'rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            opacity: litOpacity,
            background: 'linear-gradient(180deg, #FFB347 0%, #FB923C 45%, #EF4444 100%)',
            boxShadow: 'inset 0 0 20px rgba(255, 180, 80, 0.35)',
          }}
        />

        <div
          className="absolute rounded-full"
          style={{
            width: MOON_SIZE,
            height: MOON_SIZE,
            left: shadowOffsetX,
            top: shadowOffsetY,
            background:
              'radial-gradient(circle at 40% 40%, #2a2220 0%, #14110f 70%, #0a0908 100%)',
            filter: `blur(${terminatorBlur}px)`,
            opacity: fill >= 0.99 ? 0 : 1,
            transition: 'opacity 200ms ease-out',
            willChange: 'left, top',
          }}
        />

        {idleGlowOpacity > 0 && (
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              opacity: idleGlowOpacity,
              background:
                'radial-gradient(ellipse 36% 30% at 22% 80%, rgba(255, 150, 70, 0.5) 0%, transparent 100%)',
            }}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        />
      </div>
    </div>
  )
}

function SleepPill({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center rounded-[24px] border-[0.5px] border-solid px-[10px] py-2 text-[14px] leading-5 text-white"
      style={
        selected
          ? {
              backgroundImage: SLEEP_PILL_GRADIENT,
              borderColor: '#d0d0d0',
            }
          : {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }
      }
    >
      {label}
    </button>
  )
}

/** Figma 5629:14731 — sleep duration moon-phase meter */
export function SleepDurationMeter({
  selected,
  onSelect,
}: {
  selected: SleepDurationOption | null
  onSelect: (value: SleepDurationOption) => void
}) {
  const targetFill = SLEEP_MOON_FILL[selected ?? 'unselected']
  const fill = useAnimatedFill(targetFill)

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <SleepMoon fill={fill} />

      <div className="grid w-full grid-cols-3 gap-4">
        {SLEEP_DURATION_OPTIONS.map((option) => (
          <SleepPill
            key={option.id}
            label={option.label}
            selected={selected === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  )
}
