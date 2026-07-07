import type { PhysicalActivityOption } from '../../data/lifestyleHabitsQuestions'
import { RadialDialSelector } from './RadialDialSelector'
import {
  PHYSICAL_ACTIVITY_CENTER_LABELS,
  PHYSICAL_ACTIVITY_DIAL_CONFIG,
} from './physicalActivityDialConfig'

/** Figma 5629:14346 — physical activity radial dial */
export function PhysicalActivityDial({
  selected,
  onSelect,
}: {
  selected: PhysicalActivityOption | null
  onSelect: (value: PhysicalActivityOption) => void
}) {
  return (
    <RadialDialSelector
      config={PHYSICAL_ACTIVITY_DIAL_CONFIG}
      selected={selected}
      onSelect={onSelect}
      centerLabelByOption={PHYSICAL_ACTIVITY_CENTER_LABELS}
    />
  )
}
