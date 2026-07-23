import type { WeeklyLeisureOption } from '../../data/lifestyleHabitsQuestions'
import type { RadialDialConfig } from './radialDialShared'
import { PHYSICAL_ACTIVITY_BASE_ARC } from './physicalActivityDialConfig'

const DIAL_OFFSET_X = 51
const DIAL_OFFSET_Y = 28
const DIAL_SIZE = 174
const HUB_RADIUS = 23

/**
 * 5 slots × 72°. Figma base arc spans ~80°, so clip each copy to this sweep
 * to leave even gaps and a clean circular ring (same arc shape as Q2).
 */
export const WEEKLY_LEISURE_FIVE_ARC_CLIP_SWEEP_DEG = 58

/** Equal pill radius so options sit on one circle. */
export const WEEKLY_LEISURE_FIVE_PILL_ORBIT = 118

export const WEEKLY_LEISURE_DIAL_CONFIG: RadialDialConfig<WeeklyLeisureOption> = {
  idPrefix: 'weekly-leisure',
  width: 280,
  height: 240,
  dialOffsetX: DIAL_OFFSET_X,
  dialOffsetY: DIAL_OFFSET_Y,
  dialSize: DIAL_SIZE,
  hubRadius: HUB_RADIUS,
  unselectedArcs: [],
  slotSelection: {
    baseArc: PHYSICAL_ACTIVITY_BASE_ARC,
    slotRotations: {
      right: 0,
      top: -90,
      bottom: 90,
      left: 180,
    },
    slotOrder: ['top', 'right', 'bottom', 'left'],
    optionSlots: {
      'under-1h': 'top',
      '1-3h': 'right',
      'rarely-never': 'left',
      '4-8h': 'bottom',
    },
    activeArcStrokeWidth: 4,
  },
  arcGlowBounds: { x: 0, y: -20, width: 170, height: 120 },
  rotationByOption: {
    'under-1h': 0,
    '1-3h': 90,
    '4-8h': 180,
    'rarely-never': 270,
  },
  pills: [
    { id: 'rarely-never', label: 'Rarely or never', labelLines: ['Rarely or', 'never'] },
    { id: 'under-1h', label: 'Less than 1 hour' },
    { id: '1-3h', label: '1-3 hours' },
    { id: '4-8h', label: '4-8 hours' },
  ],
}

export const WEEKLY_LEISURE_CENTER_LABELS: Record<WeeklyLeisureOption, string> = {
  'rarely-never': 'Rare',
  'under-1h': '< 1 h',
  '1-3h': '1-3 h',
  '4-8h': '4-8 h',
}
