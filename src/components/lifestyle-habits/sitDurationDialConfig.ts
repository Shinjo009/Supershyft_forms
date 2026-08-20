import type { SitDurationOption } from '../../data/lifestyleHabitsQuestions'
import type { RadialDialArcLayout, RadialDialConfig } from './radialDialShared'

const DIAL_OFFSET_X = 51
const DIAL_OFFSET_Y = 28
const DIAL_SIZE = 174
const HUB_RADIUS = 18

const ARC_TOP_PATH =
  'M0.287292 13.3736C-0.309232 12.331 0.0512642 10.9996 1.10848 10.4293C12.9863 4.02222 26.2016 0.461477 39.7107 0.0419322C53.945 -0.400137 68.0702 2.65884 80.8463 8.95031C93.6223 15.2418 104.659 24.5734 112.986 36.1259C120.89 47.0898 126.124 59.736 128.287 73.0572C128.479 74.2429 127.644 75.3404 126.454 75.5032C125.263 75.666 124.17 74.8325 123.976 73.647C121.91 61.0312 116.945 49.0559 109.458 38.6696C101.546 27.6947 91.0618 18.8297 78.9245 12.8528C66.7872 6.87589 53.3683 3.96987 39.8457 4.38983C27.0484 4.78728 14.5286 8.152 3.26936 14.2063C2.21139 14.7751 0.883817 14.4162 0.287292 13.3736Z'

const ARC_LEFT_PATH =
  'M45.8012 140.915C45.2178 141.965 43.892 142.345 42.8569 141.736C31.2274 134.888 21.3412 125.423 13.9909 114.081C6.24586 102.13 1.55306 88.4605 0.324409 74.2724C-0.904243 60.0844 1.36883 45.8116 6.94408 32.7071C12.2353 20.2703 20.3472 9.24665 30.6264 0.501829C31.5413 -0.276525 32.9128 -0.129518 33.668 0.804579C34.4233 1.73868 34.2762 3.10602 33.3623 3.88557C23.6362 12.1819 15.9593 22.6285 10.9469 34.4101C5.65039 46.8593 3.49097 60.4185 4.65819 73.8971C5.82541 87.3758 10.2836 100.362 17.6413 111.715C24.6044 122.46 33.9629 131.431 44.9704 137.932C46.0047 138.543 46.3846 139.865 45.8012 140.915Z'

const ARC_BOTTOM_RIGHT_PATH =
  'M116.74 0C117.941 0 118.918 0.974083 118.888 2.17493C118.551 15.6664 115.078 28.9053 108.734 40.8392C102.049 53.4138 92.3793 64.1551 80.5738 72.1202C68.7684 80.0852 55.1881 85.0304 41.0253 86.5217C27.584 87.937 14.008 86.2002 1.37139 81.4622C0.246629 81.0404 -0.290994 79.7702 0.158712 78.6563C0.608418 77.5425 1.8751 77.0069 3.00041 77.4272C14.9763 81.8995 27.8366 83.5363 40.5697 82.1956C54.0245 80.7789 66.9257 76.081 78.1409 68.5142C89.3561 60.9474 98.5423 50.7432 104.893 38.7973C110.903 27.4921 114.2 14.9542 114.536 2.17488C114.568 0.974077 115.539 0 116.74 0Z'

/** Figma 5948:16002 — fixed arc positions (not rotations of one shape) */
const ARC_TOP: RadialDialArcLayout = {
  x: DIAL_SIZE * 0.2563,
  y: 0,
  w: DIAL_SIZE * (1 - 0.2563 - 0.0063),
  h: DIAL_SIZE * (1 - 0.566),
  vbW: 128.314,
  vbH: 75.5235,
  path: ARC_TOP_PATH,
}

const ARC_LEFT: RadialDialArcLayout = {
  x: 0,
  y: DIAL_SIZE * 0.1163,
  w: DIAL_SIZE * (1 - 0.7352),
  h: DIAL_SIZE * (1 - 0.1163 - 0.0675),
  vbW: 46.0755,
  vbH: 142.027,
  path: ARC_LEFT_PATH,
}

const ARC_BOTTOM_RIGHT: RadialDialArcLayout = {
  x: DIAL_SIZE * 0.3166,
  y: DIAL_SIZE * 0.5,
  w: DIAL_SIZE * (1 - 0.3166),
  h: DIAL_SIZE * 0.5,
  vbW: 118.889,
  vbH: 87,
  path: ARC_BOTTOM_RIGHT_PATH,
}

export const SIT_DURATION_SLOT_ARCS: Record<string, RadialDialArcLayout> = {
  top: ARC_TOP,
  left: ARC_LEFT,
  'bottom-right': ARC_BOTTOM_RIGHT,
}

export const SIT_DURATION_DIAL_CONFIG: RadialDialConfig<SitDurationOption> = {
  idPrefix: 'sit-duration',
  width: 281,
  height: 209,
  dialOffsetX: DIAL_OFFSET_X,
  dialOffsetY: DIAL_OFFSET_Y,
  dialSize: DIAL_SIZE,
  hubRadius: HUB_RADIUS,
  unselectedArcs: [],
  slotSelection: {
    slotArcs: SIT_DURATION_SLOT_ARCS,
    slotOrder: ['top', 'left', 'bottom-right'],
    optionSlots: {
      'under-1h': 'top',
      '4h-plus': 'left',
      '1-4h': 'bottom-right',
    },
    activeArcStrokeWidth: 4,
  },
  arcGlowBounds: { x: -40, y: -40, width: 254, height: 254 },
  rotationByOption: {
    'under-1h': 0,
    '1-4h': 106,
    '4h-plus': 244,
  },
  pills: [
    { id: 'under-1h', label: '< 1 h', className: 'left-[173px] top-0' },
    { id: '4h-plus', label: '4h+', className: 'left-0 top-[103px]' },
    { id: '1-4h', label: '1-4 h', className: 'left-[205px] top-[176px]' },
  ],
}

export const SIT_DURATION_CENTER_LABELS: Record<SitDurationOption, string> = {
  'under-1h': '< 1 hr',
  '4h-plus': '4h+',
  '1-4h': '1-4 h',
}
