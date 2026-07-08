import { DIET_TYPE_OPTIONS, type DietTypeOption } from '../../data/nutritionLogQuestions'
import { NUTRITION_PILL_GRADIENT } from './nutritionLogConfig'

function DietPill({
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
      className={`flex h-8 w-[155px] items-center justify-center rounded-[24px] border-[0.5px] border-solid px-[10px] py-1 text-[12px] leading-6 text-white ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: NUTRITION_PILL_GRADIENT,
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

/** Figma 5627:12795 — diet type pill grid */
export function DietTypeOptions({
  selected,
  onSelect,
}: {
  selected: DietTypeOption | null
  onSelect: (value: DietTypeOption) => void
}) {
  return (
    <div className="flex flex-wrap content-center gap-4">
      {DIET_TYPE_OPTIONS.map((option) => (
        <DietPill
          key={option.id}
          label={option.label}
          selected={selected === option.id}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  )
}
