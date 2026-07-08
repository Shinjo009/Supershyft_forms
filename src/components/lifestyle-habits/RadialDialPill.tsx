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
      className={`absolute flex h-[33px] items-center justify-center rounded-full px-3 text-[11px] font-medium text-white whitespace-nowrap ${className}`}
      style={
        selected
          ? {
              backgroundImage: DIAL_PILL_GRADIENT,
              border: 'none',
              boxShadow: 'inset 0 0 0 0.25px #D0D0D0',
            }
          : {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              boxShadow: 'inset 0 0 0 0.25px rgba(255, 255, 255, 0.3)',
            }
      }
    >
      {label}
    </button>
  )
}
