import { McqInfoOverlay } from '../mcq/McqInfoOverlay'
import type { McqInfoItem } from '../mcq/mcqInfoTypes'

export function FamilyHistoryInfoOverlay({
  open,
  items,
  onClose,
}: {
  open: boolean
  items: McqInfoItem[]
  onClose: () => void
}) {
  return <McqInfoOverlay open={open} items={items} theme="family" onClose={onClose} />
}
