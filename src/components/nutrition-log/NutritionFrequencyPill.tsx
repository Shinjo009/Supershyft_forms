import { NUTRITION_PILL_GRADIENT, NUTRITION_PILL_GRADIENT_FULL } from './nutritionLogConfig'
import { NUTRITION_PILL_GRADIENT_NARROW } from './breakfastFrequencyConfig'

export function NutritionFrequencyPill({
  label,
  selected,
  fullWidth,
  compact,
  className = '',
  onClick,
}: {
  label: string
  selected: boolean
  fullWidth?: boolean
  compact?: boolean
  className?: string
  onClick: () => void
}) {
  const heightClass = compact ? 'min-h-[38px] py-1' : 'h-8 py-1'
  const widthClass = fullWidth ? 'w-full' : compact ? 'w-full' : 'w-[154px] lg:w-[calc(50%-8px)]'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center rounded-[24px] border-[0.5px] border-solid px-[10px] text-center text-[12px] leading-6 text-white ${heightClass} ${widthClass} ${className} ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: fullWidth
                ? NUTRITION_PILL_GRADIENT_FULL
                : compact
                  ? NUTRITION_PILL_GRADIENT
                  : NUTRITION_PILL_GRADIENT_NARROW,
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
