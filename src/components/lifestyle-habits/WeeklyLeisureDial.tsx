import type { WeeklyLeisureOption } from '../../data/lifestyleHabitsQuestions'
import { RadialDialSelector } from './RadialDialSelector'
import {
  WEEKLY_LEISURE_CENTER_LABELS,
  WEEKLY_LEISURE_DIAL_CONFIG,
} from './weeklyLeisureDialConfig'

/** Figma 5629:14444 — weekly leisure radial dial */
export function WeeklyLeisureDial({
  selected,
  onSelect,
}: {
  selected: WeeklyLeisureOption | null
  onSelect: (value: WeeklyLeisureOption) => void
}) {
  return (
    <RadialDialSelector
      config={WEEKLY_LEISURE_DIAL_CONFIG}
      selected={selected}
      onSelect={onSelect}
      centerLabelByOption={WEEKLY_LEISURE_CENTER_LABELS}
    />
  )
}
