import type { DailyWalkingOption } from '../../data/lifestyleHabitsQuestions'
import type { RadialDialArcLayout, RadialDialConfig } from './radialDialShared'

const DIAL_OFFSET_X = 51
const DIAL_OFFSET_Y = 28
const DIAL_SIZE = 174
const HUB_RADIUS = 23

/** Figma 5629:14680 — top arc (grey thickness) */
const ARC_TOP_PATH =
  'M0.312192 14.3498C-0.307869 13.321 0.0223775 11.9817 1.06636 11.3875C15.5661 3.1354 32.1484 -0.781284 48.8376 0.129219C65.5269 1.03972 81.5847 6.73713 95.1006 16.5177C96.0738 17.2219 96.2563 18.5892 95.528 19.5444C94.7997 20.4997 93.4364 20.681 92.4623 19.9781C79.6406 10.7255 64.4192 5.33576 48.6007 4.47276C32.7822 3.60976 17.0648 7.31163 3.31253 15.1144C2.26776 15.7072 0.932253 15.3786 0.312192 14.3498Z'

/** Figma 5629:14679 — right arc */
const ARC_RIGHT_PATH =
  'M0.528179 0.752815C1.31221 -0.157252 2.68771 -0.261305 3.5779 0.545225C15.9416 11.747 24.8358 26.2799 29.1772 42.4203C33.5186 58.5607 33.115 75.5945 28.039 91.487C27.6735 92.6313 26.4314 93.2313 25.2966 92.8374C24.1619 92.4434 23.5643 91.2047 23.9282 90.0599C28.7191 74.9916 29.0914 58.8484 24.9765 43.5501C20.8617 28.2519 12.4413 14.4737 0.737731 3.84194C-0.151396 3.03424 -0.255852 1.66288 0.528179 0.752815Z'

/** Figma 5629:14681 — left arc */
const ARC_LEFT_PATH =
  'M3.88895 86.9976C2.712 87.2378 1.56027 86.4786 1.34951 85.2961C-1.47427 69.4517 0.150339 53.1186 6.06415 38.1199C11.978 23.1213 21.9375 10.0745 34.8148 0.420937C35.776 -0.299583 37.1359 -0.0684351 37.8321 0.910406C38.5284 1.88925 38.2973 3.245 37.3371 3.96679C25.1457 13.1312 15.7157 25.5006 10.1109 39.7155C4.50614 53.9305 2.95678 69.4071 5.61302 84.4258C5.82223 85.6086 5.0659 86.7573 3.88895 86.9976Z'

/** Figma 5629:14682 — bottom-right arc */
const ARC_BOTTOM_RIGHT_PATH =
  'M80.0937 0.172421C81.2 0.640467 81.7199 1.9182 81.2243 3.01244C74.3417 18.2101 63.2264 31.1238 49.1878 40.1945C35.1493 49.2653 18.8086 54.0918 2.12511 54.1209C0.923894 54.123 -0.0273328 53.124 0.000595391 51.9231C0.0285235 50.7222 1.02505 49.7743 2.22626 49.7706C18.0378 49.7223 33.521 45.1383 46.8271 36.5409C60.1332 27.9434 70.675 15.7118 77.2168 1.31692C77.7138 0.223337 78.9874 -0.295625 80.0937 0.172421Z'

/** Figma 5629:14683 — bottom-left arc */
const ARC_BOTTOM_LEFT_PATH =
  'M74.6878 61.2914C74.5679 62.4866 73.501 63.361 72.3092 63.2112C55.7559 61.1305 40.1329 54.331 27.3164 43.6026C14.5 32.8742 5.05721 18.6915 0.0959609 2.76281C-0.261252 1.61593 0.411788 0.411829 1.56723 0.083391C2.72268 -0.245047 3.92285 0.426614 4.28157 1.57302C9.00341 16.6631 17.9609 30.0983 30.1086 40.267C42.2564 50.4357 57.0582 56.889 72.7438 58.8815C73.9354 59.0329 74.8078 60.0961 74.6878 61.2914Z'

