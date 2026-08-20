import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { SleepDurationMeter } from './SleepDurationMeter'
import { abbreviateDialLabel, collectApiDialOptions } from './fitApiOptionsToDial'
import { SLEEP_MOON_FILL } from './sleepDurationConfig'
import { McqQuestionCopy } from '../mcq/McqQuestionCopy'

function matchSleepHours(text: string): number | null {
  const normalized = text.toLowerCase()
  if (
    normalized.includes('9+') ||
    normalized.includes('9 plus') ||
    normalized.includes('more than 9') ||
    normalized.includes('over 9')
  ) {
    return 9
  }
  if (
    normalized.includes('<5') ||
    normalized.includes('< 5') ||
    normalized.includes('under 5') ||
    normalized.includes('less than 5')
  ) {
    return 4
  }
  const match = normalized.match(/(^|[^0-9])([5-8])(\s*hrs?)?([^0-9]|$)/)
  if (match) return Number(match[2])
  return null
}

function sleepDisplayLabel(label: string, hours: number | null): string {
  const abbreviated = abbreviateDialLabel(label)
  const short = abbreviated.pill

  // Prefer abbreviated ranges / comparators from long API copy.
  if (/[<>+\-]/.test(short)) {
    return short.replace(/\bh\b/g, 'hrs').replace(/\bm\b/g, 'hrs')
  }

  if (hours === 4) return '<5 hrs'
  if (hours === 9) return '9+ hrs'
  if (hours !== null && hours >= 5 && hours <= 8) return `${hours} hrs`

  return short
}

/** Designed Lifestyle Q6 — sleep meter fitted with all API options. */
export function LifestyleSleepDurationQuestion({
  questionLabel,
  questionText,
  subText,
  options,
  selectedValue,
  onSelect,
  onInfoClick,
}: {
  questionLabel: string
  questionText: string
  subText?: string | null
  options: QuestionnaireOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onInfoClick?: () => void
}) {
  const { items, fillById } = useMemo(() => {
    const apiOptions = collectApiDialOptions(options)
    const n = Math.max(apiOptions.length, 1)
    const fillKeys = Object.keys(SLEEP_MOON_FILL).filter((key) => key !== 'unselected')

    const ranked = apiOptions.map((option, index) => ({
      option,
      index,
      hours: matchSleepHours(`${option.value} ${option.label}`),
    }))
    const hasHours = ranked.some((entry) => entry.hours !== null)
    const ordered = hasHours
      ? [...ranked].sort((a, b) => (a.hours ?? 100 + a.index) - (b.hours ?? 100 + b.index))
      : ranked

    const nextFillById: Record<string, number> = {}
    const nextItems = ordered.map((entry, orderIndex) => {
      const fillKey = fillKeys[Math.min(orderIndex, fillKeys.length - 1)]
      const fill =
        entry.hours !== null
          ? SLEEP_MOON_FILL[
              entry.hours >= 9
                ? '9-plus'
                : entry.hours <= 4
                  ? 'under-5'
                  : (String(entry.hours) as keyof typeof SLEEP_MOON_FILL)
            ] ?? SLEEP_MOON_FILL[fillKey as keyof typeof SLEEP_MOON_FILL]
          : SLEEP_MOON_FILL[fillKey as keyof typeof SLEEP_MOON_FILL] ??
            (orderIndex + 1) / n

      nextFillById[entry.option.value] = fill
      return {
        id: entry.option.value,
        label: sleepDisplayLabel(entry.option.label, entry.hours),
      }
    })

    return { items: nextItems, fillById: nextFillById }
  }, [options])

  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <McqQuestionCopy text={questionText} subText={subText} />
      </LifestyleHabitsQuestionHeader>

      <SleepDurationMeter
        selected={selectedValue}
        items={items}
        fillById={fillById}
        onSelect={onSelect}
      />
    </div>
  )
}
