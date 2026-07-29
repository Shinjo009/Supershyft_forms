import tickCircleIcon from '../../assets/family-history/tick-circle-outline.svg'
import { MCQ_PILL_BORDER_IDLE, MCQ_PILL_BORDER_SELECTED } from '../mcq/mcqLayout'
import { NUTRITION_PILL_GRADIENT, NUTRITION_PILL_GRADIENT_FULL } from './nutritionLogConfig'

export type NutritionMultiSelectGridOption<T extends string> = {
  id: T
  label: string
  fullWidth?: boolean
}

function NutritionMultiSelectGridPill({
  label,
  selected,
  fullWidth,
  reserveTickSpaceForSelectedLabels,
  showFullOptionLabels,
  onClick,
}: {
  label: string
  selected: boolean
  fullWidth?: boolean
  reserveTickSpaceForSelectedLabels: boolean
  showFullOptionLabels: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full shrink-0 items-center justify-center rounded-[24px] border border-solid px-[10px] py-1 text-[12px] leading-4 text-white ${
        selected ? 'font-semibold' : 'font-normal'
      } ${reserveTickSpaceForSelectedLabels && selected ? 'pl-[30px]' : ''} ${
        showFullOptionLabels ? 'min-h-[44px]' : 'h-8'
      }`}
      style={
        selected
          ? {
              backgroundImage: fullWidth
                ? NUTRITION_PILL_GRADIENT_FULL
                : NUTRITION_PILL_GRADIENT,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              borderColor: MCQ_PILL_BORDER_IDLE,
            }
      }
    >
      {selected ? (
        <img
          src={tickCircleIcon}
          alt=""
          className="absolute left-[10px] top-1/2 size-3 -translate-y-1/2 shrink-0"
          aria-hidden
        />
      ) : null}
      <span
        className={
          showFullOptionLabels
            ? 'w-full break-words whitespace-normal text-center'
            : 'max-w-full truncate text-center'
        }
      >
        {label}
      </span>
    </button>
  )
}

/** Labels longer than this threshold are made full-width to avoid wrapping inside a half-width cell. */
const LONG_LABEL_CHARS = 22

/** Figma 5654:8693 — uniform 155×32 grid pills for multi-select nutrition questions */
export function NutritionMultiSelectGridOptions<T extends string>({
  options,
  selected,
  onToggle,
  reserveTickSpaceForSelectedLabels = false,
  showFullOptionLabels = false,
}: {
  options: NutritionMultiSelectGridOption<T>[]
  selected: T[]
  onToggle: (value: T) => void
  reserveTickSpaceForSelectedLabels?: boolean
  showFullOptionLabels?: boolean
}) {
  const orderedOptions = showFullOptionLabels
    ? (() => {
        const shorts: NutritionMultiSelectGridOption<T>[] = []
        const longs: NutritionMultiSelectGridOption<T>[] = []
        for (const option of options) {
          if (option.label.trim().length > LONG_LABEL_CHARS) longs.push(option)
          else shorts.push(option)
        }
        // Render short options first, then long options one-by-one (full width).
        return [...shorts, ...longs]
      })()
    : options

  return (
    <div className="grid w-full grid-cols-2 gap-4">
      {orderedOptions.map((option) => {
        // When showFullOptionLabels is on, long labels span the full row so they never wrap.
        const autoFullWidth =
          showFullOptionLabels && option.label.trim().length > LONG_LABEL_CHARS
        const isCruciferousOption =
          String(option.id).toLowerCase() === 'cruciferous' ||
          option.label.toLowerCase().includes('cruciferous')
        const isFullWidth = option.fullWidth || isCruciferousOption || autoFullWidth
        const effectiveShowFullOptionLabels = showFullOptionLabels || Boolean(option.fullWidth)
        const effectiveReserveTickSpaceForSelectedLabels =
          reserveTickSpaceForSelectedLabels || Boolean(option.fullWidth) || isCruciferousOption

        return (
          <div key={option.id} className={isFullWidth ? 'col-span-2' : undefined}>
            <NutritionMultiSelectGridPill
              label={option.label}
              fullWidth={isFullWidth}
              selected={selected.includes(option.id)}
              reserveTickSpaceForSelectedLabels={effectiveReserveTickSpaceForSelectedLabels}
              showFullOptionLabels={effectiveShowFullOptionLabels || isCruciferousOption}
              onClick={() => onToggle(option.id)}
            />
          </div>
        )
      })}
    </div>
  )
}
