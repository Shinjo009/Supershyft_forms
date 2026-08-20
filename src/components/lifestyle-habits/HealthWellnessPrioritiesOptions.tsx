import {
  HEALTH_WELLNESS_PRIORITY_ROWS,
  HEALTH_WELLNESS_PRIORITY_OPTIONS,
  type HealthWellnessPriorityOption,
} from '../../data/lifestyleHabitsQuestions'
import tickCircleIcon from '../../assets/family-history/tick-circle-outline.svg'
import {
  ALCOHOL_PILL_GRADIENT_FULL,
  ALCOHOL_PILL_GRADIENT_HALF,
} from './alcoholConsumptionConfig'
import {
  MCQ_PILL_BORDER_IDLE,
  MCQ_PILL_BORDER_SELECTED,
  MCQ_PILL_CHIP_CLASS,
} from '../mcq/mcqLayout'

const OPTION_LABELS = Object.fromEntries(
  HEALTH_WELLNESS_PRIORITY_OPTIONS.map((option) => [option.id, option.label]),
) as Record<HealthWellnessPriorityOption, string>

function WellnessPill({
  label,
  selected,
  widthClass,
  onClick,
}: {
  label: string
  selected: boolean
  widthClass: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-[24px] border border-solid px-[10px] py-2 text-center text-[12px] leading-6 text-white ${widthClass} ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: widthClass.includes('w-full')
                ? ALCOHOL_PILL_GRADIENT_FULL
                : ALCOHOL_PILL_GRADIENT_HALF,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              borderColor: MCQ_PILL_BORDER_IDLE,
            }
      }
    >
      <img
        src={tickCircleIcon}
        alt=""
        className={`pointer-events-none absolute left-[10px] size-3 shrink-0 ${
          selected ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

/** Figma 5657:51001 — health & wellness priorities (single-select) */
export function HealthWellnessPrioritiesOptions({
  selected,
  onSelect,
  items,
}: {
  selected: HealthWellnessPriorityOption | null
  onSelect: (value: HealthWellnessPriorityOption) => void
  /** When provided, filter rows to these ids and use the given labels. */
  items?: { id: HealthWellnessPriorityOption; label: string }[]
}) {
  const labelById = items
    ? (Object.fromEntries(items.map((item) => [item.id, item.label])) as Partial<
        Record<HealthWellnessPriorityOption, string>
      >)
    : OPTION_LABELS
  const availableIds = items
    ? new Set(items.map((item) => item.id))
    : null

  const rows = HEALTH_WELLNESS_PRIORITY_ROWS.map((row) => {
    const options = availableIds
      ? row.options.filter((id) => availableIds.has(id))
      : row.options
    if (options.length === 0) return null
    const becameSingle = Boolean(availableIds) && row.options.length > 1 && options.length === 1
    return {
      options,
      fullWidth:
        options.length === 1
          ? becameSingle || row.fullWidth !== false
          : false,
    }
  }).filter((row): row is NonNullable<typeof row> => row != null)

  return (
    <div className="flex w-full flex-col gap-4">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex w-full ${row.options.length > 1 ? 'gap-4' : ''}`}
        >
          {row.options.map((optionId) => (
            <WellnessPill
              key={optionId}
              label={labelById[optionId] ?? OPTION_LABELS[optionId]}
              selected={selected === optionId}
              widthClass={
                row.options.length > 1
                  ? 'min-w-0 flex-1'
                  : row.fullWidth !== false
                    ? 'w-full'
                    : MCQ_PILL_CHIP_CLASS
              }
              onClick={() => onSelect(optionId)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
