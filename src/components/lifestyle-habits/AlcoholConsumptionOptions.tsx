import {
  ALCOHOL_CONSUMPTION_ROWS,
  ALCOHOL_CONSUMPTION_OPTIONS,
  type AlcoholConsumptionOption,
} from '../../data/lifestyleHabitsQuestions'
import { MCQ_PILL_BORDER_IDLE, MCQ_PILL_BORDER_SELECTED } from '../mcq/mcqLayout'
import {
  ALCOHOL_PILL_GRADIENT_FULL,
  ALCOHOL_PILL_GRADIENT_HALF,
} from './alcoholConsumptionConfig'

const OPTION_LABELS = Object.fromEntries(
  ALCOHOL_CONSUMPTION_OPTIONS.map((option) => [option.id, option.label]),
) as Record<AlcoholConsumptionOption, string>

function AlcoholPill({
  label,
  selected,
  fullWidth,
  onClick,
}: {
  label: string
  selected: boolean
  fullWidth: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center rounded-[24px] border border-solid px-[10px] py-1 text-[12px] leading-6 text-white ${
        fullWidth ? 'w-full' : 'min-w-0 flex-1'
      } ${selected ? 'font-semibold' : 'font-normal'}`}
      style={
        selected
          ? {
              backgroundImage: fullWidth
                ? ALCOHOL_PILL_GRADIENT_FULL
                : ALCOHOL_PILL_GRADIENT_HALF,
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

/** Figma 5629:14830 — alcohol consumption pill options */
export function AlcoholConsumptionOptions({
  selected,
  onSelect,
  items,
}: {
  selected: AlcoholConsumptionOption | null
  onSelect: (value: AlcoholConsumptionOption) => void
  /** When provided, filter rows to these ids and use the given labels. */
  items?: { id: AlcoholConsumptionOption; label: string }[]
}) {
  const labelById = items
    ? (Object.fromEntries(items.map((item) => [item.id, item.label])) as Partial<
        Record<AlcoholConsumptionOption, string>
      >)
    : OPTION_LABELS
  const availableIds = items
    ? new Set(items.map((item) => item.id))
    : null

  const rows = ALCOHOL_CONSUMPTION_ROWS.map((row) =>
    availableIds ? row.filter((id) => availableIds.has(id)) : row,
  ).filter((row) => row.length > 0)

  return (
    <div className="flex w-full flex-col gap-4">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex w-full ${row.length > 1 ? 'gap-4' : ''}`}
        >
          {row.map((optionId) => (
            <AlcoholPill
              key={optionId}
              label={labelById[optionId] ?? OPTION_LABELS[optionId]}
              selected={selected === optionId}
              fullWidth={row.length === 1}
              onClick={() => onSelect(optionId)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
