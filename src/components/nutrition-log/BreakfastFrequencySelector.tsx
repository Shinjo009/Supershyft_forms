import {
  BREAKFAST_FREQUENCY_OPTIONS,
  type BreakfastFrequencyOption,
} from '../../data/nutritionLogQuestions'
import { BREAKFAST_FREQUENCY_METER } from './breakfastFrequencyConfig'
import { NutritionCircularMeter } from './NutritionCircularMeter'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'

const EMPTY_METER = { value: 0, fillRatio: 0, unit: 'DAYS/WEEK' }

function meterForSelection(selected: BreakfastFrequencyOption | null) {
  if (selected === null) {
    return EMPTY_METER
  }
  return BREAKFAST_FREQUENCY_METER[selected]
}

/** Figma 5646:36035 — breakfast frequency ring + pills */
export function BreakfastFrequencySelector({
  selected,
  onSelect,
}: {
  selected: BreakfastFrequencyOption | null
  onSelect: (value: BreakfastFrequencyOption) => void
}) {
  const meter = meterForSelection(selected)

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <NutritionCircularMeter
        meterId="breakfast-frequency"
        value={meter.value}
        fillRatio={meter.fillRatio}
        unitLabel={meter.unit}
      />

      <div className="flex flex-wrap content-center justify-center gap-4">
        {BREAKFAST_FREQUENCY_OPTIONS.map((option) => (
          <NutritionFrequencyPill
            key={option.id}
            label={option.label}
            fullWidth={option.fullWidth}
            selected={selected === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  )
}
