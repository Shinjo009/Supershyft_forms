import {
  ALCOHOL_CONSUMPTION_ROWS,
  ALCOHOL_CONSUMPTION_OPTIONS,
  type AlcoholConsumptionOption,
} from '../../data/lifestyleHabitsQuestions'
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
      className={`flex items-center justify-center rounded-[24px] border-[0.5px] border-solid px-[10px] py-1 text-[12px] leading-6 text-white ${
        fullWidth ? 'w-full' : 'min-w-0 flex-1'
      } ${selected ? 'font-semibold' : 'font-normal'}`}
      style={
        selected
          ? {
              backgroundImage: fullWidth
                ? ALCOHOL_PILL_GRADIENT_FULL
                : ALCOHOL_PILL_GRADIENT_HALF,
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

/** Figma 5629:14830 — alcohol consumption pill options */
export function AlcoholConsumptionOptions({
  selected,
  onSelect,
}: {
  selected: AlcoholConsumptionOption | null
  onSelect: (value: AlcoholConsumptionOption) => void
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      {ALCOHOL_CONSUMPTION_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex w-full ${row.length > 1 ? 'gap-4' : ''}`}
        >
          {row.map((optionId) => (
            <AlcoholPill
              key={optionId}
              label={OPTION_LABELS[optionId]}
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
