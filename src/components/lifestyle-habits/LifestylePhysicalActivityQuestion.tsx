import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { LifestyleApiPillGrid } from './LifestyleApiPillGrid'
import { RadialDialSelector } from './RadialDialSelector'
import { fitApiOptionsToRotatedDial } from './fitApiOptionsToDial'
import { PHYSICAL_ACTIVITY_BASE_ARC } from './physicalActivityDialConfig'
import { McqQuestionCopy } from '../mcq/McqQuestionCopy'

const ACTIVITY_MATCHERS = [
  {
    slot: 'left',
    match: (text: string) =>
      text.includes('rare') || text.includes('never') || text.includes('seldom'),
  },
  {
    slot: 'top',
    match: (text: string) =>
      text.includes('< 30') ||
      text.includes('<30') ||
      text.includes('under 30') ||
      text.includes('less than 30'),
  },
  {
    slot: 'right',
    match: (text: string) =>
      text.includes('30-60') ||
      text.includes('30 – 60') ||
      text.includes('30 to 60') ||
      text.includes('30–60'),
  },
  {
    slot: 'bottom',
    match: (text: string) =>
      text.includes('60+') ||
      text.includes('more than 60') ||
      text.includes('over 60') ||
      text.includes('60-plus'),
  },
]

/** Designed Lifestyle Q2 — physical activity dial fitted with all API options. */
export function LifestylePhysicalActivityQuestion({
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
      fitApiOptionsToRotatedDial(
        {
          idPrefix: 'physical-activity',
          width: 300,
          height: 260,
          dialOffsetX: 63,
          dialOffsetY: 40,
          dialSize: 174,
          hubRadius: 23,
          baseArc: PHYSICAL_ACTIVITY_BASE_ARC,
          activeArcStrokeWidth: 4,
          arcGlowBounds: { x: 0, y: -20, width: 170, height: 120 },
          designedSlotOrder: ['top', 'right', 'bottom', 'left'],
          designedRotations: {
            top: -90,
            right: 0,
            bottom: 90,
            left: 180,
          },
          preferredMatchers: ACTIVITY_MATCHERS,
        },
        options,
      ),
    [options],
  )

  return (
    <div className="flex w-full flex-col gap-16">
      <LifestyleHabitsQuestionHeader questionLabel={questionLabel} onInfoClick={onInfoClick}>
        <McqQuestionCopy text={questionText} subText={subText} />
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
