import type { WeeklyLeisureOption } from '../../data/lifestyleHabitsQuestions'
import type { RadialDialArcLayout, RadialDialConfig } from './radialDialShared'

const DIAL_OFFSET_X = 51
const DIAL_OFFSET_Y = 28
const DIAL_SIZE = 174
const DIAL_CENTER = DIAL_SIZE / 2
const HUB_RADIUS = 23

/** Single arc segment — all four slots are rotations of this path (same as Q2) */
const BASE_ARC_PATH =
  'M24.4188 0.278304C25.4664 -0.309433 26.7948 0.0622913 27.3562 1.12426C36.9442 19.262 39.8244 40.2307 35.4426 60.321C31.0608 80.4114 19.7109 98.2765 3.44107 110.774C2.48846 111.506 1.12595 111.291 0.418216 110.32C-0.28952 109.35 -0.074319 107.991 0.87732 107.258C16.2875 95.3885 27.0376 78.4444 31.1925 59.3941C35.3475 40.3437 32.6292 20.4621 23.5612 3.25339C23.0012 2.19068 23.3712 0.866042 24.4188 0.278304Z'

const BASE_ARC: RadialDialArcLayout = {
  x: 136.555,
  y: 45.223,
  w: 37.445,
  h: 111.203,
  vbW: 37.441,
  vbH: 111.21,
  path: BASE_ARC_PATH,
}

function pointerReachFromCenter(arc: RadialDialArcLayout, dialCenter: number): number {
  const innerEdgeX = arc.x + arc.w * 0.5
  return innerEdgeX - dialCenter
}

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
    baseArc: BASE_ARC,
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
    pointerReachFromCenter: pointerReachFromCenter(BASE_ARC, DIAL_CENTER),
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
    { id: 'rarely-never', label: 'Rarely or never', className: 'left-[-32px] top-[60px]' },
    { id: 'under-1h', label: 'Less than 1 hour', className: 'left-[173px] top-0' },
    { id: '1-3h', label: '1-3 hours', className: 'left-[225px] top-[135px]' },
    { id: '4-8h', label: '4-8 hours', className: 'left-[55px] top-[208px]' },
  ],
}

export const WEEKLY_LEISURE_CENTER_LABELS: Record<WeeklyLeisureOption, string> = {
  'rarely-never': 'Rare',
  'under-1h': '< 1 h',
  '1-3h': '1-3 h',
  '4-8h': '4-8 h',
}
