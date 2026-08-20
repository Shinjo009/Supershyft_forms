import {
  getOptionLabel,
  getOptionValue,
  type QuestionnaireOption,
} from '../../api/questionnaire'
import tickCircleIcon from '../../assets/family-history/tick-circle-outline.svg'
import {
  MCQ_PILL_BORDER_IDLE,
  MCQ_PILL_BORDER_SELECTED,
  MCQ_PILL_CHIP_CLASS,
} from '../mcq/mcqLayout'
import {
  ALCOHOL_PILL_GRADIENT_FULL,
  ALCOHOL_PILL_GRADIENT_HALF,
} from './alcoholConsumptionConfig'

type PillItem = { value: string; label: string }
type PillWidth = 'full' | 'flex' | 'chip'
type PillRow = { items: PillItem[]; width: PillWidth }

function DesignedPill({
  label,
  selected,
  width,
  showTick,
  onClick,
}: {
  label: string
  selected: boolean
  width: PillWidth
  showTick?: boolean
  onClick: () => void
}) {
  const widthClass =
    width === 'full' ? 'w-full' : width === 'chip' ? MCQ_PILL_CHIP_CLASS : 'min-w-0 flex-1'
  const useFullGradient = width === 'full'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-[24px] border border-solid px-[10px] py-2 text-center text-[12px] leading-6 text-white ${widthClass} ${
        selected ? 'font-semibold' : 'font-normal'
      }`}
      style={
        selected
          ? {
              backgroundImage: useFullGradient
                ? ALCOHOL_PILL_GRADIENT_FULL
                : ALCOHOL_PILL_GRADIENT_HALF,
              borderColor: MCQ_PILL_BORDER_SELECTED,
            }
          : {
              borderColor: MCQ_PILL_BORDER_IDLE,
            }
      }
    >
      {/* Absolute tick so the label stays optically centered in the pill. */}
      {showTick ? (
        <img
          src={tickCircleIcon}
          alt=""
          className={`pointer-events-none absolute left-[10px] size-3 shrink-0 ${
            selected ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        />
      ) : null}
      <span className="whitespace-nowrap">{label}</span>
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

function takeMatch(
  items: PillItem[],
  used: Set<string>,
  predicate: (text: string) => boolean,
): PillItem | undefined {
  const found = items.find((item) => {
    if (used.has(item.value)) return false
    return predicate(`${item.value} ${item.label}`.toLowerCase())
  })
  if (found) used.add(found.value)
  return found
}

function pushPair(rows: PillRow[], left?: PillItem, right?: PillItem) {
  if (left && right) rows.push({ items: [left, right], width: 'flex' })
  else if (left) rows.push({ items: [left], width: 'full' })
  else if (right) rows.push({ items: [right], width: 'full' })
}

function appendUnused(rows: PillRow[], items: PillItem[], used: Set<string>) {
  for (const item of items) {
    if (used.has(item.value)) continue
    rows.push({ items: [item], width: 'full' })
  }
}

/**
 * Figma alcohol layout:
 * full → pair → pair → full
 */
function alcoholLockedRows(items: PillItem[]): PillRow[] {
  const used = new Set<string>()
  const threeOrLess = takeMatch(
    items,
    used,
    (t) =>
      t.includes('3-or-less') ||
      (t.includes('3 servings') && t.includes('less')) ||
      t.includes('per week or less'),
  )
  const quit = takeMatch(items, used, (t) => t.includes('quit'))
  const in3Months = takeMatch(items, used, (t) => t.includes('3 month'))
  const never = takeMatch(
    items,
    used,
    (t) => t.includes('do not drink') || /(^|[^a-z])never([^a-z]|$)/.test(t),
  )
  const in6Months = takeMatch(items, used, (t) => t.includes('6 month'))
  const moreThan3 = takeMatch(
    items,
    used,
    (t) => t.includes('more-than-3') || t.includes('more than 3'),
  )

  const rows: PillRow[] = []
  if (threeOrLess) rows.push({ items: [threeOrLess], width: 'full' })
  pushPair(rows, quit, in3Months)
  pushPair(rows, never, in6Months)
  if (moreThan3) rows.push({ items: [moreThan3], width: 'full' })
  appendUnused(rows, items, used)
  return rows.length > 0 ? rows : items.map((item) => ({ items: [item], width: 'full' as const }))
}

/**
 * Figma smoking layout:
 * pair → pair → pair → full
 */
