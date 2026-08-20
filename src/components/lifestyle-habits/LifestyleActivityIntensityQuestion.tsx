import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { ActivityIntensityMeter } from './ActivityIntensityMeter'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { collectApiDialOptions } from './fitApiOptionsToDial'
import { McqQuestionCopy } from '../mcq/McqQuestionCopy'

const TOTAL_BARS = 15

function matchIntensityRank(text: string): number | null {
  const normalized = text.toLowerCase()
  if (normalized.includes('high') || normalized.includes('vigorous') || normalized.includes('intense')) {
    return 2
  }
  if (normalized.includes('moderate') || normalized.includes('medium')) {
    return 1
  }
  if (normalized.includes('low') || normalized.includes('light') || normalized.includes('easy')) {
    return 0
  }
  return null
}

/** Designed Lifestyle Q4 — intensity meter fitted with all API options. */
export function LifestyleActivityIntensityQuestion({
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
  const items = useMemo(() => {
    const apiOptions = collectApiDialOptions(options)
    const n = Math.max(apiOptions.length, 1)

    // Prefer semantic ranking when labels match; otherwise keep API order.
    const ranked = apiOptions.map((option, index) => ({
      option,
      index,
      rank: matchIntensityRank(`${option.value} ${option.label}`),
    }))
    const hasRanks = ranked.some((entry) => entry.rank !== null)
    const ordered = hasRanks
      ? [...ranked].sort((a, b) => (a.rank ?? a.index) - (b.rank ?? b.index))
      : ranked

    return ordered.map((entry, orderIndex) => ({
      id: entry.option.value,
      label: entry.option.label,
      activeBars: Math.max(1, Math.round(((orderIndex + 1) / n) * TOTAL_BARS)),
    }))
  }, [options])

  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <McqQuestionCopy text={questionText} subText={subText} />
      </LifestyleHabitsQuestionHeader>

      <ActivityIntensityMeter
        selected={selectedValue}
        items={items}
        onSelect={onSelect}
      />
    </div>
  )
}
