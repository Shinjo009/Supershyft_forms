import {
  WATER_INTAKE_OPTIONS,
  type WaterIntakeOption,
} from '../../data/nutritionLogQuestions'
import { WaterIntakeBottle } from './WaterIntakeBottle'
import { waterIntakeReadingForSelection, WATER_INTAKE_PILL_GRADIENT } from './waterIntakeConfig'

function WaterIntakePill({
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
      className={`flex h-[38px] w-[139px] items-center justify-center rounded-[24px] border-[0.5px] border-solid px-[10px] py-1 text-center text-[12px] leading-5 text-white ${
        selected ? 'min-h-[40px] font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: WATER_INTAKE_PILL_GRADIENT,
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

/** Figma 5627:13276 — water bottle + vertical intake pills */
export function WaterIntakeSelector({
  selected,
  onSelect,
}: {
  selected: WaterIntakeOption | null
  onSelect: (value: WaterIntakeOption) => void
}) {
  const reading = waterIntakeReadingForSelection(selected)

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <WaterIntakeBottle liters={reading.liters} fillRatio={reading.fillRatio} />

      <div className="flex w-[139px] shrink-0 flex-col gap-2">
        {WATER_INTAKE_OPTIONS.map((option) => (
          <WaterIntakePill
            key={option.id}
            label={option.label}
            selected={selected === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  )
}
