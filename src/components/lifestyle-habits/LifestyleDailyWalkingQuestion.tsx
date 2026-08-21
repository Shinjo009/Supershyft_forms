import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { LifestyleApiPillGrid } from './LifestyleApiPillGrid'
import { RadialDialSelector } from './RadialDialSelector'
import { fitApiOptionsToFixedDial } from './fitApiOptionsToDial'
import { DAILY_WALKING_SLOT_ARCS } from './dailyWalkingDialConfig'

const WALKING_MATCHERS = [
  {
    slot: 'top',
    match: (text: string) =>
      text.includes('< 15') ||
      text.includes('<15') ||
      text.includes('under 15') ||
      text.includes('less than 15'),
  },
  {
    slot: 'right',
    match: (text: string) =>
      text.includes('15-30') ||
      text.includes('15 to 30') ||
      text.includes('between 15-30') ||
      text.includes('between 15 to 30'),
  },
  {
    slot: 'bottom-right',
    match: (text: string) =>
      text.includes('30-60') ||
      text.includes('30 to 60') ||
      text.includes('between 30-60') ||
      text.includes('between 30 to 60'),
  },
  {
    slot: 'bottom-left',
    match: (text: string) =>
      text.includes('1-2') ||
      text.includes('1 to 2') ||
      text.includes('between 1-2') ||
      text.includes('between 1 to 2'),
  },
  {
    slot: 'left',
    match: (text: string) =>
      text.includes('2h+') ||
      text.includes('more than 2') ||
      text.includes('over 2') ||
      text.includes('2h-plus'),
  },
]

/** Designed Lifestyle Q5 — daily walking dial fitted with all API options. */
export function LifestyleDailyWalkingQuestion({
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
  const { config, centerLabels, overflow } = useMemo(
    () =>
      fitApiOptionsToFixedDial(
        {
          idPrefix: 'daily-walking',
          width: 300,
          height: 250,
          dialOffsetX: 63,
          dialOffsetY: 40,
          dialSize: 174,
          hubRadius: 23,
          slotArcs: DAILY_WALKING_SLOT_ARCS,
          slotOrder: ['top', 'right', 'bottom-right', 'bottom-left', 'left'],
          rotationBySlot: {
            top: 0,
            right: 75,
            'bottom-right': 147,
            'bottom-left': 220,
            left: 292,
          },
          preferredMatchers: WALKING_MATCHERS,
          activeArcStrokeWidth: 4,
          arcGlowBounds: { x: 0, y: -30, width: 180, height: 90 },
        },
        options,
      ),
    [options],
  )

  return (
    <div className="flex w-full flex-col gap-8">
      <LifestyleHabitsQuestionHeader
        questionLabel={questionLabel}
        onInfoClick={onInfoClick}
        subText={subText}
      >
        <p>{questionText}</p>
      </LifestyleHabitsQuestionHeader>

      <div className="overflow-visible">
        <RadialDialSelector
          config={config}
          selected={selectedValue}
          onSelect={onSelect}
          centerLabelByOption={centerLabels}
        />
      </div>

      {overflow.length > 0 ? (
        <LifestyleApiPillGrid
          options={overflow.map((item) => ({
            option_value: item.value,
            display_name: item.label,
          }))}
          selectedValue={selectedValue}
          onSelect={onSelect}
          layout="pairs"
        />
      ) : null}
    </div>
  )
}
