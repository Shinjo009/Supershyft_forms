import tickCircleIcon from '../../assets/family-history/tick-circle-outline.svg'
import {
  HEALTH_WELLNESS_PRIORITY_ROWS,
  HEALTH_WELLNESS_PRIORITY_OPTIONS,
  type HealthWellnessPriorityOption,
} from '../../data/lifestyleHabitsQuestions'
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
      className={`flex items-center justify-center gap-2.5 rounded-[24px] border border-solid px-[10px] text-center text-[12px] leading-6 text-white ${widthClass} ${
        selected ? 'py-1 font-normal' : 'py-2 font-normal'
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
      {selected ? (
        <img src={tickCircleIcon} alt="" className="size-3 shrink-0" aria-hidden />
      ) : null}
      {label}
    </button>
  )
}

/** Figma 5657:51001 — health & wellness priorities (single-select) */
export function HealthWellnessPrioritiesOptions({
  selected,
  onSelect,
}: {
  selected: HealthWellnessPriorityOption | null
  onSelect: (value: HealthWellnessPriorityOption) => void
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      {HEALTH_WELLNESS_PRIORITY_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex w-full ${row.options.length > 1 ? 'gap-4' : ''}`}
        >
          {row.options.map((optionId) => (
            <WellnessPill
              key={optionId}
              label={OPTION_LABELS[optionId]}
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
