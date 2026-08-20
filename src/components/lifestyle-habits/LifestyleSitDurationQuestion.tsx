import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { LifestyleApiPillGrid } from './LifestyleApiPillGrid'
import { RadialDialSelector } from './RadialDialSelector'
import { fitApiOptionsToFixedDial } from './fitApiOptionsToDial'
import { SIT_DURATION_SLOT_ARCS } from './sitDurationDialConfig'
import { McqQuestionCopy } from '../mcq/McqQuestionCopy'

const SIT_MATCHERS = [
  {
    slot: 'top',
    match: (text: string) =>
      text.includes('< 1') ||
      text.includes('<1') ||
      text.includes('under 1') ||
      text.includes('less than 1') ||
      text.includes('under-1'),
  },
  {
    slot: 'left',
    match: (text: string) =>
      text.includes('4h+') ||
      text.includes('4+') ||
      text.includes('more than 4') ||
      text.includes('over 4') ||
      text.includes('4h-plus'),
  },
  {
    slot: 'bottom-right',
    match: (text: string) =>
      text.includes('1-4') ||
      text.includes('1 – 4') ||
      text.includes('1 to 4') ||
      text.includes('1–4') ||
      text.includes('1 - 4'),
  },
]

/** Designed Lifestyle Q1 — sit duration dial fitted with all API options. */
export function LifestyleSitDurationQuestion({
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
          idPrefix: 'sit-duration',
          width: 300,
          height: 250,
          dialOffsetX: 63,
          dialOffsetY: 36,
          dialSize: 174,
          hubRadius: 18,
          slotArcs: SIT_DURATION_SLOT_ARCS,
          slotOrder: ['top', 'left', 'bottom-right'],
          rotationBySlot: {
            top: 0,
            'bottom-right': 106,
            left: 244,
          },
          preferredMatchers: SIT_MATCHERS,
          activeArcStrokeWidth: 4,
          arcGlowBounds: { x: -40, y: -40, width: 254, height: 254 },
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
