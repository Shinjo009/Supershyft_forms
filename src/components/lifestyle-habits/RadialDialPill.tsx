import { MCQ_PILL_BORDER_IDLE, MCQ_PILL_BORDER_SELECTED } from '../mcq/mcqLayout'
import { DIAL_PILL_GRADIENT } from './radialDialShared'

export function RadialDialPill({
  label,
  labelLines,
  selected,
  className = '',
  anchor,
  onClick,
}: {
  label: string
  labelLines?: string[]
  selected: boolean
  className?: string
  anchor?: { left: number; top: number } | null
  onClick: () => void
}) {
  const positionedByAnchor = anchor !== null && anchor !== undefined
  const isMultiline = Boolean(labelLines?.length)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute flex items-center justify-center rounded-full border border-solid px-3 text-[11px] font-medium text-white ${
        isMultiline ? 'h-auto min-h-[40px] py-1 leading-[12px]' : 'h-[33px] whitespace-nowrap'
      } ${positionedByAnchor ? '-translate-x-1/2 -translate-y-1/2' : ''} ${className}`}
      style={{
        ...(positionedByAnchor
          ? { left: anchor.left, top: anchor.top }
          : undefined),
        ...(selected
          ? {
              backgroundImage: DIAL_PILL_GRADIENT,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderColor: MCQ_PILL_BORDER_IDLE,
            }),
      }}
    >
      {isMultiline ? (
        <span className="flex flex-col items-center text-center">
          {labelLines!.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      ) : (
        label
      )}
    </button>
  )
}
