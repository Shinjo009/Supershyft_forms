import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { McqQuestionHeader } from '../mcq/McqQuestionHeader'
import {
  buildBreakfastMeterFromApi,
  buildConsumptionMeterFromApi,
  buildIllnessMeterFromApi,
} from './fitApiOptionsToNutrition'
import { NutritionCircularMeter } from './NutritionCircularMeter'
import { NutritionConsumptionFrequencySelector } from './NutritionConsumptionFrequencySelector'
import { NutritionFrequencyPill } from './NutritionFrequencyPill'
import { EMPTY_METER_READING } from './consumptionFrequencyConfig'

/** Designed consumption ring + 2-col pills (fruits, veg, baked goods, etc.). */
export function NutritionApiConsumptionFrequencyQuestion({
  questionLabel,
  questionText,
  meterId,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
}: {
  questionLabel: string
  questionText: string
  meterId: string
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
}) {
  const { items, meter } = useMemo(() => buildConsumptionMeterFromApi(options), [options])

  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader theme="nutrition" questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <p>{questionText}</p>
      </McqQuestionHeader>

      <NutritionConsumptionFrequencySelector
        meterId={meterId}
        options={items}
        meter={meter}
        selected={selectedValue}
        onSelect={onSelect}
      />
    </div>
  )
}

/** Designed breakfast / illness style circular meter + pills. */
export function NutritionApiCircularMeterQuestion({
  questionLabel,
  questionText,
  meterId,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
  variant = 'breakfast',
}: {
  questionLabel: string
  questionText: string
  meterId: string
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
  variant?: 'breakfast' | 'illness'
}) {
  const { items, meter } = useMemo(
    () =>
      variant === 'illness'
        ? buildIllnessMeterFromApi(options)
        : buildBreakfastMeterFromApi(options),
    [options, variant],
  )

  const reading =
    selectedValue === null ? EMPTY_METER_READING : (meter[selectedValue] ?? EMPTY_METER_READING)

  return (
    <div className="flex w-full flex-col gap-8">
      <McqQuestionHeader theme="nutrition" questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <p>{questionText}</p>
      </McqQuestionHeader>

      <div
        className={`flex w-full flex-col items-center ${
          variant === 'illness' ? 'gap-[14px]' : 'gap-6'
        }`}
      >
        <NutritionCircularMeter
          meterId={meterId}
          value={reading.value}
          fillRatio={reading.fillRatio}
          unitLabel={reading.unit}
        />

        <div
          className={
            variant === 'illness'
              ? 'grid w-full grid-cols-2 gap-4'
              : 'flex flex-wrap content-center justify-center gap-4'
          }
        >
          {items.map((item) => (
            <NutritionFrequencyPill
              key={item.id}
              label={item.label}
              compact={variant === 'illness'}
              fullWidth={variant === 'breakfast' && item.label.length > 24}
              selected={selectedValue === item.id}
              onClick={() => onSelect(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
