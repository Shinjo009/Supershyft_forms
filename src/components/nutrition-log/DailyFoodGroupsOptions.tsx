import tickCircleIcon from '../../assets/family-history/tick-circle-outline.svg'
import {
  DAILY_FOOD_GROUP_OPTIONS,
  type DailyFoodGroupOption,
} from '../../data/nutritionLogQuestions'
import { NUTRITION_PILL_GRADIENT, NUTRITION_PILL_GRADIENT_FULL } from './nutritionLogConfig'

function FoodGroupPill({
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
      className={`flex h-8 items-center justify-center gap-2.5 rounded-[24px] border-[0.5px] border-solid px-[10px] py-1 text-[12px] leading-6 text-white ${
        fullWidth ? 'w-[326px]' : 'w-[155px]'
      } ${selected ? 'font-semibold' : 'font-normal'}`}
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
        <img src={tickCircleIcon} alt="" className="size-3 shrink-0" aria-hidden />
      ) : null}
      {label}
    </button>
  )
}

/** Figma 5654:8693 — daily food group multi-select pills */
export function DailyFoodGroupsOptions({
  selected,
  onToggle,
}: {
  selected: DailyFoodGroupOption[]
  onToggle: (value: DailyFoodGroupOption) => void
}) {
  return (
    <div className="flex flex-wrap content-center gap-4">
      {DAILY_FOOD_GROUP_OPTIONS.map((option) => (
        <FoodGroupPill
          key={option.id}
          label={option.label}
          fullWidth={option.fullWidth}
          selected={selected.includes(option.id)}
          onClick={() => onToggle(option.id)}
        />
      ))}
    </div>
  )
}