const ARC_TOP: RadialDialArcLayout = {
  x: 42.091,
  y: 0.013,
  w: 97.657,
  h: 21.261,
  vbW: 96,
  vbH: 21,
  path: ARC_TOP_PATH,
}

const ARC_RIGHT: RadialDialArcLayout = {
  x: DIAL_SIZE * 0.8152,
  y: DIAL_SIZE * 0.1263,
  w: DIAL_SIZE * (1 - 0.8152),
  h: DIAL_SIZE * (1 - 0.1263 - 0.3394),
  vbW: 33,
  vbH: 93,
  path: ARC_RIGHT_PATH,
}

const ARC_LEFT: RadialDialArcLayout = {
  x: 0,
  y: DIAL_SIZE * 0.0975,
  w: DIAL_SIZE * (1 - 0.7803),
  h: DIAL_SIZE * (1 - 0.0975 - 0.4022),
  vbW: 39,
  vbH: 88,
  path: ARC_LEFT_PATH,
}

const ARC_BOTTOM_RIGHT: RadialDialArcLayout = {
  x: DIAL_SIZE * 0.4887,
  y: DIAL_SIZE * 0.689,
  w: DIAL_SIZE * (1 - 0.4887 - 0.0435),
  h: DIAL_SIZE * (1 - 0.689),
  vbW: 82,
  vbH: 55,
  path: ARC_BOTTOM_RIGHT_PATH,
}

const ARC_BOTTOM_LEFT: RadialDialArcLayout = {
  x: DIAL_SIZE * 0.0221,
  y: DIAL_SIZE * 0.6328,
  w: DIAL_SIZE * (1 - 0.0221 - 0.5486),
  h: DIAL_SIZE * (1 - 0.6328 - 0.0038),
  vbW: 75,
  vbH: 64,
  path: ARC_BOTTOM_LEFT_PATH,
}

/** Figma 5629:14668 — daily walking radial dial (5 fixed slots) */
export const DAILY_WALKING_DIAL_CONFIG: RadialDialConfig<DailyWalkingOption> = {
  idPrefix: 'daily-walking',
  width: 280,
  height: 219,
  dialOffsetX: DIAL_OFFSET_X,
  dialOffsetY: DIAL_OFFSET_Y,
  dialSize: DIAL_SIZE,
  hubRadius: HUB_RADIUS,
  unselectedArcs: [],
  slotSelection: {
    slotArcs: {
      top: ARC_TOP,
      right: ARC_RIGHT,
      left: ARC_LEFT,
      'bottom-right': ARC_BOTTOM_RIGHT,
      'bottom-left': ARC_BOTTOM_LEFT,
    },
    slotOrder: ['top', 'right', 'bottom-right', 'bottom-left', 'left'],
    optionSlots: {
      'under-15m': 'top',
      '15-30m': 'right',
      '30-60m': 'bottom-right',
      '1-2h': 'bottom-left',
      '2h-plus': 'left',
    },
    activeArcStrokeWidth: 4,
  },
  arcGlowBounds: { x: 0, y: -30, width: 180, height: 90 },
  rotationByOption: {
    'under-15m': 0,
    '15-30m': 75,
    '30-60m': 147,
    '1-2h': 220,
    '2h-plus': 292,
  },
  pills: [
    { id: 'under-15m', label: '< 15 m', className: 'left-[138px] -top-3' },
    { id: '15-30m', label: '15-30 m', className: 'left-[229px] top-[87px]' },
    { id: '30-60m', label: '30-60 m', className: 'left-[191px] top-[186px]' },
    { id: '1-2h', label: '1-2 h', className: 'left-[31px] top-[179px]' },
    { id: '2h-plus', label: '2h+', className: 'left-[10px] top-[62px]' },
  ],
}

export const DAILY_WALKING_CENTER_LABELS: Record<DailyWalkingOption, string> = {
  'under-15m': '< 15 m',
  '15-30m': '15-30 m',
  '30-60m': '30-60 m',
  '1-2h': '1-2 h',
  '2h-plus': '2h+',
}
