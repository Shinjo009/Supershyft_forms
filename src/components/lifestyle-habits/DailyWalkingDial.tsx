import type { DailyWalkingOption } from '../../data/lifestyleHabitsQuestions'
import { RadialDialSelector } from './RadialDialSelector'
import {
  DAILY_WALKING_CENTER_LABELS,
  DAILY_WALKING_DIAL_CONFIG,
} from './dailyWalkingDialConfig'

/** Figma 5629:14630 — daily walking radial dial */
export function DailyWalkingDial({
  selected,
  onSelect,
}: {
  selected: DailyWalkingOption | null
  onSelect: (value: DailyWalkingOption) => void
}) {
  return (
    <RadialDialSelector
      config={DAILY_WALKING_DIAL_CONFIG}
      selected={selected}
      onSelect={onSelect}
      centerLabelByOption={DAILY_WALKING_CENTER_LABELS}
    />
  )
}
