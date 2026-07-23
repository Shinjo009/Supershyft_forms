import {
  LIFESTYLE_COMMITMENT_OPTIONS,
  type LifestyleCommitmentOption,
} from '../../data/lifestyleHabitsQuestions'
import { MCQ_PILL_BORDER_IDLE, MCQ_PILL_BORDER_SELECTED } from '../mcq/mcqLayout'
import { ALCOHOL_PILL_GRADIENT_FULL } from './alcoholConsumptionConfig'

function CommitmentPill({
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
      className={`flex w-full items-center justify-center rounded-[24px] border border-solid px-[10px] text-center text-[12px] leading-6 text-white ${
        selected ? 'py-1 font-semibold' : 'py-2 font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: ALCOHOL_PILL_GRADIENT_FULL,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              borderColor: MCQ_PILL_BORDER_IDLE,
            }
      }
    >
      {label}
    </button>
  )
}

/** Figma 5657:51084 — lifestyle commitment pills */
export function LifestyleCommitmentOptions({
  selected,
  onSelect,
  items,
}: {
  selected: LifestyleCommitmentOption | null
  onSelect: (value: LifestyleCommitmentOption) => void
  /** When provided, only these options are shown (with given labels). */
  items?: { id: LifestyleCommitmentOption; label: string }[]
}) {
  const pills = items ?? LIFESTYLE_COMMITMENT_OPTIONS

  return (
    <div className="flex w-full flex-col gap-4">
      {pills.map((option) => (
        <CommitmentPill
          key={option.id}
          label={option.label}
          selected={selected === option.id}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  )
}
