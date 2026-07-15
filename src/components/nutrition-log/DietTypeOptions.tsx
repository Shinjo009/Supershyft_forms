import { DIET_TYPE_OPTIONS, type DietTypeOption } from '../../data/nutritionLogQuestions'
import {
  MCQ_PILL_BORDER_IDLE,
  MCQ_PILL_BORDER_SELECTED,
  MCQ_PILL_CHIP_CLASS,
} from '../mcq/mcqLayout'
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
      className={`flex h-8 ${MCQ_PILL_CHIP_CLASS} items-center justify-center rounded-[24px] border border-solid px-[10px] py-1 text-[12px] leading-6 text-white ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: NUTRITION_PILL_GRADIENT,
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
