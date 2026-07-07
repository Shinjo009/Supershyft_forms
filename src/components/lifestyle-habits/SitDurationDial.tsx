import type { SitDurationOption } from '../../data/lifestyleHabitsQuestions'
import { RadialDialSelector } from './RadialDialSelector'
import { SIT_DURATION_CENTER_LABELS, SIT_DURATION_DIAL_CONFIG } from './sitDurationDialConfig'

/** Figma 5629:14250 / 5948:16002 — sit duration radial dial */
export function SitDurationDial({
  selected,
  onSelect,
}: {
  selected: SitDurationOption | null
  onSelect: (value: SitDurationOption) => void
}) {
  return (
    <RadialDialSelector
      config={SIT_DURATION_DIAL_CONFIG}
      selected={selected}
      onSelect={onSelect}
      centerLabelByOption={SIT_DURATION_CENTER_LABELS}
    />
  )
}
