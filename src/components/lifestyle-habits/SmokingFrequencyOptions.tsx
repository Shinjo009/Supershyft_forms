import {
  SMOKING_FREQUENCY_OPTIONS,
  SMOKING_FREQUENCY_ROWS,
  type SmokingFrequencyOption,
} from '../../data/lifestyleHabitsQuestions'
import {
  ALCOHOL_PILL_GRADIENT_FULL,
  ALCOHOL_PILL_GRADIENT_HALF,
} from './alcoholConsumptionConfig'

const OPTION_LABELS = Object.fromEntries(
  SMOKING_FREQUENCY_OPTIONS.map((option) => [option.id, option.label]),
) as Record<SmokingFrequencyOption, string>

function SmokingPill({
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
      className={`flex items-center justify-center rounded-[24px] border-[0.5px] border-solid px-[10px] text-center text-[12px] leading-6 text-white ${
        fullWidth ? 'w-full' : 'min-w-0 flex-1'
      } ${selected ? 'py-1 font-semibold' : 'py-2 font-normal'}`}
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

/** Figma 5657:50916 — smoking frequency pill grid */
export function SmokingFrequencyOptions({
  selected,
  onSelect,
}: {
  selected: SmokingFrequencyOption | null
  onSelect: (value: SmokingFrequencyOption) => void
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      {SMOKING_FREQUENCY_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex w-full ${row.length > 1 ? 'gap-4' : ''}`}
        >
          {row.map((optionId) => (
            <SmokingPill
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
