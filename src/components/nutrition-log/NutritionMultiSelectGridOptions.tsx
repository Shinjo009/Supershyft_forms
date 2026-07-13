import tickCircleIcon from '../../assets/family-history/tick-circle-outline.svg'
import { NUTRITION_PILL_GRADIENT, NUTRITION_PILL_GRADIENT_FULL } from './nutritionLogConfig'

export type NutritionMultiSelectGridOption<T extends string> = {
  id: T
  label: string
  fullWidth?: boolean
}

function NutritionMultiSelectGridPill({
  label,
  selected,
  fullWidth,
  onClick,
}: {
  label: string
  selected: boolean
  fullWidth?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-8 w-full shrink-0 items-center justify-center rounded-[24px] border-[0.5px] border-solid px-[10px] py-1 text-[12px] leading-4 text-white ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: fullWidth
                ? NUTRITION_PILL_GRADIENT_FULL
                : NUTRITION_PILL_GRADIENT,
              borderColor: '#d0d0d0',
            }
          : {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }
      }
    >
      {selected ? (
        <img
          src={tickCircleIcon}
          alt=""
          className="absolute left-[10px] top-1/2 size-3 -translate-y-1/2 shrink-0"
          aria-hidden
        />
      ) : null}
      <span className="max-w-full truncate text-center">{label}</span>
    </button>
  )
}

/** Figma 5654:8693 — uniform 155×32 grid pills for multi-select nutrition questions */
export function NutritionMultiSelectGridOptions<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: NutritionMultiSelectGridOption<T>[]
  selected: T[]
  onToggle: (value: T) => void
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      {options.map((option) => (
        <div key={option.id} className={option.fullWidth ? 'col-span-2' : undefined}>
          <NutritionMultiSelectGridPill
            label={option.label}
            fullWidth={option.fullWidth}
            selected={selected.includes(option.id)}
            onClick={() => onToggle(option.id)}
          />
        </div>
      ))}
    </div>
  )
}
