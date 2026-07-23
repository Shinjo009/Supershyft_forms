import { useEffect, useRef, useState } from 'react'
import {
  ACTIVITY_INTENSITY_OPTIONS,
  type ActivityIntensityOption,
} from '../../data/lifestyleHabitsQuestions'
import { MCQ_PILL_BORDER_IDLE, MCQ_PILL_BORDER_SELECTED } from '../mcq/mcqLayout'
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
      className={`flex min-w-0 flex-1 items-center justify-center rounded-[24px] border border-solid px-[10px] py-1 text-[12px] leading-6 text-white ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: INTENSITY_PILL_GRADIENT,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              borderColor: MCQ_PILL_BORDER_IDLE,
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
  items,
}: {
  selected: string | null
  onSelect: (value: string) => void
  /** When provided, these pills drive labels + bar counts. */
  items?: { id: string; label: string; activeBars?: number }[]
}) {
  const pills =
    items && items.length > 0
      ? items
      : ACTIVITY_INTENSITY_OPTIONS.map((option) => ({
          id: option.id,
          label: option.label,
          activeBars: option.activeBars,
        }))

  const targetBars =
    selected === null
      ? 0
      : (pills.find((option) => option.id === selected)?.activeBars ??
        activeBarCount(selected as ActivityIntensityOption))
  const animatedBars = useAnimatedBarCount(targetBars)

  return (
    <div className="flex w-full flex-col items-center rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[33px] backdrop-blur-[5px]">
      <div className="flex h-[128px] w-full max-w-[300px] items-end justify-center gap-[6px] lg:max-w-[360px]">
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
        {pills.map((option) => (
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
