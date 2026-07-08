import {
  LIFESTYLE_COMMITMENT_OPTIONS,
  type LifestyleCommitmentOption,
} from '../../data/lifestyleHabitsQuestions'
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
      className={`flex w-full items-center justify-center rounded-[24px] border-[0.5px] border-solid px-[10px] text-center text-[12px] leading-6 text-white ${
        selected ? 'py-1 font-semibold' : 'py-2 font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: ALCOHOL_PILL_GRADIENT_FULL,
              borderColor: '#d0d0d0',
            }
          : {
              borderColor: 'rgba(255, 255, 255, 0.3)',
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
}: {
  selected: LifestyleCommitmentOption | null
  onSelect: (value: LifestyleCommitmentOption) => void
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      {LIFESTYLE_COMMITMENT_OPTIONS.map((option) => (
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
