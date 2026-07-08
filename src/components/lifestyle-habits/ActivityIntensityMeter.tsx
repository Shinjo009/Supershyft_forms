import { useEffect, useRef, useState } from 'react'
import {
  ACTIVITY_INTENSITY_OPTIONS,
  type ActivityIntensityOption,
} from '../../data/lifestyleHabitsQuestions'
import {
  ACTIVITY_INTENSITY_BAR_HEIGHTS,
  INTENSITY_PILL_GRADIENT,
} from './activityIntensityConfig'

function activeBarCount(selected: ActivityIntensityOption | null): number {
  if (selected === null) {
    return 0
  }
  return ACTIVITY_INTENSITY_OPTIONS.find((option) => option.id === selected)?.activeBars ?? 0
}

function useAnimatedBarCount(target: number) {
  const [count, setCount] = useState(target)
  const currentRef = useRef(target)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (frameRef.current !== undefined) {
      cancelAnimationFrame(frameRef.current)
    }

    const animate = () => {
      const delta = target - currentRef.current

      if (Math.abs(delta) < 0.05) {
        currentRef.current = target
        setCount(target)
        return
      }

      currentRef.current += delta * 0.22
      setCount(currentRef.current)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [target])

  return count
}

function IntensityPill({
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
      className={`flex min-w-0 flex-1 items-center justify-center rounded-[24px] border-[0.5px] border-solid px-[10px] py-1 text-[12px] leading-6 text-white ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: INTENSITY_PILL_GRADIENT,
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

/** Figma 5629:14531 / 5948:16023 — activity intensity pulse bars */
export function ActivityIntensityMeter({
  selected,
  onSelect,
}: {
  selected: ActivityIntensityOption | null
  onSelect: (value: ActivityIntensityOption) => void
}) {
  const targetBars = activeBarCount(selected)
  const animatedBars = useAnimatedBarCount(targetBars)

  return (
    <div className="flex w-[326px] flex-col items-center rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[33px] backdrop-blur-[5px]">
      <div className="flex h-[128px] w-[300px] items-end justify-center gap-[6px]">
        {ACTIVITY_INTENSITY_BAR_HEIGHTS.map((height, index) => {
          const isActive = index < Math.round(animatedBars)

          return (
            <div
              key={index}
              className="w-[10px] shrink-0 rounded-full transition-[background,box-shadow] duration-300 ease-out"
              style={{
                height,
                background: isActive
                  ? 'linear-gradient(to top, #ff8c00, #ffb347)'
                  : 'rgba(255, 255, 255, 0.1)',
                boxShadow: isActive ? '0 0 20px 0 rgba(255, 140, 0, 0.4)' : 'none',
                transitionDelay: `${index * 25}ms`,
              }}
            />
          )
        })}
      </div>

      <div className="mt-6 flex w-full gap-3">
        {ACTIVITY_INTENSITY_OPTIONS.map((option) => (
          <IntensityPill
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