function smokingLockedRows(items: PillItem[]): PillRow[] {
  const used = new Set<string>()
  const never = takeMatch(
    items,
    used,
    (t) => t.includes('do not smoke') || /(^|[^a-z])never([^a-z]|$)/.test(t),
  )
  const quit = takeMatch(items, used, (t) => t.includes('quit'))
  const oneToThreeWeekly = takeMatch(
    items,
    used,
    (t) =>
      t.includes('1-3-weekly') ||
      t.includes('1 to 3') ||
      t.includes('1-3 times a week') ||
      /1\s*[-–to]+\s*3.*week/.test(t),
  )
  const oneToTwoMonthly = takeMatch(
    items,
    used,
    (t) =>
      t.includes('1-2-monthly') ||
      t.includes('1-2 times a month') ||
      /1\s*[-–to]+\s*2.*month/.test(t),
  )
  const fourToFiveMonthly = takeMatch(
    items,
    used,
    (t) =>
      t.includes('4-5-monthly') ||
      t.includes('4-5 times a month') ||
      /4\s*[-–to]+\s*5.*month/.test(t),
  )
  const fiveToSevenWeekly = takeMatch(
    items,
    used,
    (t) =>
      t.includes('5-7-weekly') ||
      t.includes('5 to 7') ||
      t.includes('5-7 times a week') ||
      /5\s*[-–to]+\s*7.*week/.test(t),
  )
  const moreThan7 = takeMatch(
    items,
    used,
    (t) =>
      t.includes('more-than-7') ||
      t.includes('more than 7') ||
      /more than 7.*week/.test(t),
  )

  const rows: PillRow[] = []
  pushPair(rows, never, quit)
  pushPair(rows, oneToThreeWeekly, oneToTwoMonthly)
  pushPair(rows, fourToFiveMonthly, fiveToSevenWeekly)
  if (moreThan7) rows.push({ items: [moreThan7], width: 'full' })
  appendUnused(rows, items, used)
  return rows.length > 0 ? rows : items.map((item) => ({ items: [item], width: 'full' as const }))
}

/**
 * Figma wellness layout:
 * pair → full → full → full → full
 */
function wellnessLockedRows(items: PillItem[]): PillRow[] {
  const used = new Set<string>()
  const weight = takeMatch(items, used, (t) => t.includes('weight'))
  const muscle = takeMatch(items, used, (t) => t.includes('muscle'))
  const energy = takeMatch(items, used, (t) => t.includes('energy'))
  const metabolic = takeMatch(items, used, (t) => t.includes('metabolic'))
  const endurance = takeMatch(items, used, (t) => t.includes('endurance'))
  const strength = takeMatch(items, used, (t) => t.includes('strength'))

  const rows: PillRow[] = []
  pushPair(rows, weight, muscle)
  if (energy) rows.push({ items: [energy], width: 'full' })
  if (metabolic) rows.push({ items: [metabolic], width: 'full' })
  if (endurance) rows.push({ items: [endurance], width: 'full' })
  if (strength) rows.push({ items: [strength], width: 'full' })
  appendUnused(rows, items, used)
  return rows.length > 0 ? rows : items.map((item) => ({ items: [item], width: 'full' as const }))
}

/** Normalize API options into selectable pills (value + label). */
export function toApiPillItems(options: QuestionnaireOption[]): PillItem[] {
  const items: PillItem[] = []
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

function rowsFromSimplePairs(items: PillItem[]): PillRow[] {
  return chunkRows(items, 2).map((row) => ({
    items: row,
    width: row.length === 1 ? ('full' as const) : ('flex' as const),
  }))
}

/**
 * Designed lifestyle pill grid driven entirely by backend options.
 * Alcohol / smoking / wellness use locked Figma positions.
 */
export function LifestyleApiPillGrid({
  options,
  selectedValue = null,
  selectedValues,
  onSelect,
  layout = 'pairs',
  showTick = false,
}: {
  options: QuestionnaireOption[]
  selectedValue?: string | null
  /** When provided, pills use multi-select highlighting against this list. */
  selectedValues?: string[]
  onSelect: (value: string) => void
  layout?: 'pairs' | 'stack' | 'alcohol' | 'wellness' | 'smoking'
  showTick?: boolean
}) {
  const items = toApiPillItems(options)
  const rows =
    layout === 'stack'
      ? items.map((item) => ({ items: [item], width: 'full' as const }))
      : layout === 'alcohol'
        ? alcoholLockedRows(items)
        : layout === 'wellness'
          ? wellnessLockedRows(items)
          : layout === 'smoking'
            ? smokingLockedRows(items)
            : rowsFromSimplePairs(items)

  const isSelected = (value: string) =>
    selectedValues ? selectedValues.includes(value) : selectedValue === value

  return (
    <div className="flex w-full flex-col gap-4">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex w-full ${row.items.length > 1 ? 'gap-4' : ''}`}
        >
          {row.items.map((item) => (
            <DesignedPill
              key={item.value}
              label={item.label}
              selected={isSelected(item.value)}
              width={row.items.length > 1 ? 'flex' : row.width}
              showTick={showTick}
              onClick={() => onSelect(item.value)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
