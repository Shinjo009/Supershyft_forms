import {
  MCQ_PILL_BORDER_IDLE,
  MCQ_PILL_BORDER_SELECTED,
  MCQ_PILL_OUTLINE_GLOW,
} from '../mcq/mcqLayout'
import { NUTRITION_PILL_GRADIENT } from './nutritionLogConfig'

export function NutritionFrequencyPill({
  label,
  selected,
  fullWidth,
  compact,
  equal,
  className = '',
  onClick,
}: {
  label: string
  selected: boolean
  fullWidth?: boolean
  compact?: boolean
  /** Same fixed box for every option, including longer labels. */
  equal?: boolean
  className?: string
  onClick: () => void
}) {
  const heightClass = equal ? 'h-11 overflow-hidden py-1' : compact ? 'min-h-[38px] py-1' : 'h-8 py-1'
  const widthClass = equal || fullWidth ? 'w-full' : compact ? 'w-full' : 'w-[154px] lg:w-[calc(50%-8px)]'
  const labelClass = equal ? 'leading-4' : 'leading-6'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center rounded-[24px] border border-solid px-[10px] text-center text-[12px] text-white ${heightClass} ${widthClass} ${labelClass} ${className} ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              // Keep one consistent selected glow across nutrition options.
              backgroundImage: NUTRITION_PILL_GRADIENT,
              borderColor: MCQ_PILL_BORDER_SELECTED,
              boxShadow: MCQ_PILL_OUTLINE_GLOW.nutrition,
            }
          : {
              borderColor: MCQ_PILL_BORDER_IDLE,
            }
      }
    >
      {equal ? <span className="line-clamp-2 w-full">{label}</span> : label}
    </button>
  )
}
