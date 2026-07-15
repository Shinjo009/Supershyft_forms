import { MCQ_PILL_BORDER_IDLE, MCQ_PILL_BORDER_SELECTED } from '../mcq/mcqLayout'
import { DIAL_PILL_GRADIENT } from './radialDialShared'

export function RadialDialPill({
  label,
  selected,
  className,
  onClick,
}: {
  label: string
  selected: boolean
  className: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute flex h-[33px] items-center justify-center rounded-full border border-solid px-3 text-[11px] font-medium text-white whitespace-nowrap ${className}`}
      style={
        selected
          ? {
              backgroundImage: DIAL_PILL_GRADIENT,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderColor: MCQ_PILL_BORDER_IDLE,
            }
      }
    >
      {label}
    </button>
  )
}
