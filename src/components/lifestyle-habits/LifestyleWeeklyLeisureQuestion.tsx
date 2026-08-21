import { useMemo } from 'react'
import type { QuestionnaireOption } from '../../api/questionnaire'
import { LifestyleHabitsQuestionHeader } from './LifestyleHabitsQuestionHeader'
import { LifestyleApiPillGrid } from './LifestyleApiPillGrid'
import { RadialDialSelector } from './RadialDialSelector'
import {
  collectApiDialOptions,
  fitApiOptionsToFixedDial,
  fitApiOptionsToRotatedDial,
} from './fitApiOptionsToDial'
import { DAILY_WALKING_SLOT_ARCS } from './dailyWalkingDialConfig'
import { PHYSICAL_ACTIVITY_BASE_ARC } from './physicalActivityDialConfig'
import { WEEKLY_LEISURE_FIVE_PILL_ORBIT } from './weeklyLeisureDialConfig'

const LEISURE_MATCHERS_4 = [
  {
    slot: 'left',
    match: (text: string) =>
      text.includes('rare') || text.includes('never') || text.includes('seldom'),
  },
  {
    slot: 'top',
    match: (text: string) =>
      text.includes('< 1') ||
      text.includes('<1') ||
      text.includes('under 1') ||
      text.includes('less than 1'),
  },
  {
    slot: 'right',
    match: (text: string) =>
      text.includes('1-3') ||
      text.includes('1 – 3') ||
      text.includes('1 to 3') ||
      text.includes('1–3'),
  },
  {
    slot: 'bottom',
    match: (text: string) =>
      text.includes('4-8') ||
      text.includes('4 to 8') ||
      text.includes('4–8') ||
      text.includes('more than 8') ||
      text.includes('8+') ||
      text.includes('over 8'),
  },
]

/** Same 5 seats / needle animation as daily walking dial. */
const LEISURE_MATCHERS_5 = [
  {
    slot: 'top',
    match: (text: string) =>
      text.includes('rare') || text.includes('never') || text.includes('seldom'),
  },
  {
    slot: 'right',
    match: (text: string) =>
      text.includes('< 1') ||
      text.includes('<1') ||
      text.includes('under 1') ||
      text.includes('less than 1'),
  },
  {
    slot: 'bottom-right',
    match: (text: string) =>
      text.includes('1-3') ||
      text.includes('1 – 3') ||
      text.includes('1 to 3') ||
      text.includes('1–3'),
  },
  {
    slot: 'bottom-left',
    match: (text: string) =>
      (text.includes('4-8') || text.includes('4 to 8') || text.includes('4–8')) &&
      !text.includes('more than 8') &&
      !text.includes('over 8') &&
      !text.includes('8+'),
  },
  {
    slot: 'left',
    match: (text: string) =>
      text.includes('more than 8') || text.includes('8+') || text.includes('over 8'),
  },
]

/** Designed Lifestyle Q3 — weekly leisure dial fitted with all API options. */
export function LifestyleWeeklyLeisureQuestion({
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
  const { config, centerLabels, overflow } = useMemo(() => {
    const count = collectApiDialOptions(options).length

    // 5+ options: fixed seats like daily walking (needle sweeps; orange arc seats).
    // 4 options: rotated arc like physical activity.
    if (count >= 5) {
      return fitApiOptionsToFixedDial(
        {
          idPrefix: 'weekly-leisure',
          width: 300,
          height: 270,
          dialOffsetX: 63,
          dialOffsetY: 44,
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
          preferredMatchers: LEISURE_MATCHERS_5,
          activeArcStrokeWidth: 4,
          arcGlowBounds: { x: 0, y: -30, width: 180, height: 90 },
          pillOrbitRadius: WEEKLY_LEISURE_FIVE_PILL_ORBIT,
        },
        options,
      )
    }

    return fitApiOptionsToRotatedDial(
      {
        idPrefix: 'weekly-leisure',
        width: 300,
        height: 270,
        dialOffsetX: 63,
        dialOffsetY: 44,
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
        preferredMatchers: LEISURE_MATCHERS_4,
      },
      options,
    )
  }, [options])

  return (
    <div className="flex w-full flex-col gap-16">
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
