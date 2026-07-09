import {
  ILLNESS_FREQUENCY_OPTIONS,
  type IllnessFrequencyOption,
} from '../../data/nutritionLogQuestions'
import {
  ILLNESS_FREQUENCY_GRID_ROWS,
  ILLNESS_FREQUENCY_METER,
} from './illnessFrequencyConfig'
import { NutritionCircularMeter } from './NutritionCircularMeter'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'
import { meterReadingForSelection } from './consumptionFrequencyConfig'

/** Figma 5627:13346 — illness frequency ring + grid pills */
export function IllnessFrequencySelector({
  selected,
  onSelect,
}: {
  selected: IllnessFrequencyOption | null
  onSelect: (value: IllnessFrequencyOption) => void
}) {
  const reading = meterReadingForSelection(selected, ILLNESS_FREQUENCY_METER)
  const optionsById = Object.fromEntries(
    ILLNESS_FREQUENCY_OPTIONS.map((option) => [option.id, option]),
  ) as Record<IllnessFrequencyOption, { id: IllnessFrequencyOption; label: string }>

  return (
    <div className="flex w-full flex-col items-center gap-[14px]">
      <NutritionCircularMeter
        meterId="illness-frequency"
        value={reading.value}
        fillRatio={reading.fillRatio}
        unitLabel={reading.unit}
      />

      <div className="grid w-full grid-cols-2 gap-4">
        {ILLNESS_FREQUENCY_GRID_ROWS.flatMap((row) =>
          row.map((optionId) => {
            const option = optionsById[optionId]
            return (
              <NutritionFrequencyPill
                key={optionId}
                label={option.label}
                compact
                selected={selected === optionId}
                onClick={() => onSelect(optionId)}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
