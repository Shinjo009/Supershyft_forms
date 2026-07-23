import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
} from '../../api/questionnaire'
import tickCircleIcon from '../../assets/family-history/tick-circle-outline.svg'
import { MCQ_PILL_BORDER_IDLE, MCQ_PILL_BORDER_SELECTED } from '../mcq/mcqLayout'
import {
  ALCOHOL_PILL_GRADIENT_FULL,
  ALCOHOL_PILL_GRADIENT_HALF,
} from './alcoholConsumptionConfig'

function DesignedPill({
  label,
  selected,
  fullWidth,
  showTick,
  onClick,
}: {
  label: string
  selected: boolean
  fullWidth: boolean
  showTick?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2.5 rounded-[24px] border border-solid px-[10px] text-center text-[12px] leading-6 text-white ${
        fullWidth ? 'w-full' : 'min-w-0 flex-1'
      } ${selected ? 'py-1 font-semibold' : 'py-2 font-normal'}`}
      style={
        selected
          ? {
              backgroundImage: fullWidth
                ? ALCOHOL_PILL_GRADIENT_FULL
                : ALCOHOL_PILL_GRADIENT_HALF,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              borderColor: MCQ_PILL_BORDER_IDLE,
            }
      }
    >
      {showTick && selected ? (
        <img src={tickCircleIcon} alt="" className="size-3 shrink-0" aria-hidden />
      ) : null}
      {label}
    </button>
  )
}

function chunkRows<T>(items: T[], pairSize = 2): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += pairSize) {
    rows.push(items.slice(i, i + pairSize))
  }
  return rows
}

/** Normalize API options into selectable pills (value + label). */
export function toApiPillItems(options: QuestionnaireOption[]): { value: string; label: string }[] {
  const items: { value: string; label: string }[] = []
  const seen = new Set<string>()

  for (const option of options) {
    const value = getOptionValue(option)
    const label = getOptionLabel(option) || value
    if (!value && !label) continue
    const key = value || label
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ value: value || label, label })
  }

  return items
}

/**
 * Designed lifestyle pill grid driven entirely by backend options.
 * - pairs: 2-col grid, trailing single is full-width (smoking / wellness)
 * - stack: full-width rows (commitment)
 * - alcohol: designed pattern — first full, then pairs, last full when odd
 */
export function LifestyleApiPillGrid({
  options,
  selectedValue,
  onSelect,
  layout = 'pairs',
  showTick = false,
}: {
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  layout?: 'pairs' | 'stack' | 'alcohol'
  showTick?: boolean
}) {
  const items = toApiPillItems(options)
  const rows =
    layout === 'stack'
      ? items.map((item) => [item])
      : layout === 'alcohol'
        ? alcoholStyleRows(items)
        : chunkRows(items, 2)

  return (
    <div className="flex w-full flex-col gap-4">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex w-full ${row.length > 1 ? 'gap-4' : ''}`}
        >
          {row.map((item) => (
            <DesignedPill
              key={item.value}
              label={item.label}
              selected={selectedValue === item.value}
              fullWidth={row.length === 1}
              showTick={showTick}
              onClick={() => onSelect(item.value)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Figma alcohol row rhythm adapted to any option count. */
function alcoholStyleRows<T>(items: T[]): T[][] {
  if (items.length <= 1) return items.length ? [items] : []
  const rows: T[][] = []
  rows.push([items[0]])
  let index = 1
  while (index < items.length) {
    const remaining = items.length - index
    if (remaining === 1) {
      rows.push([items[index]])
      break
    }
    if (remaining === 3) {
      rows.push([items[index], items[index + 1]])
      rows.push([items[index + 2]])
      break
    }
    rows.push([items[index], items[index + 1]])
    index += 2
  }
  return rows
}
