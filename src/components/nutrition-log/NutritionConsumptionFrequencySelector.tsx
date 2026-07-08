import type { MeterReading } from './consumptionFrequencyConfig'
import { NutritionCircularMeter } from './NutritionCircularMeter'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'

/** Shared ring + grid pills for consumption frequency questions */
export function NutritionConsumptionFrequencySelector<T extends string>({
  meterId,
  options,
  meter,
  selected,
  onSelect,
}: {
  meterId: string
  options: { id: T; label: string }[]
  meter: Record<T, MeterReading>
  selected: T | null
  onSelect: (value: T) => void
}) {
  const reading = selected === null ? { value: 0, fillRatio: 0, unit: 'TIMES/MONTH' } : meter[selected]

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <NutritionCircularMeter
        meterId={meterId}
        value={reading.value}
        fillRatio={reading.fillRatio}
        unitLabel={reading.unit}
      />

      <div className="grid w-full grid-cols-2 gap-4">
        {options.map((option) => (
          <NutritionFrequencyPill
            key={option.id}
            label={option.label}
            compact
            selected={selected === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  )
}
