import {
  formatWaterLiters,
  WATER_BOTTLE_BODY_HEIGHT,
} from './waterIntakeConfig'
import { useAnimatedMeterNumber } from './useAnimatedMeterNumber'

/** Figma 5627:13277 — animated water bottle fill */
export function WaterIntakeBottle({
  liters,
  fillRatio,
}: {
  liters: number
  fillRatio: number
}) {
  const animatedLiters = useAnimatedMeterNumber(liters)
  const animatedFill = useAnimatedMeterNumber(fillRatio)
  const clampedFill = Math.min(1, Math.max(0, animatedFill))
  const liquidHeight = clampedFill * WATER_BOTTLE_BODY_HEIGHT
  const showLabel = clampedFill > 0.08

  return (
    <div className="flex h-[289px] flex-1 flex-col items-center">
      <div
        className="h-[41px] w-[73px] shrink-0 rounded-[3px] border-[0.5px] border-solid border-[rgba(255,255,255,0.5)] bg-gradient-to-l from-[#d9d9d9] to-[#3e3e3e]"
        aria-hidden
      />
      <div
        className="h-[7px] w-[65px] shrink-0 border-[0.5px] border-solid border-[rgba(255,255,255,0.5)] bg-transparent"
        aria-hidden
      />
      <div className="flex min-h-0 flex-1 items-end">
        <div
          className="relative flex h-[241px] w-[135px] flex-col justify-end overflow-hidden rounded-b-[10px] rounded-t-[20px] border-[0.5px] border-solid border-[rgba(255,255,255,0.5)] bg-gradient-to-b from-[rgba(42,49,62,0.2)] to-[rgba(21,29,41,0.2)]"
          aria-hidden
        >
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-start bg-gradient-to-b from-[#59d2ff] to-[#0084ff] pt-6 drop-shadow-[0_-4px_7.5px_rgba(0,195,255,0.4)]"
            style={{ height: liquidHeight }}
          >
            <div className="absolute left-0 right-0 top-0 h-1 bg-[rgba(255,255,255,0.3)] blur-[0.5px]" />
            {showLabel ? (
              <div className="relative flex flex-col items-center gap-1">
                <span className="text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-white">
                  {formatWaterLiters(animatedLiters)}
                </span>
                <span className="text-[10px] font-bold uppercase leading-[15px] tracking-[2px] text-[rgba(255,255,255,0.8)]">
                  DAILY
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
