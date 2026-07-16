export const DIAL_PILL_GRADIENT =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 46 33' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='0.3'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='1' gradientTransform='translate(23 16.5) scale(22.5 16)'><stop stop-color='rgba(255,136,0,1)' offset='0.466346'/><stop stop-color='rgba(233,93,92,0.5)' offset='1'/></radialGradient></defs></svg>\")"

/** Gap from arc outer edge to nearest pill edge along the slot radial direction. */
export const RADIAL_PILL_ARC_GAP = 10

export type RadialDialPillConfig = {
  id: string
  label: string
  labelLines?: string[]
  className?: string
}

export type RadialDialArcLayout = {
  x: number
  y: number
  w: number
  h: number
  vbW: number
  vbH: number
  path: string
}

export type RadialDialSelectedGroup = {
  greyPaths?: string[]
  greyArcs?: RadialDialArcLayout[]
  orangePath?: string
  orangeArc?: RadialDialArcLayout
  pointer:
    | { x1: number; y1: number; x2: number; y2: number }
    | {
        translateX: number
        translateY: number
        rotate: number
        lineEndX: number
      }
  pivotX: number
  pivotY: number
}

export type RadialDialSlotSelection<T extends string> = {
  /** Rotated mode (Q2): one arc shape rotated into each slot */
  baseArc?: RadialDialArcLayout
  slotRotations?: Record<string, number>
  /** Fixed mode (Q1): each slot has its own arc layout — no rotation */
  slotArcs?: Record<string, RadialDialArcLayout>
  optionSlots: Record<T, string>
  /** Fixed slot render order — avoids z-index / visual inconsistencies */
  slotOrder: string[]
  /** Distance from dial center to inner arc edge along the pointer direction */
  pointerReachFromCenter?: number
  activeArcStrokeWidth?: number
  /** @deprecated Use pointerReachFromCenter */
  pointerLength?: number
}

export type RadialDialConfig<T extends string> = {
  idPrefix: string
  width: number
  height: number
  dialOffsetX: number
  dialOffsetY: number
  dialSize: number
  hubRadius: number
  unselectedArcs: RadialDialArcLayout[]
  selectedGroup?: RadialDialSelectedGroup
  slotSelection?: RadialDialSlotSelection<T>
  arcGlowBounds?: { x: number; y: number; width: number; height: number }
  rotationByOption: Record<T, number>
  pills: RadialDialPillConfig[]
}

export function getSlotArcLayout(
  slotSelection: NonNullable<RadialDialConfig<string>['slotSelection']>,
  slotId: string,
): { layout: RadialDialArcLayout; rotation: number } {
  const fixed = slotSelection.slotArcs?.[slotId]
  if (fixed) {
    return { layout: fixed, rotation: 0 }
  }

  return {
    layout: slotSelection.baseArc!,
    rotation: slotSelection.slotRotations?.[slotId] ?? 0,
  }
}
